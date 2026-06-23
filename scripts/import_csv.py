import os
import csv
from supabase import create_client

url = "https://clyvbsxlmhozbaoktfsl.supabase.co"
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

csv_dir = r"c:\Users\user\OneDrive\DESKTOP\Solis & Somatic\supabase\db-export"

tables = [
    "courses",
    "course_chapters",
    "products",
    "blog_posts",
    "contact_messages",
    "launch_notify_subscribers",
    "quiz_results",
    "newsletter_subscribers",
    "event_registrations",
    "ig_posts",
    "seo_daily_metrics",
    "seo_page_metrics",
    "seo_query_metrics",
    "seo_sync_log",
    "email_send_log",
    "email_unsubscribe_tokens",
    "suppressed_emails",
]

for table in tables:
    filepath = os.path.join(csv_dir, f"{table}.csv")
    if not os.path.exists(filepath):
        print(f"SKIP: {table}.csv not found")
        continue

    with open(filepath, "r", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    if not rows:
        print(f"SKIP: {table} is empty")
        continue

    # Insert in batches of 100
    batch_size = 100
    total = 0
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i+batch_size]
        # Convert empty strings to None
        cleaned = [{k: (v if v != "" else None) for k, v in row.items()} for row in batch]
        supabase.table(table).upsert(cleaned).execute()
        total += len(batch)

    print(f"OK: {table} ({total} rows)")

print("\ndone")
