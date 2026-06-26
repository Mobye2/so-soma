import json
import os
import hashlib
import urllib.parse
import time
from datetime import datetime


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
        merchant_id = "2000132"
        hash_key = "5294y06JbISpM5x9"
        hash_iv = "v77hoKGq4kWxNNIS"
        api_base = "https://dhthoeib97.execute-api.ap-east-2.amazonaws.com/prod"
        site_url = "https://www.solisforest.com"

        now = datetime.now()
        merchant_trade_date = now.strftime("%Y/%m/%d %H:%M:%S")
        trade_no = f"TEST{int(time.time() * 1000)}"[:20]

        params = {
            "MerchantID": merchant_id,
            "MerchantTradeNo": trade_no,
            "MerchantTradeDate": merchant_trade_date,
            "PaymentType": "aio",
            "TotalAmount": "10",
            "TradeDesc": "Test Order",
            "ItemName": "測試商品",
            "ReturnURL": f"{api_base}/ecpay-callback-test",
            "OrderResultURL": f"{site_url}/order-success?orderId=test-123",
            "ChoosePayment": "Credit",
            "EncryptType": "1",
            "CustomField1": "test-order-123",
        }

        params["CheckMacValue"] = generate_check_mac_value(params, hash_key, hash_iv)

        ecpay_url = "https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5"
        return {
            "statusCode": 200,
            "headers": {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"},
            "body": json.dumps({"paymentUrl": ecpay_url, "params": params}),
        }

    except Exception as e:
        print(f"error: {e}")
        return {
            "statusCode": 500,
            "headers": {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"},
            "body": json.dumps({"error": str(e)}),
        }
