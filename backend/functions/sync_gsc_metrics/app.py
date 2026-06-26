import json
import os
import boto3
import urllib.request
from datetime import date, timedelta
from supabase import create_client


def get_supabase():
    return create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_ROLE_KEY"],
    )


def get_access_token(secret_arn: str) -> str:
    """Fetch GSC service-account JSON from Secrets Manager and exchange for access token."""
    sm = boto3.client("secretsmanager")
    secret = json.loads(sm.get_secret_value(SecretId=secret_arn)["SecretString"])

    # Use google-auth if available, otherwise raise clearly
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
        raise RuntimeError(
            "google-auth not in Lambda layer. "
            "Add google-auth to layers/shared/requirements.txt and redeploy."
        )


def handler(event, context):
    """
    EventBridge schedule trigger (daily).
    Fetches last N days of GSC search analytics and upserts into gsc_metrics table.

    gsc_metrics schema:
        date date, page text, query text,
        clicks int, impressions int, ctr float, position float
    """
    secret_arn = os.environ.get("GSC_SECRET_ARN")
    site_url = os.environ.get("GSC_SITE_URL", "https://www.solisforest.com/")
    days_back = int(os.environ.get("GSC_DAYS_BACK", "3"))

    if not secret_arn:
        print("GSC_SECRET_ARN not set, skipping")
        return {"statusCode": 200, "message": "no secret configured"}

    end_date = date.today() - timedelta(days=3)  # GSC ~3 day lag
    start_date = end_date - timedelta(days=days_back - 1)

    access_token = get_access_token(secret_arn)

    api_url = (
        f"https://searchconsole.googleapis.com/webmasters/v3/sites/"
        f"{urllib.request.quote(site_url, safe='')}/searchAnalytics/query"
    )

    body = json.dumps({
        "startDate": start_date.isoformat(),
        "endDate": end_date.isoformat(),
        "dimensions": ["date", "page", "query"],
        "rowLimit": 5000,
    }).encode()

    req = urllib.request.Request(
        api_url,
        data=body,
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        },
    )

    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read())

    rows = data.get("rows", [])
    if not rows:
        print("No GSC rows returned")
        return {"statusCode": 200, "upserted": 0}

    supabase = get_supabase()
    records = [
        {
            "date": r["keys"][0],
            "page": r["keys"][1],
            "query": r["keys"][2],
            "clicks": r.get("clicks", 0),
            "impressions": r.get("impressions", 0),
            "ctr": r.get("ctr", 0.0),
            "position": r.get("position", 0.0),
        }
        for r in rows
    ]

    # Batch upsert in chunks of 500
    for i in range(0, len(records), 500):
        supabase.table("gsc_metrics").upsert(
            records[i:i + 500],
            on_conflict="date,page,query",
        ).execute()

    print(f"GSC sync: upserted {len(records)} rows")
    return {"statusCode": 200, "upserted": len(records)}
