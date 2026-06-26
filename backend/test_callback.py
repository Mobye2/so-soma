import boto3
import json
import hashlib
import urllib.parse

hash_key = "REMOVED"
hash_iv = "REMOVED"

params = {
    "CustomField1": "20a6668f-bd7b-4735-ab68-5761336197e5",
    "CustomField2": "",
    "CustomField3": "",
    "CustomField4": "",
    "MerchantID": "3416478",
    "MerchantTradeNo": "SOL9999999999999",
    "PaymentDate": "2026/06/24 21:54:14",
    "PaymentType": "Credit_CreditCard",
    "PaymentTypeChargeFee": "6",
    "RtnCode": "1",
    "RtnMsg": "paid",
    "SimulatePaid": "0",
    "StoreID": "",
    "TradeAmt": "10",
    "TradeDate": "2026/06/24 21:53:05",
    "TradeNo": "9999999999999999",
}

sorted_params = sorted(params.items(), key=lambda x: x[0].lower())
raw = "&".join(f"{k}={v}" for k, v in sorted_params)
raw = f"HashKey={hash_key}&{raw}&HashIV={hash_iv}"
encoded = urllib.parse.quote_plus(raw).lower()
for old, new in [("%2d", "-"), ("%5f", "_"), ("%2e", "."), ("%21", "!"), ("%2a", "*"), ("%28", "("), ("%29", ")"), ("%20", "+")]:
    encoded = encoded.replace(old, new)
mac = hashlib.sha256(encoded.encode("utf-8")).hexdigest().upper()

body = "&".join(f"{k}={v}" for k, v in params.items()) + f"&CheckMacValue={mac}"

client = boto3.client("lambda", region_name="ap-east-2")
response = client.invoke(
    FunctionName="solis-backend-EcpayCallbackFunction-iOvxTxviuvlN",
    InvocationType="RequestResponse",
    Payload=json.dumps({"isBase64Encoded": False, "body": body})
)

result = json.loads(response["Payload"].read())
print(json.dumps(result, indent=2, ensure_ascii=False))
