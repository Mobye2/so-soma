import json
import os
import urllib.request
from datetime import datetime, timezone

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]


def sb_post(table, data, upsert_on=None):
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    prefer = "resolution=merge-duplicates" if upsert_on else "return=minimal"
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
    for record in event.get("Records", []):
        try:
            sns_message = json.loads(record["Sns"]["Message"])
        except (KeyError, json.JSONDecodeError):
            continue

        notification_type = sns_message.get("notificationType")

        if notification_type == "Bounce":
            bounce = sns_message.get("bounce", {})
            reason = "bounce_" + bounce.get("bounceType", "unknown").lower()
            recipients = bounce.get("bouncedRecipients", [])
        elif notification_type == "Complaint":
            reason = "complaint"
            recipients = sns_message.get("complaint", {}).get("complainedRecipients", [])
        else:
            continue

        emails = [r["emailAddress"].lower() for r in recipients if r.get("emailAddress")]
        if not emails:
            continue

        rows = [{"email": e, "reason": reason} for e in emails]
        sb_post("suppressed_emails", rows, upsert_on="email")

        for email in emails:
            sb_delete("newsletter_subscribers", f"email=eq.{email}")

    return {"statusCode": 200}
