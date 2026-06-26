import json
import os
from datetime import datetime, timezone
from supabase import create_client


def get_supabase():
    return create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_ROLE_KEY"],
    )


def handler(event, context):
    """
    GET /unsubscribe?token=<hex>
    Marks the token as used and adds the email to suppressed_emails.
    """
    params = event.get("queryStringParameters") or {}
    token = params.get("token", "").strip()

    if not token:
        return _html(400, "<p>退訂連結無效。</p>")

    supabase = get_supabase()

    # Look up token
    result = supabase.table("email_unsubscribe_tokens").select(
        "email, used_at"
    ).eq("token", token).execute()

    if not result.data:
        return _html(404, "<p>退訂連結不存在或已失效。</p>")

    row = result.data[0]
    if row.get("used_at"):
        return _html(200, "<p>你已經退訂成功。</p>")

    email = row["email"].lower()
    now = datetime.now(timezone.utc).isoformat()

    # Mark token used
    supabase.table("email_unsubscribe_tokens").update(
        {"used_at": now}
    ).eq("token", token).execute()

    # Add to suppression list
    supabase.table("suppressed_emails").upsert(
        {"email": email, "reason": "unsubscribe"},
        on_conflict="email",
    ).execute()

    # Remove from newsletter_subscribers
    supabase.table("newsletter_subscribers").delete().eq(
        "email", email
    ).execute()

    return _html(200, "<p>已為你取消訂閱。你不會再收到我們的電子報。</p>")


def _html(status, body_html):
    html = f"""<!DOCTYPE html>
<html lang="zh-Hant">
<head><meta charset="UTF-8"><title>煦日之森・退訂</title></head>
<body style="font-family:sans-serif;max-width:480px;margin:80px auto;text-align:center;">
<h2>煦日之森</h2>
{body_html}
<p><a href="https://www.solisforest.com">回首頁</a></p>
</body>
</html>"""
    return {
        "statusCode": status,
        "headers": {"Content-Type": "text/html; charset=utf-8"},
        "body": html,
    }
