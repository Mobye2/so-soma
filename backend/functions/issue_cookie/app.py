import json
import os
import time
import base64
import urllib.request
import urllib.parse
import boto3

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
COGNITO_REGION = os.environ.get("COGNITO_REGION", "ap-east-2")
COGNITO_USER_POOL_ID = os.environ["COGNITO_USER_POOL_ID"]
CF_DOMAIN = os.environ["CF_DOMAIN"]
CF_KEY_ID_SSM = os.environ["CF_KEY_ID_SSM"]
CF_PRIVATE_KEY_SSM = os.environ["CF_PRIVATE_KEY_SSM"]
COOKIE_TTL = int(os.environ.get("COOKIE_TTL", "21600"))  # 6 hours

ssm = boto3.client("ssm", region_name=COGNITO_REGION)
_ssm_cache = {}


def cors(status, body, extra_headers=None):
    headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Credentials": "true",
    }
    if extra_headers:
        headers.update(extra_headers)
    return {"statusCode": status, "headers": headers, "body": json.dumps(body)}


def get_ssm(name):
    if name not in _ssm_cache:
        resp = ssm.get_parameter(Name=name, WithDecryption=True)
        _ssm_cache[name] = resp["Parameter"]["Value"]
    return _ssm_cache[name]


def b64_decode(s):
    s += "=" * (-len(s) % 4)
    return base64.urlsafe_b64decode(s)


def verify_cognito_token(token):
    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError("Invalid token format")

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
        payload = jose_jwt.decode(token, key_data, algorithms=["RS256"], audience=None)
    except ImportError:
        payload = json.loads(b64_decode(parts[1]))

    if payload.get("exp", 0) < time.time():
        raise ValueError("Token expired")

    return payload["sub"]


def supabase_get(path, params):
    url = f"{SUPABASE_URL}/rest/v1/{path}?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    })
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read())


def make_signed_cookie(resource, expires, private_key_pem, key_id):
    """Generate CloudFront Signed Cookie using canned policy."""
    policy = json.dumps({
        "Statement": [{
            "Resource": resource,
            "Condition": {"DateLessThan": {"AWS:EpochTime": expires}}
        }]
    }, separators=(",", ":"))

    policy_b64 = base64.b64encode(policy.encode()).decode()
    policy_b64 = policy_b64.replace("+", "-").replace("=", "_").replace("/", "~")

    # Sign with RSA SHA1
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import padding

    private_key = serialization.load_pem_private_key(
        private_key_pem.encode(), password=None
    )
    signature = private_key.sign(policy.encode(), padding.PKCS1v15(), hashes.SHA1())
    sig_b64 = base64.b64encode(signature).decode()
    sig_b64 = sig_b64.replace("+", "-").replace("=", "_").replace("/", "~")

    return {
        "CloudFront-Policy": policy_b64,
        "CloudFront-Signature": sig_b64,
        "CloudFront-Key-Pair-Id": key_id,
    }


def handler(event, context):
    if event.get("httpMethod") == "OPTIONS":
        return cors(200, {})

    auth_header = (event.get("headers") or {}).get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return cors(401, {"error": "Missing token"})

    token = auth_header[7:]
    try:
        user_id = verify_cognito_token(token)
    except Exception as e:
        return cors(401, {"error": f"Invalid token: {e}"})

    body = json.loads(event.get("body") or "{}")
    chapter_id = body.get("chapter_id")
    if not chapter_id:
        return cors(400, {"error": "chapter_id required"})

    # Get chapter info
    chapters = supabase_get("course_chapters", {
        "id": f"eq.{chapter_id}",
        "select": "id,course_id,is_preview,hls_ready,video_url",
        "limit": 1,
    })
    if not chapters:
        return cors(404, {"error": "Chapter not found"})

    chapter = chapters[0]
    course_id = chapter["course_id"]
    is_preview = chapter.get("is_preview", False)
    hls_ready = chapter.get("hls_ready", False)
    video_url = chapter.get("video_url") or ""

    if not hls_ready:
        return cors(425, {"error": "Video is still processing"})

    # Check access
    if not is_preview:
        access = supabase_get("user_course_access", {
            "user_id": f"eq.{user_id}",
            "course_id": f"eq.{course_id}",
            "select": "id",
            "limit": 1,
        })
        if not access:
            return cors(403, {"error": "No access to this course"})

    # HLS prefix stored in video_url: courses/{course_id}/{chapter_id}/
    hls_prefix = video_url.rstrip("/")
    hls_url = f"https://{CF_DOMAIN}/{hls_prefix}/index.m3u8"
    resource = f"https://{CF_DOMAIN}/{hls_prefix}/*"

    expires = int(time.time()) + COOKIE_TTL

    private_key_pem = get_ssm(CF_PRIVATE_KEY_SSM)
    key_id = get_ssm(CF_KEY_ID_SSM)

    try:
        cookies = make_signed_cookie(resource, expires, private_key_pem, key_id)
    except Exception as e:
        return cors(500, {"error": f"Cookie signing failed: {e}"})

    return cors(200, {
        "hls_url": hls_url,
        "cookies": cookies,
        "expires": expires,
    })
