import boto3
import json

# 用上次真實 ECPay 送來的 raw body（從 log 取得）
raw_body = "CustomField1=20a6668f-bd7b-4735-ab68-5761336197e5&CustomField2=&CustomField3=&CustomField4=&MerchantID=3416478&MerchantTradeNo=SOL1782309185068&PaymentDate=2026/06/24 21:54:14&PaymentType=Credit_CreditCard&PaymentTypeChargeFee=6&RtnCode=1&RtnMsg=\xa5\xe6\xa9\xf6\xa6\xa8\xa5\x5c&SimulatePaid=0&StoreID=&TradeAmt=10&TradeDate=2026/06/24 21:53:05&TradeNo=2606242153057729&CheckMacValue=D2959BA576A6A9927F3197701D74384538B9815EF3A5DB5E59E2E0215CE379B4"

import base64
encoded_body = base64.b64encode(raw_body.encode("latin-1")).decode("ascii")

client = boto3.client("lambda", region_name="ap-east-2")
response = client.invoke(
    FunctionName="solis-backend-EcpayCallbackFunction-iOvxTxviuvlN",
    InvocationType="RequestResponse",
    Payload=json.dumps({"isBase64Encoded": True, "body": encoded_body})
)

result = json.loads(response["Payload"].read())
print(json.dumps(result, indent=2, ensure_ascii=False))
