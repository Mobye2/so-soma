import json
import os
import hashlib
import urllib.parse
import uuid
import boto3
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
    for old, new in [("%2d", "-"), ("%5f", "_"), ("%2e", "."),
                     ("%21", "!"), ("%2a", "*"), ("%28", "("),
                     ("%29", ")"), ("%20", "+")]:
        encoded = encoded.replace(old, new)

    return hashlib.sha256(encoded.encode("utf-8")).hexdigest().upper()


def send_payment_success_email(supabase: Client, order_id: str):
    """Invoke send_transactional_email Lambda for payment success"""
    order_result = supabase.table("orders").select(
        "customer_name, customer_email, total_amount"
    ).eq("id", order_id).single().execute()
    order = order_result.data
    if not order or not order.get("customer_email"):
        return

    items_result = supabase.table("order_items").select(
        "product_title, quantity, unit_price"
    ).eq("order_id", order_id).execute()
    items = items_result.data or []

    # Invoke send email Lambda
    lambda_client = boto3.client("lambda")
    payload = {
        "httpMethod": "POST",
        "body": json.dumps({
            "templateName": "order-payment-success",
            "recipientEmail": order["customer_email"],
            "idempotencyKey": f"order-paid-{order_id}",
            "templateData": {
                "name": order["customer_name"],
                "orderId": order_id[:8],
                "totalAmount": order["total_amount"],
                "items": [{"title": i["product_title"], "quantity": i["quantity"],
                           "unit_price": i["unit_price"]} for i in items],
            },
        }),
    }
    lambda_client.invoke(
        FunctionName=os.environ.get("SEND_EMAIL_FUNCTION_NAME", "solis-backend-SendTransactionalEmailFunction"),
        InvocationType="Event",  # async
        Payload=json.dumps(payload),
    )


def handler(event, context):
    """Handle ECPay payment callback (form-urlencoded POST)"""
    try:
        # Parse form-urlencoded body
        body_str = event.get("body", "")
        if event.get("isBase64Encoded"):
            import base64
            body_str = base64.b64decode(body_str).decode("utf-8")

        params = dict(urllib.parse.parse_qsl(body_str))
        print(f"ECPay callback: {json.dumps(params)}")

        hash_key = os.environ.get("ECPAY_HASH_KEY", "").strip()
        hash_iv = os.environ.get("ECPAY_HASH_IV", "").strip()

        # Verify CheckMacValue
        received_mac = params.pop("CheckMacValue", "")
        calculated_mac = generate_check_mac_value(params, hash_key, hash_iv)

        if received_mac != calculated_mac:
            print(f"CheckMacValue mismatch: {received_mac} != {calculated_mac}")
            return {"statusCode": 200, "body": "0|CheckMacValue Error"}

        order_id = params.get("CustomField1")
        rtn_code = params.get("RtnCode")  # "1" = success

        if not order_id:
            return {"statusCode": 200, "body": "0|Missing OrderId"}

        supabase = get_supabase_client()
        new_status = "paid" if rtn_code == "1" else "payment_failed"

        supabase.table("orders").update({
            "status": new_status,
            "notes": f"ECPay RtnCode: {rtn_code}, TradeNo: {params.get('TradeNo', '')}, PaymentDate: {params.get('PaymentDate', '')}",
        }).eq("id", order_id).execute()

        print(f"Order {order_id} updated to {new_status}")

        # Send confirmation email on successful payment
        if new_status == "paid":
            try:
                send_payment_success_email(supabase, order_id)
            except Exception as e:
                print(f"Payment success email failed: {e}")

        return {"statusCode": 200, "body": "1|OK"}

    except Exception as e:
        print(f"ecpay-callback error: {e}")
        return {"statusCode": 200, "body": "0|Error"}
