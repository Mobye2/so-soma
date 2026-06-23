# Solis & Somatic 遷移計畫

## 目標
從 Lovable 平台遷移到 AWS，脫離 Lovable 訂閱費用，費用降至 $0/月。

---

## 最終架構

| 層次 | 技術 | 費用 |
|------|------|------|
| 前端 | Next.js (TypeScript) + S3 + CloudFront | $0 |
| 後端 API | API Gateway + Lambda (Python) | $0 |
| 資料庫 | Supabase Free (PostgreSQL) | $0 |
| Auth | Amazon Cognito | $0 (5萬MAU免費) |
| 影片/靜態檔案 | S3 + CloudFront Signed URL | $0 |
| Email 發送 | Amazon SES | $0 (3000封/月免費) |
| Email Queue | Amazon SQS | $0 |
| 金流 | ECPay (不動) | - |
| **總計** | | **$0/月** |

---

## 技術選型說明

- **Lambda 語言**：Python，搭配 `supabase-py`、`boto3`
- **資料庫連線**：supabase-py SDK（保留 RLS）
- **前端框架**：Next.js（改善 SEO，對部落格和課程頁面有利）
- **Auth**：Cognito 取代 Supabase Auth（全面遷移，重建會員系統）
- **影片保護**：CloudFront Signed URL，防止非會員存取

---

## Python 套件

| 用途 | 套件 |
|------|------|
| AWS 全部服務 | `boto3` |
| Supabase 連線 | `supabase-py` |
| Cognito JWT 驗證 | `python-jose` |
| Email template | `jinja2` |
| HTTP 請求 | `requests` |

---

## 現有 Functions 對應

| 原 Supabase Edge Function | 新 Lambda (Python) | 說明 |
|---------------------------|-------------------|------|
| `create-order` | `create_order` | 邏輯直接移植 |
| `ecpay-create-payment` | `ecpay_create_payment` | 邏輯直接移植 |
| `ecpay-callback` | `ecpay_callback` | 邏輯直接移植 |
| `send-transactional-email` | `send_transactional_email` | 換 SES |
| `process-email-queue` | `process_email_queue` | pgmq 換 SQS |
| `auth-email-hook` | `auth_email_hook` | 確認 Cognito 觸發方式 |
| `notify-published-posts` | `notify_published_posts` | 邏輯直接移植 |
| `handle-email-unsubscribe` | `handle_email_unsubscribe` | 邏輯直接移植 |
| `handle-email-suppression` | `handle_email_suppression` | 邏輯直接移植 |
| `sync-gsc-metrics` | `sync_gsc_metrics` | 邏輯直接移植 |

---

## 遷移階段

### Phase 1：Supabase 遷移
- [ ] 開新 Supabase Free 帳號
- [ ] 跑所有 migrations 建立 schema
- [ ] 匯入 CSV 資料（23 張表）
- [ ] 更新 `.env` 指向新 Supabase 專案
- [ ] 確認 RLS policies 正常

### Phase 2：Cognito 建立
- [ ] 建立 Cognito User Pool
- [ ] 設定 App Client
- [ ] 設定 User Groups（admin、moderator、user）
- [ ] 遷移現有用戶（profiles 表有 1 筆）
- [ ] 重寫 `useAuth.tsx` → Cognito SDK
- [ ] 重寫 `useAdminCheck.tsx` → Cognito Groups

### Phase 3：Lambda 重建（Python）
- [ ] 建立 Lambda 基礎架構（API Gateway）
- [ ] 逐一移植 10 個 Functions
- [ ] 設定環境變數（Supabase URL/Key、ECPay credentials）
- [ ] 測試每個 Function

### Phase 4：Email 重建
- [ ] 設定 SES，驗證寄件網域（`solisforest.com`）
- [ ] 建立 SQS queue（取代 pgmq）
- [ ] 重寫 email templates（Jinja2 取代 React Email）
- [ ] 測試完整發信流程

### Phase 5：前端重建
- [ ] 建立 Next.js 專案
- [ ] 搬移所有頁面（24 頁）
- [ ] Auth 換 Cognito SDK（`@aws-amplify/auth` 或 `amazon-cognito-identity-js`）
- [ ] 更新所有 API 呼叫（從 supabase.functions.invoke → fetch Lambda URL）
- [ ] SEO meta tags 確認

### Phase 6：影片功能
- [ ] S3 bucket 建立（課程影片專用）
- [ ] 上傳現有課程影片
- [ ] Lambda 實作 CloudFront Signed URL 產生
- [ ] 前端影片播放器整合
- [ ] 更新 `course_chapters.video_url` 欄位

### Phase 7：部署上線
- [ ] Next.js build → 上傳 S3
- [ ] CloudFront distribution 設定
- [ ] 自訂 domain 設定（`solisforest.com`）
- [ ] ECPay callback URL 更新（指向新 Lambda）
- [ ] 全功能測試
- [ ] 確認後關閉 Lovable 訂閱

---

## 現有資料庫資料量（遷移參考）

| 資料表 | 筆數 |
|--------|------|
| blog_posts | 12 |
| courses | 4 |
| course_chapters | 3 |
| products | 7 |
| profiles | 1 |
| user_roles | 2 |
| quiz_results | 30 |
| email_send_log | 68 |
| seo_daily_metrics | 55 |
| seo_page_metrics | 140 |
| 其他 | 少量 |

---

## 注意事項

1. **ECPay callback URL** 必須在 Phase 7 更新，否則付款會回到舊的 endpoint
2. **`solisforest.com` DNS** 需要在 Phase 4 設定 SES 驗證，提前處理避免等待時間
3. **Lovable 訂閱**不要急著關，等全部測試完再關
4. **Cognito 遷移用戶**：現有用戶密碼無法遷移，需要讓用戶重設密碼
