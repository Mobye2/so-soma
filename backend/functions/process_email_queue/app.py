import json
import os
import boto3
from supabase import create_client


def get_supabase():
    return create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_ROLE_KEY"],
    )


def handler(event, context):
    """
    Triggered by EventBridge schedule (e.g. every 5 minutes).
    Reads from Supabase pgmq queue via RPC and sends emails.

    Queue name: "transactional_email"
    Message payload: { templateName, recipientEmail, templateData, idempotencyKey }
    """
    QUEUE_NAME = os.environ.get("EMAIL_QUEUE_NAME", "transactional_email")
    BATCH_SIZE = int(os.environ.get("EMAIL_QUEUE_BATCH_SIZE", "10"))
    VT = 60  # visibility timeout seconds

    supabase = get_supabase()

    # Read batch from pgmq
    result = supabase.rpc("read_email_batch", {
        "queue_name": QUEUE_NAME,
        "batch_size": BATCH_SIZE,
        "vt": VT,
    }).execute()

    messages = result.data or []
    if not messages:
        return {"statusCode": 200, "sent": 0}

    lambda_client = boto3.client("lambda")
    send_fn = os.environ.get(
        "SEND_EMAIL_FUNCTION_NAME",
        "solis-backend-SendTransactionalEmailFunction",
    )

    sent = 0
    failed = 0

    for msg in messages:
        msg_id = msg.get("id")
        body = msg.get("message") or msg.get("body") or {}

        try:
            lambda_payload = {
                "httpMethod": "POST",
                "body": json.dumps({
                    "templateName": body.get("templateName"),
                    "recipientEmail": body.get("recipientEmail"),
                    "idempotencyKey": body.get("idempotencyKey", f"queue-{msg_id}"),
                    "templateData": body.get("templateData", {}),
                }),
            }

            resp = lambda_client.invoke(
                FunctionName=send_fn,
                InvocationType="RequestResponse",
                Payload=json.dumps(lambda_payload),
            )

            result_body = json.loads(resp["Payload"].read())
            if result_body.get("statusCode") == 200:
                # Delete from queue on success
                supabase.rpc("delete_email", {
                    "queue_name": QUEUE_NAME,
                    "message_id": msg_id,
                }).execute()
                sent += 1
            else:
                failed += 1

        except Exception as e:
            print(f"Queue message {msg_id} error: {e}")
            failed += 1

    print(f"email_queue: sent={sent} failed={failed}")
    return {"statusCode": 200, "sent": sent, "failed": failed}
