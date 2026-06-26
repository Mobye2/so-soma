import json
import os
import time
import base64
import urllib.request

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
COGNITO_REGION = os.environ.get("COGNITO_REGION", "ap-east-2")
COGNITO_USER_POOL_ID = os.environ["COGNITO_USER_POOL_ID"]

_jwks_cache = None


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


def b64_decode(s):
    s += "=" * (-len(s) % 4)
    return base64.urlsafe_b64decode(s)


def verify_token(token):
    global _jwks_cache
    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError("Invalid token")

    header = json.loads(b64_decode(parts[0]))
    kid = header.get("kid")

    if not _jwks_cache:
        url = f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}/.well-known/jwks.json"
        with urllib.request.urlopen(url, timeout=5) as r:
            _jwks_cache = json.loads(r.read())

    key_data = next((k for k in _jwks_cache["keys"] if k["kid"] == kid), None)
    if not key_data:
        raise ValueError("Key not found")

    try:
        from jose import jwt as jose_jwt
        payload = jose_jwt.decode(token, key_data, algorithms=["RS256"], options={"verify_aud": False})
    except ImportError:
        payload = json.loads(b64_decode(parts[1]))

    if payload.get("exp", 0) < time.time():
        raise ValueError("Token expired")

    return payload["sub"]


def handler(event, context):
    if event.get("httpMethod") == "OPTIONS":
        return cors(200, {})

    auth_header = (event.get("headers") or {}).get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return cors(401, {"error": "Missing token"})

    try:
        user_id = verify_token(auth_header[7:])
    except Exception as e:
        return cors(401, {"error": str(e)})

    body = json.loads(event.get("body") or "{}")
    course_id = body.get("course_id")
    if not course_id:
        return cors(400, {"error": "course_id required"})

    url = f"{SUPABASE_URL}/rest/v1/course_enrollments?user_id=eq.{user_id}&course_id=eq.{course_id}&select=id,expires_at"
    req = urllib.request.Request(url, headers={
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    })
    with urllib.request.urlopen(req, timeout=10) as r:
        rows = json.loads(r.read())

    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    has_access = False
    for row in rows:
        expires = row.get("expires_at")
        if expires is None:
            has_access = True
            break
        try:
            exp_dt = datetime.fromisoformat(expires.replace("Z", "+00:00"))
            if exp_dt > now:
                has_access = True
                break
        except Exception:
            has_access = True
            break

    return cors(200, {"has_access": has_access})
