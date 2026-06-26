import json
import os
import uuid
import secrets
import boto3
from supabase import create_client, Client

SITE_NAME = "煦日之森"
FROM_EMAIL = "noreply@solisforest.com"
SES_REGION = os.environ.get("SES_REGION", "ap-southeast-1")

# Email subject templates
SUBJECTS = {
    "event-registration-confirmation": lambda d: f"報名收到了｜{d.get('eventTitle', '活動')}・煦日之森",
    "order-payment-success": lambda d: f"付款成功｜訂單 {d.get('orderId', '')}・煦日之森",
    "contact-confirmation": lambda _: "已收到你的訊息｜煦日之森",
    "welcome-member": lambda _: "歡迎加入｜煦日之森",
    "quiz-result": lambda _: "你的測驗結果｜煦日之森",
    "blog-post-published": lambda d: f"新文章發佈｜{d.get('title', '')}・煦日之森",
    "blog-post-subscriber-notice": lambda d: f"新文章｜{d.get('title', '')}・煦日之森",
}

# Plain text email bodies
BODIES = {
    "event-registration-confirmation": lambda d: (
        f"{d.get('name', '')}，歡迎你\n\n"
        f"我們已收到你報名「{d.get('eventTitle', '活動')}」的訊息。\n\n"
        "Kaia 將在活動前以 Email 或 Instagram 私訊與你確認集合地點、時間與當日注意事項。\n"
        "請留意你的收件匣，若一週內未收到請來信告知。\n\n"
        "期待與你在森林相遇。\n煦日之森・Solis Forest"
    ),
    "order-payment-success": lambda d: (
        f"{d.get('name', '')}，付款成功\n\n"
        f"訂單編號：{d.get('orderId', '')}\n"
        f"總金額：NT${d.get('totalAmount', 0):,}\n\n"
        "若是課程或電子書，將由 Kaia 親自寄送觀看連結；若是實體活動，我們會在活動前與你確認細節。\n\n"
        "謝謝你的支持。\n煦日之森・Solis Forest"
    ),
    "contact-confirmation": lambda d: (
        f"{d.get('name', '')}，你好\n\n"
        "我們已收到你的訊息，會盡快回覆你。\n\n"
        "煦日之森・Solis Forest"
    ),
    "welcome-member": lambda d: (
        f"{d.get('name', '')}，歡迎加入煦日之森\n\n"
        "很高興你在這裡。\n\n"
        "煦日之森・Solis Forest"
    ),
    "blog-post-subscriber-notice": lambda d: (
        f"{d.get('name', '')}，你好\n\n"
        f"煦日之森有新文章：《{d.get('title', '')}》\n\n"
        f"{d.get('excerpt', '')}\n\n"
        f"閱讀全文：{d.get('url', 'https://www.solisforest.com/blog')}\n\n"
        "煦日之森・Solis Forest"
    ),
}


def get_supabase_client() -> Client:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise ValueError("Missing Supabase credentials")
    return create_client(url, key)


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
        template_name = body.get("templateName") or body.get("template_name")
        recipient_email = body.get("recipientEmail") or body.get("recipient_email")
        idempotency_key = body.get("idempotencyKey") or body.get("idempotency_key") or str(uuid.uuid4())
        template_data = body.get("templateData", {})

        if not template_name or not recipient_email:
            return _resp(400, {"error": "templateName and recipientEmail required"})

        supabase = get_supabase_client()
        message_id = str(uuid.uuid4())

        # Check suppression list
        suppressed = supabase.table("suppressed_emails").select("id").eq(
            "email", recipient_email.lower()
        ).execute()

        if suppressed.data and len(suppressed.data) > 0:
            supabase.table("email_send_log").insert({
                "message_id": message_id,
                "template_name": template_name,
                "recipient_email": recipient_email,
                "status": "suppressed",
            }).execute()
            return _resp(200, {"success": False, "reason": "email_suppressed"})

        # Get or create unsubscribe token
        token_result = supabase.table("email_unsubscribe_tokens").select(
            "token, used_at"
        ).eq("email", recipient_email.lower()).execute()

        token_row = token_result.data[0] if token_result.data else None
        if token_row and not token_row.get("used_at"):
            unsub_token = token_row["token"]
        elif not token_row:
            unsub_token = secrets.token_hex(32)
            supabase.table("email_unsubscribe_tokens").upsert(
                {"token": unsub_token, "email": recipient_email.lower()},
                on_conflict="email",
            ).execute()
        else:
            # Token used but not suppressed - safety fallback
            supabase.table("email_send_log").insert({
                "message_id": message_id,
                "template_name": template_name,
                "recipient_email": recipient_email,
                "status": "suppressed",
            }).execute()
            return _resp(200, {"success": False, "reason": "email_suppressed"})

        # Resolve subject and body
        subject_fn = SUBJECTS.get(template_name)
        if not subject_fn:
            return _resp(404, {"error": f"Template '{template_name}' not found"})

        subject = subject_fn(template_data)
        body_fn = BODIES.get(template_name)
        text_body = body_fn(template_data) if body_fn else f"來自煦日之森的通知"

        # Add unsubscribe footer
        unsub_url = f"https://www.solisforest.com/unsubscribe?token={unsub_token}"
        text_body += f"\n\n---\n如果你不想再收到信件：{unsub_url}"

        # Send via SES
        ses = boto3.client("ses", region_name=SES_REGION)
        ses.send_email(
            Source=f"{SITE_NAME} <{FROM_EMAIL}>",
            Destination={"ToAddresses": [recipient_email]},
            Message={
                "Subject": {"Data": subject, "Charset": "UTF-8"},
                "Body": {"Text": {"Data": text_body, "Charset": "UTF-8"}},
            },
        )

        # Log success
        supabase.table("email_send_log").insert({
            "message_id": message_id,
            "template_name": template_name,
            "recipient_email": recipient_email,
            "status": "sent",
        }).execute()

        return _resp(200, {"success": True})

    except Exception as e:
        print(f"send-transactional-email error: {e}")
        return _resp(500, {"error": "Internal server error"})


def _resp(status, body):
    return {
        "statusCode": status,
        "headers": {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"},
        "body": json.dumps(body),
    }
