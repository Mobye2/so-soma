import json
import os
import base64
import boto3
from supabase import create_client


SITE_NAME = "煦日之森"
FROM_EMAIL = "noreply@solisforest.com"
SES_REGION = os.environ.get("SES_REGION", "ap-southeast-1")

# Map Cognito trigger source to SES subject/body
EMAIL_TEMPLATES = {
    "CustomEmailSender_SignUp": {
        "subject": "驗證你的帳號｜煦日之森",
        "body": lambda code, email: (
            f"歡迎加入煦日之森。\n\n"
            f"請輸入以下驗證碼完成註冊：\n\n"
            f"    {code}\n\n"
            f"驗證碼 10 分鐘內有效。\n\n"
            f"煦日之森・Solis Forest"
        ),
    },
    "CustomEmailSender_ResendCode": {
        "subject": "重新發送驗證碼｜煦日之森",
        "body": lambda code, email: (
            f"你的新驗證碼：\n\n"
            f"    {code}\n\n"
            f"驗證碼 10 分鐘內有效。\n\n"
            f"煦日之森・Solis Forest"
        ),
    },
    "CustomEmailSender_ForgotPassword": {
        "subject": "重設密碼｜煦日之森",
        "body": lambda code, email: (
            f"你申請了重設密碼。\n\n"
            f"請輸入以下驗證碼：\n\n"
            f"    {code}\n\n"
            f"驗證碼 10 分鐘內有效，若非本人操作請忽略此信。\n\n"
            f"煦日之森・Solis Forest"
        ),
    },
    "CustomEmailSender_UpdateUserAttribute": {
        "subject": "確認變更｜煦日之森",
        "body": lambda code, email: (
            f"你的帳號資料變更驗證碼：\n\n"
            f"    {code}\n\n"
            f"驗證碼 10 分鐘內有效。\n\n"
            f"煦日之森・Solis Forest"
        ),
    },
}


def decrypt_code(encrypted_code: str) -> str:
    """Decrypt Cognito one-time code using KMS."""
    kms_key_id = os.environ.get("KMS_KEY_ID")
    if not kms_key_id:
        raise ValueError("KMS_KEY_ID not set")

    kms = boto3.client("kms")
    decrypted = kms.decrypt(
        CiphertextBlob=base64.b64decode(encrypted_code),
        EncryptionContext={"LambdaFunctionName": os.environ.get("AWS_LAMBDA_FUNCTION_NAME", "")},
    )
    return decrypted["Plaintext"].decode("utf-8")


def handler(event, context):
    """
    Cognito Custom Email Sender Lambda trigger.
    Replaces Cognito's default email with SES.

    Cognito passes:
        triggerSource, request.userAttributes.email, request.code (KMS-encrypted)
    """
    trigger_source = event.get("triggerSource", "")
    user_attrs = event.get("request", {}).get("userAttributes", {})
    email = user_attrs.get("email", "")
    encrypted_code = event.get("request", {}).get("code", "")

    if not email or not encrypted_code:
        print(f"auth_email_hook: missing email or code for {trigger_source}")
        return event  # Must return event unchanged for Cognito

    template = EMAIL_TEMPLATES.get(trigger_source)
    if not template:
        print(f"auth_email_hook: unhandled trigger {trigger_source}")
        return event

    try:
        code = decrypt_code(encrypted_code)
    except Exception as e:
        print(f"KMS decrypt failed: {e}")
        return event

    subject = template["subject"]
    body = template["body"](code, email)

    try:
        ses = boto3.client("ses", region_name=SES_REGION)
        ses.send_email(
            Source=f"{SITE_NAME} <{FROM_EMAIL}>",
            Destination={"ToAddresses": [email]},
            Message={
                "Subject": {"Data": subject, "Charset": "UTF-8"},
                "Body": {"Text": {"Data": body, "Charset": "UTF-8"}},
            },
        )
        print(f"auth_email_hook: sent {trigger_source} to {email}")
    except Exception as e:
        print(f"SES send failed: {e}")

    # Always return the event unchanged
    return event
