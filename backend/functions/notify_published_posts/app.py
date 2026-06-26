import json
import os
import boto3
from supabase import create_client


def get_supabase():
    return create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_ROLE_KEY"],
    )


def handler(event, context):
    """
    Triggered manually or via EventBridge when a blog post is published.

    Expected event payload:
    {
        "postId": "...",
        "title": "文章標題",
        "excerpt": "文章摘要",
        "url": "https://www.solisforest.com/blog/..."
    }
    """
    post_id = event.get("postId") or event.get("post_id")
    title = event.get("title", "")
    excerpt = event.get("excerpt", "")
    url = event.get("url", "https://www.solisforest.com/blog")

    if not post_id or not title:
        print("Missing postId or title")
        return {"statusCode": 400, "error": "postId and title required"}

    supabase = get_supabase()

    # newsletter_subscribers only has: id, email, source, created_at
    result = supabase.table("newsletter_subscribers").select("email").execute()

    subscribers = result.data or []
    if not subscribers:
        print("No subscribers")
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

        payload = {
            "httpMethod": "POST",
            "body": json.dumps({
                "templateName": "blog-post-subscriber-notice",
                "recipientEmail": email,
                "idempotencyKey": f"post-{post_id}-{email}",
                "templateData": {
                    "name": "",
                    "title": title,
                    "excerpt": excerpt,
                    "url": url,
                },
            }),
        }

        try:
            lambda_client.invoke(
                FunctionName=send_fn,
                InvocationType="Event",
                Payload=json.dumps(payload),
            )
            sent += 1
        except Exception as e:
            print(f"Failed to invoke for {email}: {e}")

    print(f"Notified {sent}/{len(subscribers)} subscribers for post {post_id}")
    return {"statusCode": 200, "sent": sent, "total": len(subscribers)}
