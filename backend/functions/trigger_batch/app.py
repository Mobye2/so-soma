import json
import os
import boto3

JOB_QUEUE = os.environ["JOB_QUEUE"]
JOB_DEFINITION = os.environ["JOB_DEFINITION"]
HLS_BUCKET = os.environ["HLS_BUCKET"]
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

batch = boto3.client("batch")


def handler(event, context):
    for record in event.get("Records", []):
        src_bucket = record["s3"]["bucket"]["name"]
        src_key = record["s3"]["object"]["key"]

        # key format: courses/{course_id}/{chapter_id}.mp4
        parts = src_key.split("/")
        if len(parts) != 3:
            print(f"Skipping unexpected key format: {src_key}")
            continue

        _, course_id, filename = parts
        chapter_id = filename.rsplit(".", 1)[0]
        dst_prefix = f"courses/{course_id}/{chapter_id}/"

        print(f"Submitting Batch job: {src_key} -> {dst_prefix}")

        resp = batch.submit_job(
            jobName=f"ffmpeg-{chapter_id}",
            jobQueue=JOB_QUEUE,
            jobDefinition=JOB_DEFINITION,
            containerOverrides={
                "environment": [
                    {"name": "SRC_BUCKET", "value": src_bucket},
                    {"name": "SRC_KEY", "value": src_key},
                    {"name": "DST_BUCKET", "value": HLS_BUCKET},
                    {"name": "DST_PREFIX", "value": dst_prefix},
                    {"name": "CHAPTER_ID", "value": chapter_id},
                    {"name": "SUPABASE_URL", "value": SUPABASE_URL},
                    {"name": "SUPABASE_SERVICE_ROLE_KEY", "value": SUPABASE_SERVICE_ROLE_KEY},
                ]
            },
        )
        print(f"Batch job submitted: {resp['jobId']}")

    return {"statusCode": 200}
