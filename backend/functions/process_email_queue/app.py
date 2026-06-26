import json
import os
import boto3

def handler(event, context):
    """
    Triggered by SQS. Each record is an email job.

    SQS message body:
    {
        "templateName": "...",
        "recipientEmail": "...",
        "templateData": {...},
        "idempotencyKey": "..."
    }
    """
    lambda_client = boto3.client("lambda")
    send_fn = os.environ.get(
        "SEND_EMAIL_FUNCTION_NAME",
        "solis-backend-SendTransactionalEmailFunction-kaonkJakWusB",
    )

    sent = 0
    failed = 0

    for record in event.get("Records", []):
        try:
            body = json.loads(record["body"])

            resp = lambda_client.invoke(
                FunctionName=send_fn,
                InvocationType="RequestResponse",
                Payload=json.dumps({
                    "httpMethod": "POST",
                    "body": json.dumps({
                        "templateName": body.get("templateName"),
                        "recipientEmail": body.get("recipientEmail"),
                        "idempotencyKey": body.get("idempotencyKey", record["messageId"]),
                        "templateData": body.get("templateData", {}),
                    }),
                }),
            )

            result = json.loads(resp["Payload"].read())
            if result.get("statusCode") == 200:
                sent += 1
            else:
                failed += 1
                # Raise to let SQS retry
                raise Exception(f"send_email returned {result.get('statusCode')}")

        except Exception as e:
            print(f"SQS record {record.get('messageId')} error: {e}")
            failed += 1
            raise  # SQS will retry or send to DLQ

    print(f"SQS email: sent={sent} failed={failed}")
    return {"statusCode": 200, "sent": sent, "failed": failed}
