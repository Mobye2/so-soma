import json
import os
import hashlib
import urllib.parse
import boto3
from datetime import datetime, timezone, timedelta
from supabase import create_client, Client


def get_supabase_client() -> Client:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise ValueError("Missing Supabase credentials")
    return create_client(url, key)


def generate_check_mac_value(params: dict, hash_key: str, hash_iv: str) -> str:
    sorted_params = sorted(params.items(), key=lambda x: x[0].lower())
    raw = "&".join(f"{k}={v}" for k, v in sorted_params)
    raw = f"HashKey={hash_key}&{raw}&HashIV={hash_iv}"
    encoded = urllib.parse.quote_plus(raw).lower()
    for old, new in [("%2d", "-"), ("%5f", "_"), ("%2e", "."),
                     ("%21", "!"), ("%2a", "*"), ("%28", "("),
                     ("%29", ")"), ("%20", "+")]:
        encoded = encoded.replace(old, new)
    return hashlib.sha256(encoded.encode("utf-8")).hexdigest().upper()


def grant_course_access(supabase: Client, order_id: str):
    result = supabase.table("orders").select(
        "user_id"
    ).eq("id", order_id).execute()
    order_data = result.data[0] if result.data else None
    if not order_data or not order_data.get("user_id"):
        print(f"Order {order_id} has no user_id, skipping course access")
        return

    user_id = order_data["user_id"]

    items = supabase.table("order_items").select(
        "product_id"
    ).eq("order_id", order_id).execute().data or []

    for item in items:
        product_id = item.get("product_id")
        if not product_id:
            continue
        course = supabase.table("courses").select("id, access_days").eq(
            "product_id", product_id
        ).execute().data
        if not course:
            continue
        course_id = course[0]["id"]
        access_days = course[0].get("access_days")
        expires_at = None
        if access_days:
            expires_at = (datetime.now(timezone.utc) + timedelta(days=access_days)).isoformat()

        supabase.table("user_course_access").upsert({
            "user_id": user_id,
            "course_id": course_id,
            "order_id": order_id,
            "expires_at": expires_at,
        }, on_conflict="user_id,course_id").execute()
        print(f"Granted access: user={user_id} course={course_id} expires={expires_at}")


def send_payment_success_email(supabase: Client, order_id: str):
    """Invoke send_transactional_email Lambda for payment success"""
    order = supabase.table("orders").select(
        "customer_name, customer_email, total_amount"
    ).eq("id", order_id).single().execute().data
    if not order or not order.get("customer_email"):
        return

    items = supabase.table("order_items").select(
        "product_title, quantity, unit_price"
    ).eq("order_id", order_id).execute().data or []

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
        InvocationType="Event",
        Payload=json.dumps(payload),
    )


def handler(event, context):
    """Handle ECPay payment callback (form-urlencoded POST)"""
    try:
        body_str = event.get("body", "") or ""
        if event.get("isBase64Encoded"):
            import base64
            body_str = base64.b64decode(body_str).decode("utf-8")

        print(f"RAW BODY: {repr(body_str)}")
        params = dict(urllib.parse.parse_qsl(body_str, keep_blank_values=True))
        print(f"ECPay callback: {json.dumps(params, ensure_ascii=False)}")

        hash_key = os.environ.get("ECPAY_HASH_KEY", "").strip()
        hash_iv = os.environ.get("ECPAY_HASH_IV", "").strip()

        received_mac = params.pop("CheckMacValue", "")
        calculated_mac = generate_check_mac_value(params, hash_key, hash_iv)

        if received_mac != calculated_mac:
            print(f"CheckMacValue mismatch: {received_mac} != {calculated_mac}")
            return {"statusCode": 200, "body": "0|CheckMacValue Error"}

        order_id = params.get("CustomField1")
        rtn_code = params.get("RtnCode")

        if not order_id:
            return {"statusCode": 200, "body": "0|Missing OrderId"}

        supabase = get_supabase_client()
        new_status = "paid" if rtn_code == "1" else "payment_failed"

        supabase.table("orders").update({
            "status": new_status,
            "notes": f"ECPay RtnCode: {rtn_code}, TradeNo: {params.get('TradeNo', '')}, PaymentDate: {params.get('PaymentDate', '')}",
        }).eq("id", order_id).execute()

        print(f"Order {order_id} updated to {new_status}")

        if new_status == "paid":
            try:
                grant_course_access(supabase, order_id)
            except Exception as e:
                print(f"Grant course access failed: {e}")
            try:
                send_payment_success_email(supabase, order_id)
            except Exception as e:
                print(f"Payment success email failed: {e}")

        return {"statusCode": 200, "body": "1|OK"}

    except Exception as e:
        print(f"ecpay-callback error: {e}")
        return {"statusCode": 200, "body": "0|Error"}
