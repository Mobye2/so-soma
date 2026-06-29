import json
import os
import uuid
import secrets
import boto3
import urllib.request

SITE_NAME = "煦日之森"
FROM_EMAIL = "noreply@solisforest.com"
SES_REGION = os.environ.get("SES_REGION", "ap-southeast-1")
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

SUBJECTS = {
    "event-registration-confirmation": lambda d: f"報名收到了｜{d.get('eventTitle', '活動')}・煦日之森",
    "order-payment-success": lambda d: f"付款成功｜訂單 {d.get('orderId', '')}・煦日之森",
    "contact-confirmation": lambda _: "已收到你的訊息｜煦日之森",
    "welcome-member": lambda _: "歡迎加入｜煦日之森",
    "quiz-result": lambda _: "你的測驗結果｜煦日之森",
    "blog-post-published": lambda d: f"新文章發佈｜{d.get('title', '')}・煦日之森",
    "blog-post-subscriber-notice": lambda d: f"新文章｜{d.get('title', '')}・煦日之森",
    "launch-notify": lambda d: f"你等待的「{d.get('product_name', '商品')}」現已上架｜煦日之森",
}

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
    "launch-notify": lambda d: (
        f"{d.get('name', '')}，你好\n\n"
        f"你之前登記希望收到「{d.get('product_name', '商品')}」的上架通知。\n\n"
        f"好消息！這個商品現在已經正式上架了。\n\n"
        f"立即前往：{d.get('url', 'https://www.solisforest.com/shop')}\n\n"
        "煦日之森・Solis Forest"
    ),
}


def sb_get(table, params=""):
    url = f"{SUPABASE_URL}/rest/v1/{table}?{params}"
    req = urllib.request.Request(url, headers={
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    })
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())


def sb_post(table, data, prefer="return=minimal"):
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/{table}",
        method="POST",
        data=json.dumps(data).encode(),
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": prefer,
        }
    )
    with urllib.request.urlopen(req) as r:
        return r.status


def get_or_create_token(email):
    rows = sb_get("email_unsubscribe_tokens", f"select=token,used_at&email=eq.{email}")
    if rows and not rows[0].get("used_at"):
        return rows[0]["token"]
    # Delete old token and create fresh one
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/email_unsubscribe_tokens?email=eq.{email}",
        method="DELETE",
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Prefer": "return=minimal",
        }
    )
    with urllib.request.urlopen(req): pass
    token = secrets.token_hex(32)
    sb_post("email_unsubscribe_tokens", {"token": token, "email": email})
    return token


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
        recipient_email = (body.get("recipientEmail") or body.get("recipient_email") or "").lower().strip()
        template_data = body.get("templateData", {})

        if not template_name or not recipient_email:
            return _resp(400, {"error": "templateName and recipientEmail required"})

        subject_fn = SUBJECTS.get(template_name)
        if not subject_fn:
            return _resp(404, {"error": f"Template '{template_name}' not found"})

        subject = subject_fn(template_data)
        body_fn = BODIES.get(template_name)
        text_body = body_fn(template_data) if body_fn else "來自煦日之森的通知"

        # Add unsubscribe footer
        unsub_token = get_or_create_token(recipient_email)
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

        # Log
        message_id = str(uuid.uuid4())
        sb_post("email_send_log", {
            "message_id": message_id,
            "template_name": template_name,
            "recipient_email": recipient_email,
            "status": "sent",
        })

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
