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
    Triggered by SNS → SES bounce/complaint notifications.
    Adds affected emails to suppressed_emails table.
    """
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
            complaint = sns_message.get("complaint", {})
            reason = "complaint"
            recipients = complaint.get("complainedRecipients", [])
        else:
            continue

        if not recipients:
            continue

        supabase = get_supabase()
        now = datetime.now(timezone.utc).isoformat()

        rows = [
            {"email": r["emailAddress"].lower(), "reason": reason, "created_at": now}
            for r in recipients
            if r.get("emailAddress")
        ]

        if rows:
            supabase.table("suppressed_emails").upsert(
                rows, on_conflict="email"
            ).execute()

            # Deactivate subscribers
            emails = [r["email"] for r in rows]
            for email in emails:
                supabase.table("subscribers").update(
                    {"is_active": False}
                ).eq("email", email).execute()

    return {"statusCode": 200}
