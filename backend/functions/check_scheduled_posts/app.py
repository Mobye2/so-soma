import json
import os
import urllib.request
import boto3

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
SITE_URL = os.environ.get("SITE_URL", "https://www.solisforest.com")


def supabase_get(path):
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/{path}",
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
        },
    )
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read())


def supabase_patch(table, record_id, payload):
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/{table}?id=eq.{record_id}",
        data=data,
        method="PATCH",
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        },
    )
    with urllib.request.urlopen(req, timeout=10) as r:
        return r.status


def handler(event, context):
    # 查出已到發布時間但還沒寄通知的文章
    posts = supabase_get(
        "blog_posts"
        "?select=id,title,excerpt,slug,published_at"
        "&published=eq.true"
        "&published_at=lte.now()"
        "&notified_at=is.null"
    )

    if not posts:
        print("No scheduled posts to notify.")
        return {"notified": 0}

    lambda_client = boto3.client("lambda")
    notify_fn = os.environ.get(
        "NOTIFY_FUNCTION_NAME",
        "solis-backend-NotifyPublishedPostsFunction",
    )

    notified = 0
    for post in posts:
        try:
            lambda_client.invoke(
                FunctionName=notify_fn,
                InvocationType="Event",
                Payload=json.dumps({
                    "postId": post["id"],
                    "title": post["title"],
                    "excerpt": post.get("excerpt") or "",
                    "url": f"{SITE_URL}/blog/{post['slug']}",
                }),
            )
            # 打上 notified_at，避免重複寄
            supabase_patch("blog_posts", post["id"], {"notified_at": "now()"})
            notified += 1
            print(f"Notified: {post['title']}")
        except Exception as e:
            print(f"Failed for post {post['id']}: {e}")

    print(f"Total notified: {notified}/{len(posts)}")
    return {"notified": notified}
