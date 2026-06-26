import json
import os
import urllib.request
import urllib.parse
import boto3
from datetime import date, timedelta

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]


def sb_upsert(table, rows):
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/{table}",
        method="POST",
        data=json.dumps(rows).encode(),
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates",
        }
    )
    with urllib.request.urlopen(req) as r:
        return r.status


def get_access_token(secret_arn):
    sm = boto3.client("secretsmanager")
    secret = json.loads(sm.get_secret_value(SecretId=secret_arn)["SecretString"])

    try:
        import google.auth.transport.requests
        from google.oauth2 import service_account
        creds = service_account.Credentials.from_service_account_info(
            secret,
            scopes=["https://www.googleapis.com/auth/webmasters.readonly"],
        )
        creds.refresh(google.auth.transport.requests.Request())
        return creds.token
    except ImportError:
        raise RuntimeError("google-auth not available in Lambda environment")


def handler(event, context):
    secret_arn = os.environ.get("GSC_SECRET_ARN")
    site_url = os.environ.get("GSC_SITE_URL", "https://www.solisforest.com/")
    days_back = int(os.environ.get("GSC_DAYS_BACK", "3"))

    if not secret_arn:
        return {"statusCode": 200, "message": "GSC_SECRET_ARN not set"}

    end_date = date.today() - timedelta(days=3)
    start_date = end_date - timedelta(days=days_back - 1)

    access_token = get_access_token(secret_arn)

    api_url = (
        f"https://searchconsole.googleapis.com/webmasters/v3/sites/"
        f"{urllib.parse.quote(site_url, safe='')}/searchAnalytics/query"
    )

    body = json.dumps({
        "startDate": start_date.isoformat(),
        "endDate": end_date.isoformat(),
        "dimensions": ["date", "page", "query"],
        "rowLimit": 5000,
    }).encode()

    req = urllib.request.Request(api_url, data=body, headers={
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    })

    with urllib.request.urlopen(req) as r:
        data = json.loads(r.read())

    rows = data.get("rows", [])
    if not rows:
        return {"statusCode": 200, "upserted": 0}

    records = [
        {
            "date": r["keys"][0],
            "page_url": r["keys"][1],
            "query": r["keys"][2],
            "clicks": r.get("clicks", 0),
            "impressions": r.get("impressions", 0),
            "ctr": r.get("ctr", 0.0),
            "position": r.get("position", 0.0),
        }
        for r in rows
    ]

    for i in range(0, len(records), 500):
        sb_upsert("seo_page_metrics", records[i:i + 500])

    print(f"GSC sync: upserted {len(records)} rows")
    return {"statusCode": 200, "upserted": len(records)}
