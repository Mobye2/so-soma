import json
import os
import urllib.request
import urllib.parse
import boto3

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]


def supabase_get(table, params=""):
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    if params:
        url += f"?{params}"
    req = urllib.request.Request(url, headers={
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    })
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())


def handler(event, context):
    post_id = event.get("postId") or event.get("post_id")
    title = event.get("title", "")
    excerpt = event.get("excerpt", "")
    url = event.get("url", "https://www.solisforest.com/blog")

    if not post_id or not title:
        return {"statusCode": 400, "error": "postId and title required"}

    subscribers = supabase_get("newsletter_subscribers", "select=email")

    if not subscribers:
        return {"statusCode": 200, "sent": 0, "total": 0}

    lambda_client = boto3.client("lambda")
    send_fn = os.environ.get(
        "SEND_EMAIL_FUNCTION_NAME",
        "solis-backend-SendTransactionalEmailFunction",
    )

    sent = 0
    for sub in subscribers:
        email = sub.get("email")
        if not email:
            continue
        try:
            lambda_client.invoke(
                FunctionName=send_fn,
                InvocationType="Event",
                Payload=json.dumps({
                    "httpMethod": "POST",
                    "body": json.dumps({
                        "templateName": "blog-post-subscriber-notice",
                        "recipientEmail": email,
                        "idempotencyKey": f"post-{post_id}-{email}",
                        "templateData": {"name": "", "title": title, "excerpt": excerpt, "url": url},
                    }),
                }),
            )
            sent += 1
        except Exception as e:
            print(f"Failed for {email}: {e}")

    print(f"Notified {sent}/{len(subscribers)} for post {post_id}")
    return {"statusCode": 200, "sent": sent, "total": len(subscribers)}
