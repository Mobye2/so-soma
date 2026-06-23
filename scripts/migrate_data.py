import os
from supabase import create_client

# 舊 Supabase（Lovable）
OLD_URL = "https://rtnnfykmbejsmcloovre.supabase.co"
OLD_KEY = os.environ.get("OLD_SUPABASE_SERVICE_ROLE_KEY")

# 新 Supabase（Free）
NEW_URL = "https://clyvbsxlmhozbaoktfsl.supabase.co"
NEW_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

old = create_client(OLD_URL, OLD_KEY)
new = create_client(NEW_URL, NEW_KEY)

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
    rows = old.table(table).select("*").execute().data
    if not rows:
        print(f"SKIP: {table} is empty")
        continue

    batch_size = 100
    total = 0
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i+batch_size]
        new.table(table).insert(batch).execute()
        total += len(batch)

    print(f"OK: {table} ({total} rows)")

print("\ndone")
