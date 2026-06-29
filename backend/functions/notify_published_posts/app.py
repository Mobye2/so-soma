import json
import os
import urllib.request
import boto3

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
COGNITO_REGION = os.environ.get("COGNITO_REGION", "ap-east-2")
COGNITO_USER_POOL_ID = os.environ.get("COGNITO_USER_POOL_ID", "")


def cors(status, body):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
        },
        "body": json.dumps(body),
    }


def verify_admin_token(token):
    import base64, time

    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError("Invalid token format")

    def b64_decode(s):
        s += "=" * (-len(s) % 4)
        return base64.urlsafe_b64decode(s)

    header = json.loads(b64_decode(parts[0]))
    kid = header.get("kid")

    jwks_url = f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}/.well-known/jwks.json"
    with urllib.request.urlopen(jwks_url, timeout=5) as r:
        jwks = json.loads(r.read())

    key_data = next((k for k in jwks["keys"] if k["kid"] == kid), None)
    if not key_data:
        raise ValueError("Key not found")

    try:
        from jose import jwt as jose_jwt
        payload = jose_jwt.decode(token, key_data, algorithms=["RS256"], options={"verify_aud": False})
    except ImportError:
        payload = json.loads(b64_decode(parts[1]))

    if payload.get("exp", 0) < time.time():
        raise ValueError("Token expired")

    if "admin" not in payload.get("cognito:groups", []):
        raise PermissionError("Admin only")


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
    if event.get("httpMethod") == "OPTIONS":
        return cors(200, {})

    # HTTP 呼叫（從後台發布文章觸發）
    if event.get("httpMethod") == "POST":
        auth_header = (event.get("headers") or {}).get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return cors(401, {"error": "Missing token"})
        try:
            verify_admin_token(auth_header[7:])
        except PermissionError as e:
            return cors(403, {"error": str(e)})
        except Exception as e:
            return cors(401, {"error": f"Invalid token: {e}"})

        body = json.loads(event.get("body") or "{}")
        post_id = body.get("postId") or body.get("post_id")
        title = body.get("title", "")
        excerpt = body.get("excerpt", "")
        url = body.get("url", "https://www.solisforest.com/blog")
    else:
        # 直接 Lambda invoke（保留向下相容）
        post_id = event.get("postId") or event.get("post_id")
        title = event.get("title", "")
        excerpt = event.get("excerpt", "")
        url = event.get("url", "https://www.solisforest.com/blog")

    if not post_id or not title:
        return cors(400, {"error": "postId and title required"})

    subscribers = supabase_get("newsletter_subscribers", "select=email")
    if not subscribers:
        return cors(200, {"sent": 0, "total": 0})

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
    return cors(200, {"sent": sent, "total": len(subscribers)})
