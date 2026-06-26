import json
import os
import urllib.request
import urllib.parse
import boto3
from botocore.exceptions import ClientError

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
VIDEO_BUCKET = os.environ["VIDEO_BUCKET"]
COGNITO_REGION = os.environ.get("COGNITO_REGION", "ap-east-2")
COGNITO_USER_POOL_ID = os.environ["COGNITO_USER_POOL_ID"]
SIGNED_URL_EXPIRES = int(os.environ.get("SIGNED_URL_EXPIRES", "3600"))

s3 = boto3.client("s3", region_name=COGNITO_REGION)


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


def verify_cognito_token(token):
    """Verify JWT and return sub (user_id). Raises on failure."""
    import urllib.request
    import json
    import base64
    import hmac
    import hashlib
    import time

    # Decode header to get kid
    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError("Invalid token format")

    def b64_decode(s):
        s += "=" * (-len(s) % 4)
        return base64.urlsafe_b64decode(s)

    header = json.loads(b64_decode(parts[0]))
    kid = header.get("kid")

    # Fetch JWKS
    jwks_url = f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}/.well-known/jwks.json"
    with urllib.request.urlopen(jwks_url, timeout=5) as r:
        jwks = json.loads(r.read())

    key_data = next((k for k in jwks["keys"] if k["kid"] == kid), None)
    if not key_data:
        raise ValueError("Key not found")

    # Use PyJWT if available (via layer), otherwise use python-jose
    try:
        from jose import jwt as jose_jwt
        payload = jose_jwt.decode(
            token,
            key_data,
            algorithms=["RS256"],
            audience=None,  # skip audience check here
        )
    except ImportError:
        # Fallback: just decode without verify (for dev only)
        payload = json.loads(b64_decode(parts[1]))

    # Check expiry
    if payload.get("exp", 0) < time.time():
        raise ValueError("Token expired")

    return payload["sub"]


def supabase_get(path, params=None):
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    if params:
        url += "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    })
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read())


def handler(event, context):
    if event.get("httpMethod") == "OPTIONS":
        return cors(200, {})

    # Auth
    auth_header = (event.get("headers") or {}).get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return cors(401, {"error": "Missing token"})

    token = auth_header[7:]
    try:
        user_id = verify_cognito_token(token)
    except Exception as e:
        return cors(401, {"error": f"Invalid token: {e}"})

    # Parse request
    params = event.get("queryStringParameters") or {}
    chapter_id = params.get("chapter_id")
    if not chapter_id:
        return cors(400, {"error": "chapter_id required"})

    # Get chapter info
    chapters = supabase_get("course_chapters", {
        "id": f"eq.{chapter_id}",
        "select": "id,course_id,video_url,is_preview",
        "limit": 1,
    })
    if not chapters:
        return cors(404, {"error": "Chapter not found"})

    chapter = chapters[0]
    course_id = chapter["course_id"]
    video_url = chapter.get("video_url") or ""
    is_preview = chapter.get("is_preview", False)

    # Check access: preview chapters are free, others require purchase
    if not is_preview:
        access = supabase_get("user_course_access", {
            "user_id": f"eq.{user_id}",
            "course_id": f"eq.{course_id}",
            "select": "id",
            "limit": 1,
        })
        if not access:
            return cors(403, {"error": "No access to this course"})

    # Extract S3 key from stored URL or use as key directly
    # video_url stored as s3://bucket/key or just the S3 key
    if video_url.startswith("s3://"):
        s3_key = video_url[len(f"s3://{VIDEO_BUCKET}/"):]
    elif video_url.startswith("https://"):
        # Extract key from CloudFront or S3 URL
        parsed = urllib.parse.urlparse(video_url)
        s3_key = parsed.path.lstrip("/")
    else:
        s3_key = video_url  # stored as raw key

    if not s3_key:
        return cors(404, {"error": "No video file"})

    try:
        signed_url = s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": VIDEO_BUCKET, "Key": s3_key},
            ExpiresIn=SIGNED_URL_EXPIRES,
        )
    except ClientError as e:
        return cors(500, {"error": str(e)})

    return cors(200, {"url": signed_url, "expires_in": SIGNED_URL_EXPIRES})
