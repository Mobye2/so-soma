import json
import os
import urllib.request
from datetime import datetime, timezone

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]


def sb_get(table, params=""):
    url = f"{SUPABASE_URL}/rest/v1/{table}?{params}"
    req = urllib.request.Request(url, headers={
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    })
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())


def sb_patch(table, params, data):
    url = f"{SUPABASE_URL}/rest/v1/{table}?{params}"
    req = urllib.request.Request(
        url, method="PATCH",
        data=json.dumps(data).encode(),
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        }
    )
    with urllib.request.urlopen(req) as r:
        return r.status


def sb_post(table, data, upsert_on=None):
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    prefer = f"resolution=merge-duplicates" if upsert_on else "return=minimal"
    req = urllib.request.Request(
        url, method="POST",
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


def sb_delete(table, params):
    url = f"{SUPABASE_URL}/rest/v1/{table}?{params}"
    req = urllib.request.Request(
        url, method="DELETE",
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Prefer": "return=minimal",
        }
    )
    with urllib.request.urlopen(req) as r:
        return r.status


def handler(event, context):
    params = event.get("queryStringParameters") or {}
    token = params.get("token", "").strip()

    if not token:
        return _html(400, "<p>退訂連結無效。</p>")

    rows = sb_get("email_unsubscribe_tokens", f"select=email,used_at&token=eq.{token}")

    if not rows:
        return _html(404, "<p>退訂連結不存在或已失效。</p>")

    row = rows[0]
    if row.get("used_at"):
        return _html(200, "<p>你已經退訂成功。</p>")

    email = row["email"].lower()
    now = datetime.now(timezone.utc).isoformat()

    sb_patch("email_unsubscribe_tokens", f"token=eq.{token}", {"used_at": now})
    sb_delete("newsletter_subscribers", f"email=eq.{email}")

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
