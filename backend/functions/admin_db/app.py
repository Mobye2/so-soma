import json
import os
import time
import base64
import urllib.request
import urllib.parse

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


def verify_cognito_token(token):
    global _jwks_cache
    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError("Invalid token")

    header = json.loads(b64_decode(parts[0]))
    kid = header.get("kid")

    if not _jwks_cache:
        jwks_url = f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}/.well-known/jwks.json"
        with urllib.request.urlopen(jwks_url, timeout=5) as r:
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

    # Check admin group
    groups = payload.get("cognito:groups", [])
    if "admin" not in groups:
        raise PermissionError("Not admin")

    return payload["sub"]


def supabase_request(method, path, body=None, params=None):
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    if params:
        url += "?" + urllib.parse.urlencode(params)

    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, method=method, headers={
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    })
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            text = r.read()
            return r.status, json.loads(text) if text else None
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())


def handler(event, context):
    if event.get("httpMethod") == "OPTIONS":
        return cors(200, {})

    # Verify admin JWT
    auth_header = (event.get("headers") or {}).get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return cors(401, {"error": "Missing token"})

    try:
        verify_cognito_token(auth_header[7:])
    except PermissionError:
        return cors(403, {"error": "Admin only"})
    except Exception as e:
        return cors(401, {"error": str(e)})

    # Parse request
    body = json.loads(event.get("body") or "{}")
    print(f"admin-db request: {json.dumps(body, ensure_ascii=False)[:500]}")
    method = body.get("method", "GET").upper()   # GET/POST/PATCH/DELETE
    table = body.get("table")                     # e.g. "course_chapters"
    payload = body.get("payload")                 # data to write
    filters = body.get("filters")                 # e.g. {"id": "eq.xxx"}

    if not table:
        return cors(400, {"error": "table required"})

    # Build query params from filters
    params = {}
    if filters:
        params.update(filters)

    status, result = supabase_request(method, table, payload, params if params else None)
    print(f"supabase {method} {table} params={params} -> {status}: {str(result)[:200]}")

    if status >= 400:
        return cors(status, {"error": result})

    return cors(200, result or {})
