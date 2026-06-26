import json
import os
import hashlib
import urllib.parse
import base64


def generate_check_mac_value(params: dict, hash_key: str, hash_iv: str) -> str:
    sorted_params = sorted(params.items(), key=lambda x: x[0].lower())
    raw = "&".join(f"{k}={v}" for k, v in sorted_params)
    raw = f"HashKey={hash_key}&{raw}&HashIV={hash_iv}"
    encoded = urllib.parse.quote_plus(raw).lower()
    for old, new in [("%2d", "-"), ("%5f", "_"), ("%2e", "."),
                     ("%21", "!"), ("%2a", "*"), ("%28", "("),
                     ("%29", ")"), ("%20", "+")]:
        encoded = encoded.replace(old, new)
    return hashlib.sha256(encoded.encode("utf-8")).hexdigest().upper()


def handler(event, context):
    body_str = event.get("body", "") or ""
    if event.get("isBase64Encoded"):
        body_str = base64.b64decode(body_str).decode("utf-8")

    print(f"RAW BODY: {repr(body_str)}")

    params = dict(urllib.parse.parse_qsl(body_str, keep_blank_values=True))
    print(f"PARSED PARAMS: {json.dumps(params, ensure_ascii=False)}")

    hash_key = os.environ.get("ECPAY_HASH_KEY", "").strip()
    hash_iv = os.environ.get("ECPAY_HASH_IV", "").strip()

    received_mac = params.pop("CheckMacValue", "")
    calculated_mac = generate_check_mac_value(params, hash_key, hash_iv)

    print(f"RECEIVED MAC : {received_mac}")
    print(f"CALCULATED MAC: {calculated_mac}")
    print(f"MATCH: {received_mac == calculated_mac}")

    return {"statusCode": 200, "body": "1|OK"}
