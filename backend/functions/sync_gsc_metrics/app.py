import json


def handler(event, context):
    return {
        "statusCode": 200,
        "body": json.dumps({"message": "sync_gsc_metrics placeholder"}),
    }
