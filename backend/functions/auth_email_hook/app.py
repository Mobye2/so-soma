import json
import os
import base64
import boto3

SES_REGION = os.environ.get("SES_REGION", "ap-southeast-1")
SITE_NAME = "煦日之森"
FROM_EMAIL = "noreply@solisforest.com"

EMAIL_TEMPLATES = {
    "CustomEmailSender_SignUp": {
        "subject": "驗證你的帳號｜煦日之森",
        "body": lambda code: (
            f"歡迎加入煦日之森。\n\n"
            f"請輸入以下驗證碼完成註冊：\n\n    {code}\n\n"
            f"驗證碼 10 分鐘內有效。\n\n煦日之森・Solis Forest"
        ),
    },
    "CustomEmailSender_ResendCode": {
        "subject": "重新發送驗證碼｜煦日之森",
        "body": lambda code: (
            f"你的新驗證碼：\n\n    {code}\n\n"
            f"驗證碼 10 分鐘內有效。\n\n煦日之森・Solis Forest"
        ),
    },
    "CustomEmailSender_ForgotPassword": {
        "subject": "重設密碼｜煦日之森",
        "body": lambda code: (
            f"你申請了重設密碼。\n\n請輸入以下驗證碼：\n\n    {code}\n\n"
            f"驗證碼 10 分鐘內有效，若非本人操作請忽略此信。\n\n煦日之森・Solis Forest"
        ),
    },
    "CustomEmailSender_UpdateUserAttribute": {
        "subject": "確認變更｜煦日之森",
        "body": lambda code: (
            f"你的帳號資料變更驗證碼：\n\n    {code}\n\n"
            f"驗證碼 10 分鐘內有效。\n\n煦日之森・Solis Forest"
        ),
    },
}


def handler(event, context):
    trigger_source = event.get("triggerSource", "")
    user_attrs = event.get("request", {}).get("userAttributes", {})
    email = user_attrs.get("email", "")
    encrypted_code = event.get("request", {}).get("code", "")

    if not email or not encrypted_code:
        return event

    template = EMAIL_TEMPLATES.get(trigger_source)
    if not template:
        return event

    try:
        kms = boto3.client("kms")
        decrypted = kms.decrypt(
            CiphertextBlob=base64.b64decode(encrypted_code),
            EncryptionContext={"LambdaFunctionName": os.environ.get("AWS_LAMBDA_FUNCTION_NAME", "")},
        )
        code = decrypted["Plaintext"].decode("utf-8")
    except Exception as e:
        print(f"KMS decrypt failed: {e}")
        return event

    try:
        ses = boto3.client("ses", region_name=SES_REGION)
        ses.send_email(
            Source=f"{SITE_NAME} <{FROM_EMAIL}>",
            Destination={"ToAddresses": [email]},
            Message={
                "Subject": {"Data": template["subject"], "Charset": "UTF-8"},
                "Body": {"Text": {"Data": template["body"](code), "Charset": "UTF-8"}},
            },
        )
        print(f"auth_email_hook: sent {trigger_source} to {email}")
    except Exception as e:
        print(f"SES send failed: {e}")

    return event
