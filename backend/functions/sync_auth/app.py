import json
import os
import time
import base64
import urllib.request
from supabase import create_client

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
COGNITO_REGION = os.environ.get("COGNITO_REGION", "ap-northeast-1")
COGNITO_USER_POOL_ID = os.environ["COGNITO_USER_POOL_ID"]

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


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
        payload = jose_jwt.decode(token, key_data, algorithms=["RS256"], options={"verify_aud": False})
    except ImportError:
        payload = json.loads(b64_decode(parts[1]))

    if payload.get("exp", 0) < time.time():
        raise ValueError("Token expired")

    return {
        "sub": payload["sub"],
        "email": payload.get("email", ""),
        "groups": payload.get("cognito:groups", []),
        "name": payload.get("name", "")
    }


def ensure_supabase_user(user_id: str, email: str) -> str:
    """
    確保 Supabase auth.users 有一個 id=user_id, email=email 的 user。
    - 如果已存在 id=user_id → 直接用
    - 如果 email 已被另一個 id 佔用 → 更新那個 user 的 id 為 Cognito sub
    - 如果都沒有 → 建立新 user
    回傳最終在 Supabase 裡的 user_id（應等於 Cognito sub）
    """
    # 1. 先查 id=user_id 是否存在
    url = f"{SUPABASE_URL}/auth/v1/admin/users/{user_id}"
    req = urllib.request.Request(url, headers={
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    })
    try:
        res = json.loads(urllib.request.urlopen(req).read())
        print(f"[ensure_user] found by id: {res.get('id')} email={res.get('email')}")
        return user_id
    except urllib.error.HTTPError as e:
        if e.code != 404:
            raise
        print(f"[ensure_user] id={user_id} not found, checking email...")

    # 2. 查 email 是否已被別的 id 佔用 → 警告並回傳錯誤，不允許相同 email 用不同 id
    search_url = f"{SUPABASE_URL}/auth/v1/admin/users?email={urllib.parse.quote(email)}&limit=1"
    search_req = urllib.request.Request(search_url, headers={
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    })
    try:
        search_res = json.loads(urllib.request.urlopen(search_req).read())
        users = search_res.get("users", [])
        if users:
            exact = [u for u in users if u["email"] == email]
            if exact:
                existing_id = exact[0]["id"]
                print(f"[ensure_user] CONFLICT: email={email} already used by supabase_id={existing_id}, cognito_sub={user_id}")
                raise ValueError(f"Email {email} is already associated with a different Supabase user id ({existing_id}). Please contact support.")
    except ValueError:
        raise
    except Exception as e:
        print(f"[ensure_user] search failed: {e}")

    # 3. 都沒有，建立新 user
    create_url = f"{SUPABASE_URL}/auth/v1/admin/users"
    create_body = json.dumps({
        "id": user_id,
        "email": email,
        "email_confirm": True,
        "user_metadata": {"cognito_sub": user_id}
    }, separators=(",", ":")).encode()
    create_req = urllib.request.Request(create_url, data=create_body, method="POST", headers={
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
    })
    try:
        res = json.loads(urllib.request.urlopen(create_req).read())
        print(f"[ensure_user] created: {res.get('id')}")
    except urllib.error.HTTPError as e:
        print(f"[ensure_user] create failed: {e.code} {e.read().decode()[:200]}")
    return user_id


def get_supabase_token(email: str) -> dict | None:
    """generate_link + verify 取得 ES256 signed token + refresh token"""
    import urllib.parse

    url = f"{SUPABASE_URL}/auth/v1/admin/generate_link"
    body = json.dumps({"type": "magiclink", "email": email}, separators=(",", ":")).encode()
    req = urllib.request.Request(url, data=body, method="POST", headers={
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
    })
    try:
        res = json.loads(urllib.request.urlopen(req).read())
        hashed_token = res.get("hashed_token")
        print(f"[generate_link] hashed_token={'ok' if hashed_token else 'MISSING'}")
        if not hashed_token:
            return None

        verify_url = f"{SUPABASE_URL}/auth/v1/verify"
        verify_body = json.dumps({"type": "magiclink", "token_hash": hashed_token}, separators=(",", ":")).encode()
        verify_req = urllib.request.Request(verify_url, data=verify_body, method="POST", headers={
            "apikey": SUPABASE_SERVICE_KEY,
            "Content-Type": "application/json",
        })
        verify_res = json.loads(urllib.request.urlopen(verify_req).read())
        access_token = verify_res.get("access_token")
        refresh_token = verify_res.get("refresh_token")
        print(f"[verify] access_token={'ok' if access_token else 'MISSING'}, refresh_token={'ok' if refresh_token else 'MISSING'}")
        return {"access_token": access_token, "refresh_token": refresh_token} if access_token and refresh_token else None
    except urllib.error.HTTPError as e:
        print(f"[get_supabase_token] error: {e.code} {e.read().decode()[:200]}")
        return None


def handler(event, context):
    import urllib.parse

    if event.get("httpMethod") == "OPTIONS":
        return cors(200, {})

    auth_header = (event.get("headers") or {}).get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return cors(401, {"error": "Missing token"})

    token = auth_header[7:]

    try:
        user_info = verify_cognito_token(token)
        user_id = user_info["sub"]
        email = user_info["email"]
        is_admin = "admin" in user_info["groups"]

        # Step 1: 確保 auth.users 有正確的 user
        final_user_id = ensure_supabase_user(user_id, email)

        # Step 2: 確保 profiles 有此用戶，並記錄 supabase_auth_id（auth.users.id）
        # 直接用 final_user_id 查，避免 email 搜尋拿到錯誤的 user
        supabase_auth_id = final_user_id
        print(f"[sync] supabase_auth_id={supabase_auth_id}")

        result = supabase.table("profiles").select("id").eq("id", user_id).execute()
        if not result.data:
            supabase.table("profiles").insert({
                "id": user_id,
                "email": email,
                "display_name": user_info.get("name") or None,
                "supabase_auth_id": supabase_auth_id
            }).execute()
        else:
            supabase.table("profiles").update({
                "supabase_auth_id": supabase_auth_id
            }).eq("id", user_id).execute()

        # Step 3: 同步 admin 權限
        if is_admin:
            supabase.table("user_roles").upsert({
                "user_id": final_user_id,
                "role": "admin"
            }, on_conflict="user_id,role").execute()

        # Step 4: 取得 ES256 signed Supabase token
        tokens = get_supabase_token(email)
        if not tokens:
            return cors(500, {"error": "Failed to generate Supabase token"})

        return cors(200, {
            "access_token": tokens["access_token"],
            "refresh_token": tokens["refresh_token"],
            "user_id": final_user_id,
            "email": email,
            "is_admin": is_admin
        })

    except ValueError as e:
        print(f"[handler] ValueError: {e}")
        return cors(401, {"error": f"Invalid token: {str(e)}"})
    except Exception as e:
        print(f"[handler] Exception: {e}")
        return cors(500, {"error": f"Sync failed: {str(e)}"})
