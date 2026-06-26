# Phase 6：影片串流設計文件

## 架構總覽

```
上傳流程：
Admin 後台
  → POST /upload-url (Lambda: get_upload_presigned_url)
  → S3 raw bucket (solis-videos-raw) ← 原始影片暫存
  → S3 Event Notification
  → Lambda: trigger_batch
  → AWS Batch Job (Fargate + FFmpeg container)
  → FFmpeg 轉 HLS (.m3u8 + .ts segments)
  → S3 HLS bucket (solis-videos-hls) ← 私有，只有 CloudFront OAC 能讀
  → Lambda 更新 Supabase course_chapters.video_url = HLS key

播放流程：
User 登入 → Cognito JWT
  → POST /issue-cookie (Lambda: issue_cookie)
  → 驗 JWT + 查 user_course_access
  → 核發 CloudFront Signed URL（query parameters，有效 6 小時）
  → 前端 HLS.js 播放器打 CloudFront URL（帶簽名參數）
  → CloudFront 驗 Signed URL → OAC 轉發 → S3 HLS bucket
  → .m3u8 manifest + .ts segments 回傳給播放器
```

---

## AWS 資源清單

### S3 Buckets

| Bucket | 用途 | 存取 |
|--------|------|------|
| `solis-videos-raw-{accountId}` | 上傳原始影片暫存 | 私有，只有 Lambda PutObject |
| `solis-videos-hls-{accountId}` | HLS 輸出 | 私有，只有 CloudFront OAC GetObject |

### CloudFront

- **Distribution**：Origin 指向 HLS bucket，透過 OAC 存取
- **OAC**（Origin Access Control）：取代舊式 OAI
- **Key Group + Public Key**：用於 Signed URL 驗證
- **Cache Policy**：`.m3u8` 不快取（TTL=0），`.ts` 快取 1 天

### AWS Batch

- **Compute Environment**：FARGATE，不需預置 EC2
- **Job Queue**：綁定上述 Compute Environment
- **Job Definition**：FFmpeg container，environment variables 傳入 src/dst S3 路徑

### Lambda Functions

| Function | 觸發 | 功能 |
|----------|------|------|
| `get_upload_presigned_url` | API POST /upload-url | admin 驗證 → S3 raw presigned PUT URL |
| `trigger_batch` | S3 Event (raw bucket ObjectCreated) | 啟動 Batch FFmpeg job |
| `issue_cookie` | API POST /issue-cookie | 驗 JWT + access → CloudFront Signed Cookie |
| ~~`get_video_signed_url`~~ | 廢棄 | 由 issue_cookie 取代 |

### IAM Roles

- `BatchJobRole`：允許讀 raw bucket + 寫 HLS bucket + 更新 Supabase（透過 HTTPS）
- `BatchExecutionRole`：Fargate task execution 標準 role（ECS managed policy）

---

## 手動前置步驟（SAM 無法自動化）

部署前需手動執行一次：

```bash
# 1. 產生 CloudFront Signed Cookie 用的 RSA key pair
openssl genrsa -out cf_private_key.pem 2048
openssl rsa -pubout -in cf_private_key.pem -out cf_public_key.pem

# 2. 上傳 public key 到 CloudFront console
# CloudFront → Key management → Public keys → Create public key
# 貼上 cf_public_key.pem 內容，記下 Key ID

# 3. 建立 Key Group
# CloudFront → Key management → Key groups → Create key group
# 加入上面的 Public key，記下 Key Group ID

# 4. 把 private key 存到 SSM Parameter Store
aws ssm put-parameter \
  --name /solis/cf_private_key \
  --value file://cf_private_key.pem \
  --type SecureString \
  --region ap-east-2

# 5. 把 CloudFront Key ID 存到 SSM
aws ssm put-parameter \
  --name /solis/cf_key_id \
  --value "YOUR_CLOUDFRONT_KEY_ID" \
  --type String \
  --region ap-east-2

# 6. 刪除本機 private key（安全）
rm cf_private_key.pem cf_public_key.pem
```

---

## SAM Template 新增資源（template.yaml）

```yaml
# 移除：CourseVideosBucket（合併為 raw + hls 兩個）

# S3: Raw 原始影片
VideoRawBucket:
  Type: AWS::S3::Bucket
  Properties:
    BucketName: !Sub "solis-videos-raw-${AWS::AccountId}"
    LifecycleConfiguration:
      Rules:
        - Id: DeleteRawAfter7Days   # 轉檔完就可以刪
          Status: Enabled
          ExpirationInDays: 7
    PublicAccessBlockConfiguration: (全封閉)
    NotificationConfiguration:     # 觸發 trigger_batch Lambda
      LambdaConfigurations:
        - Event: s3:ObjectCreated:*
          Filter:
            S3Key:
              Rules: [{Name: prefix, Value: "courses/"}]
          Function: !GetAtt TriggerBatchFunction.Arn

# S3: HLS 輸出
VideoHlsBucket:
  Type: AWS::S3::Bucket
  Properties:
    BucketName: !Sub "solis-videos-hls-${AWS::AccountId}"
    PublicAccessBlockConfiguration: (全封閉)

# CloudFront OAC
VideoOAC:
  Type: AWS::CloudFront::OriginAccessControl
  Properties:
    OriginAccessControlConfig:
      Name: solis-video-oac
      OriginAccessControlOriginType: s3
      SigningBehavior: always
      SigningProtocol: sigv4

# CloudFront Distribution
VideoDistribution:
  Type: AWS::CloudFront::Distribution
  Properties:
    DistributionConfig:
      Origins:
        - Id: HlsBucketOrigin
          DomainName: !GetAtt VideoHlsBucket.RegionalDomainName
          S3OriginConfig: {}
          OriginAccessControlId: !GetAtt VideoOAC.Id
      DefaultCacheBehavior:
        TargetOriginId: HlsBucketOrigin
        ViewerProtocolPolicy: redirect-to-https
        TrustedKeyGroups: [!Ref CfKeyGroupId]   # Signed Cookie 驗證
        CachePolicyId: (custom: m3u8 TTL=0, ts TTL=86400)
      Enabled: true

# HLS bucket policy（允許 CloudFront OAC）
VideoHlsBucketPolicy:
  Type: AWS::S3::BucketPolicy
  Properties:
    Bucket: !Ref VideoHlsBucket
    PolicyDocument:
      Statement:
        - Effect: Allow
          Principal:
            Service: cloudfront.amazonaws.com
          Action: s3:GetObject
          Resource: !Sub "arn:aws:s3:::${VideoHlsBucket}/*"
          Condition:
            StringEquals:
              AWS:SourceArn: !Sub "arn:aws:cloudfront::${AWS::AccountId}:distribution/${VideoDistribution}"

# AWS Batch: Compute Environment (Fargate)
BatchComputeEnv:
  Type: AWS::Batch::ComputeEnvironment
  Properties:
    Type: MANAGED
    ComputeResources:
      Type: FARGATE
      MaxvCpus: 4
      Subnets: [!Ref BatchSubnetId]        # Parameter
      SecurityGroupIds: [!Ref BatchSgId]   # Parameter

# AWS Batch: Job Queue
BatchJobQueue:
  Type: AWS::Batch::JobQueue
  Properties:
    ComputeEnvironmentOrder:
      - Order: 1
        ComputeEnvironment: !Ref BatchComputeEnv
    Priority: 1

# AWS Batch: Job Definition (FFmpeg)
FfmpegJobDefinition:
  Type: AWS::Batch::JobDefinition
  Properties:
    Type: container
    PlatformCapabilities: [FARGATE]
    ContainerProperties:
      Image: !Ref FfmpegImageUri   # Parameter: ECR image URI
      JobRoleArn: !GetAtt BatchJobRole.Arn
      ExecutionRoleArn: !GetAtt BatchExecutionRole.Arn
      ResourceRequirements:
        - Type: VCPU,  Value: "2"
        - Type: MEMORY, Value: "4096"
      Environment: []  # 由 trigger_batch Lambda 動態注入

# Lambda: trigger_batch
TriggerBatchFunction:
  Type: AWS::Serverless::Function
  Properties:
    CodeUri: functions/trigger_batch/
    Handler: app.handler
    Environment:
      Variables:
        JOB_QUEUE: !Ref BatchJobQueue
        JOB_DEFINITION: !Ref FfmpegJobDefinition
        HLS_BUCKET: !Ref VideoHlsBucket
        SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
    Policies:
      - batch:SubmitJob

# Lambda: issue_cookie
IssueCookieFunction:
  Type: AWS::Serverless::Function
  Properties:
    CodeUri: functions/issue_cookie/
    Handler: app.handler
    Environment:
      Variables:
        CF_DOMAIN: !GetAtt VideoDistribution.DomainName
        CF_KEY_ID_SSM: /solis/cf_key_id
        CF_PRIVATE_KEY_SSM: /solis/cf_private_key
        COOKIE_TTL: "21600"   # 6 小時
        SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / COGNITO_*
    Policies:
      - ssm:GetParameter（讀 private key + key id）
    Events:
      Api: POST /issue-cookie
```

---

## Lambda 程式碼設計

### trigger_batch/app.py

```
輸入：S3 Event（ObjectCreated）
- 取出 bucket name + object key
  例：courses/{course_id}/{chapter_id}.mp4

- Submit Batch Job，帶入 environment variables：
  SRC_BUCKET, SRC_KEY, DST_BUCKET
  DST_PREFIX = courses/{course_id}/{chapter_id}/  （HLS 輸出路徑）
  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
  CHAPTER_ID（從 key 解析）

輸出：無（非同步）
```

### issue_cookie/app.py

```
輸入：POST /issue-cookie  body: { chapter_id }
Headers: Authorization: Bearer <Cognito JWT>

流程：
1. verify_cognito_token(token) → user_id
2. 查 course_chapters → chapter.course_id, is_preview, hls_ready
3. 若非 preview → 查 user_course_access，無則 403
4. 從 SSM 取 cf_private_key + cf_key_id
5. 用 RSA SHA1 簽名產生 CloudFront Signed URL parameters
   - Policy（resource: https://{cf_domain}/courses/{course_id}/{chapter_id}/*）
   - Signature
   - Key-Pair-Id
6. 回傳：
   {
     "hls_url": "https://{cf_domain}/courses/{course_id}/{chapter_id}/index.m3u8?Policy=...&Signature=...&Key-Pair-Id=..."
   }

前端 HLS.js xhrSetup 自動將簽名參數附加到所有子資源請求
```

### docker/ffmpeg/entrypoint.sh

```bash
#!/bin/sh
# 從 S3 下載原始影片
aws s3 cp s3://$SRC_BUCKET/$SRC_KEY /tmp/input.mp4

# FFmpeg 轉 HLS
ffmpeg -i /tmp/input.mp4 \
  -c:v libx264 -crf 22 -preset fast \
  -c:a aac -b:a 128k \
  -hls_time 6 \
  -hls_playlist_type vod \
  -hls_segment_filename "/tmp/hls/%03d.ts" \
  /tmp/hls/index.m3u8

# 上傳 HLS 到 S3
aws s3 sync /tmp/hls/ s3://$DST_BUCKET/$DST_PREFIX

# 通知 Supabase 更新 video_url
curl -X PATCH "$SUPABASE_URL/rest/v1/course_chapters?id=eq.$CHAPTER_ID" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"video_url\": \"$DST_PREFIX\", \"hls_ready\": true}"
```

---

## 前端變更（MemberCourse.tsx）

```
播放前流程：
1. POST /issue-cookie { chapter_id } + JWT
2. 收到 hls_url（已含 Policy/Signature/Key-Pair-Id query parameters）
3. 從 hls_url 提取簽名參數
4. HLS.js 初始化，設定 xhrSetup 攔截所有請求
5. xhrSetup 自動將簽名參數附加到所有子資源（.m3u8, .ts）
6. Signed URL 6 小時後過期，播放時若 403 就重新呼叫 /issue-cookie

HLS.js 設定範例：
new Hls({
  xhrSetup: (xhr, url) => {
    const segmentUrl = new URL(url);
    segmentUrl.searchParams.set('Policy', policy);
    segmentUrl.searchParams.set('Signature', signature);
    segmentUrl.searchParams.set('Key-Pair-Id', keyPairId);
    xhr.open('GET', segmentUrl.toString(), true);
  }
});
```

---

## Supabase schema 變更

`course_chapters` 表需新增欄位：
```sql
ALTER TABLE course_chapters ADD COLUMN hls_ready boolean DEFAULT false;
```

`video_url` 欄位語意改為：儲存 HLS prefix（例：`courses/{course_id}/{chapter_id}/`）

---

## 新增 Parameters（samconfig.toml 要補）

| Parameter | 值 | 說明 |
|-----------|-----|------|
| `CfKeyGroupId` | 手動建後填入 | CloudFront Key Group ID |
| `FfmpegImageUri` | ECR image URI | 推完 Docker image 後填入 |
| `BatchSubnetId` | VPC subnet ID | Fargate 用，可用預設 VPC |
| `BatchSgId` | Security Group ID | Fargate 用，允許 outbound 443 |

---

## 實作順序

1. **Docker image** ✅：Dockerfile + entrypoint.sh，build + push 到 ECR (`solis-ffmpeg-hls`)
2. **手動前置** ✅：RSA key pair → SSM (`/solis/cf_private_key`, `/solis/cf_key_id`)，CloudFront Key Group (`f487bba4`)
3. **SAM template** ✅：所有資源部署完成
4. **Lambda: trigger_batch** ✅：實作並測試通過
5. **Lambda: get_upload_presigned_url** ✅：修復 CORS 問題（ContentType + S3 regional endpoint）
6. **Lambda: issue_cookie** ✅：改用 Signed URL 取代 Signed Cookie
7. **前端 MemberCourse.tsx** ✅：HLS.js xhrSetup 自動附加簽名參數
8. **後台 ChapterManager** ✅：上傳已改指向 raw bucket
9. **S3 CORS 設定** ✅：raw bucket 和 hls bucket 都已設定 CORS
10. **端對端測試** ✅：上傳 → 轉檔 → 播放 全部通過
