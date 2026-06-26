#!/bin/bash
# deploy-ffmpeg-image.sh
# 用法：bash deploy-ffmpeg-image.sh
# 執行前確認 AWS CLI 已設定好 credentials（ap-east-2）

set -e

REGION="ap-east-2"
REPO_NAME="solis-ffmpeg-hls"
IMAGE_TAG="latest"

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URI="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$REPO_NAME"

echo "=== Step 1: Create ECR repo (skip if exists) ==="
aws ecr describe-repositories --repository-names "$REPO_NAME" --region "$REGION" 2>/dev/null || \
  aws ecr create-repository \
    --repository-name "$REPO_NAME" \
    --region "$REGION" \
    --image-scanning-configuration scanOnPush=true

echo "=== Step 2: Docker login to ECR ==="
aws ecr get-login-password --region "$REGION" | \
  docker login --username AWS --password-stdin "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"

echo "=== Step 3: Build image ==="
docker build \
  --platform linux/amd64 \
  -t "$REPO_NAME:$IMAGE_TAG" \
  "$(dirname "$0")/docker/ffmpeg"

echo "=== Step 4: Tag & Push ==="
docker tag "$REPO_NAME:$IMAGE_TAG" "$ECR_URI:$IMAGE_TAG"
docker push "$ECR_URI:$IMAGE_TAG"

echo ""
echo "=== Done ==="
echo "Image URI: $ECR_URI:$IMAGE_TAG"
echo ""
echo "把這個 URI 填入 samconfig.toml 的 FfmpegImageUri 參數："
echo "  FfmpegImageUri=$ECR_URI:$IMAGE_TAG"
