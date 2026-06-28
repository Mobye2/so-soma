import json
import os
import urllib.request
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
VIDEO_BUCKET = os.environ["VIDEO_BUCKET"]
ASSETS_BUCKET = os.environ.get("ASSETS_BUCKET", "")
COGNITO_REGION = os.environ.get("COGNITO_REGION", "ap-east-2")
COGNITO_USER_POOL_ID = os.environ["COGNITO_USER_POOL_ID"]
UPLOAD_URL_EXPIRES = int(os.environ.get("UPLOAD_URL_EXPIRES", "900"))  # 15 min

s3 = boto3.client(
    "s3",
    region_name=COGNITO_REGION,
    config=Config(signature_version="s3v4", s3={"addressing_style": "path"})
)


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
    import base64
    import time

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

    return payload["sub"]


def handler(event, context):
    if event.get("httpMethod") == "OPTIONS":
        return cors(200, {})

    auth_header = (event.get("headers") or {}).get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return cors(401, {"error": "Missing token"})

    token = auth_header[7:]
    try:
        user_id = verify_admin_token(token)
    except PermissionError as e:
        return cors(403, {"error": str(e)})
    except Exception as e:
        return cors(401, {"error": f"Invalid token: {e}"})

    body = json.loads(event.get("body") or "{}")
    upload_type = body.get("type", "video")  # "video" or "image"
    course_id = body.get("course_id")
    chapter_id = body.get("chapter_id")
    filename = body.get("filename", "file")
    content_type = body.get("content_type", "video/mp4")

    # 圖片上傳
    if upload_type == "image":
        if not ASSETS_BUCKET:
            return cors(500, {"error": "ASSETS_BUCKET not configured"})
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "jpg"
        s3_key = f"images/{body.get('folder', 'products')}/{int(__import__('time').time())}-{__import__('random').randint(1000,9999)}.{ext}"
        bucket = ASSETS_BUCKET
        public_url = f"https://{os.environ.get('ASSETS_CF_DOMAIN', '')}/{s3_key}"
    else:
        if not course_id or not chapter_id:
            return cors(400, {"error": "course_id and chapter_id required"})
        ext = filename.rsplit(".", 1)[-1] if "." in filename else "mp4"
        s3_key = f"courses/{course_id}/{chapter_id}.{ext}"
        bucket = VIDEO_BUCKET
        public_url = None

    try:
        upload_url = s3.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": bucket,
                "Key": s3_key,
                "ContentType": content_type,
            },
            ExpiresIn=UPLOAD_URL_EXPIRES,
        )
    except ClientError as e:
        return cors(500, {"error": str(e)})

    resp = {"upload_url": upload_url, "s3_key": s3_key, "expires_in": UPLOAD_URL_EXPIRES}
    if public_url:
        resp["public_url"] = public_url
    return cors(200, resp)
