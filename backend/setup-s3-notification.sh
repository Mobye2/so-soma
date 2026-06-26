#!/bin/bash
# setup-s3-notification.sh
# 部署 SAM stack 之後執行一次，把 S3 → Lambda notification 設定好
set -e

REGION="ap-east-2"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
RAW_BUCKET="solis-videos-raw-${ACCOUNT_ID}"

# 取得 TriggerBatchFunction ARN
FUNCTION_ARN=$(aws cloudformation describe-stacks \
  --stack-name solis-backend \
  --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='TriggerBatchFunctionArn'].OutputValue" \
  --output text)

if [ -z "$FUNCTION_ARN" ]; then
  # fallback: 直接查 Lambda
  FUNCTION_ARN=$(aws lambda get-function \
    --function-name solis-backend-TriggerBatchFunction \
    --region "$REGION" \
    --query 'Configuration.FunctionArn' \
    --output text 2>/dev/null || \
  aws lambda list-functions \
    --region "$REGION" \
    --query "Functions[?contains(FunctionName, 'TriggerBatch')].FunctionArn" \
    --output text | awk '{print $1}')
fi

echo "RAW_BUCKET: $RAW_BUCKET"
echo "FUNCTION_ARN: $FUNCTION_ARN"

# Add Lambda permission for S3
aws lambda add-permission \
  --function-name "$FUNCTION_ARN" \
  --statement-id "s3-invoke" \
  --action lambda:InvokeFunction \
  --principal s3.amazonaws.com \
  --source-arn "arn:aws:s3:::${RAW_BUCKET}" \
  --region "$REGION" 2>/dev/null || echo "Permission already exists, skipping"

# Set S3 notification
aws s3api put-bucket-notification-configuration \
  --bucket "$RAW_BUCKET" \
  --region "$REGION" \
  --notification-configuration "{
    \"LambdaFunctionConfigurations\": [
      {
        \"LambdaFunctionArn\": \"$FUNCTION_ARN\",
        \"Events\": [\"s3:ObjectCreated:*\"],
        \"Filter\": {
          \"Key\": {
            \"FilterRules\": [
              {\"Name\": \"prefix\", \"Value\": \"courses/\"}
            ]
          }
        }
      }
    ]
  }"

echo "=== S3 notification configured ==="
echo "Bucket: $RAW_BUCKET -> Lambda: $FUNCTION_ARN"
