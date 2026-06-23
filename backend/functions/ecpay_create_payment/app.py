import json
import os
import hashlib
import urllib.parse
import time
from datetime import datetime
from supabase import create_client, Client


def get_supabase_client() -> Client:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise ValueError("Missing Supabase credentials")
    return create_client(url, key)


def generate_check_mac_value(params: dict, hash_key: str, hash_iv: str) -> str:
    """Generate ECPay CheckMacValue (SHA256)"""
    sorted_params = sorted(params.items(), key=lambda x: x[0].lower())
    raw = "&".join(f"{k}={v}" for k, v in sorted_params)
    raw = f"HashKey={hash_key}&{raw}&HashIV={hash_iv}"

    encoded = urllib.parse.quote_plus(raw).lower()
    # ECPay special character replacements
    for old, new in [("%2d", "-"), ("%5f", "_"), ("%2e", "."),
                     ("%21", "!"), ("%2a", "*"), ("%28", "("),
                     ("%29", ")"), ("%20", "+")]:
        encoded = encoded.replace(old, new)

    return hashlib.sha256(encoded.encode("utf-8")).hexdigest().upper()


def handler(event, context):
    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "authorization, content-type",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
            },
        }

    try:
        body = json.loads(event.get("body", "{}"))
        order_id = body.get("orderId")

        if not order_id:
            return _resp(400, {"error": "Missing orderId"})

        supabase = get_supabase_client()

        # Get order
        result = supabase.table("orders").select("*").eq("id", order_id).single().execute()
        order = result.data
        if not order:
            return _resp(404, {"error": "Order not found"})

        # Get order items
        items_result = supabase.table("order_items").select("*").eq("order_id", order_id).execute()
        items = items_result.data or []

        # Build item name
        if items:
            item_names = "#".join(f"{i['product_title']} x{i['quantity']}" for i in items)
        else:
            item_names = "Event Registration"

        merchant_id = os.environ.get("ECPAY_MERCHANT_ID", "").strip()
        hash_key = os.environ.get("ECPAY_HASH_KEY", "").strip()
        hash_iv = os.environ.get("ECPAY_HASH_IV", "").strip()

        if not merchant_id or not hash_key or not hash_iv:
            return _resp(500, {"error": "Missing ECPay credentials"})

        now = datetime.now()
        merchant_trade_date = now.strftime("%Y/%m/%d %H:%M:%S")
        trade_no = f"SOL{int(time.time() * 1000)}"

        # Get origin from headers for return URL
        headers = event.get("headers", {})
        site_url = headers.get("origin") or headers.get("Origin") or "https://www.solisforest.com"
        api_base = os.environ.get("API_BASE_URL", "")

        params = {
            "MerchantID": merchant_id,
            "MerchantTradeNo": trade_no[:20],
            "MerchantTradeDate": merchant_trade_date,
            "PaymentType": "aio",
            "TotalAmount": str(int(order["total_amount"])),
            "TradeDesc": "Solis Online Order",
            "ItemName": item_names[:200],
            "ReturnURL": f"{api_base}/ecpay-callback",
            "OrderResultURL": f"{site_url}/order-success?orderId={order_id}",
            "ChoosePayment": "Credit",
            "EncryptType": "1",
            "CustomField1": order_id,
        }

        params["CheckMacValue"] = generate_check_mac_value(params, hash_key, hash_iv)

        # Update order with trade number
        notes = order.get("notes") or ""
        supabase.table("orders").update({
            "notes": f"ECPay TradeNo: {trade_no}" + (f" | {notes}" if notes else "")
        }).eq("id", order_id).execute()

        ecpay_url = "https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5"

        return _resp(200, {"paymentUrl": ecpay_url, "params": params})

    except Exception as e:
        print(f"ecpay-create-payment error: {e}")
        return _resp(500, {"error": "Internal server error"})


def _resp(status, body):
    return {
        "statusCode": status,
        "headers": {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"},
        "body": json.dumps(body),
    }
