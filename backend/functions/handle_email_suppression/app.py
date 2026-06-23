import json


def handler(event, context):
    return {
        "statusCode": 200,
        "body": json.dumps({"message": "handle_email_suppression placeholder"}),
    }
