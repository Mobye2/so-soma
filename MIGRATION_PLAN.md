# Solis & Somatic 遷移計畫

## 目標
從 Lovable 平台遷移到 AWS，脫離 Lovable 訂閱費用，費用降至 $0/月。

---

## 最終架構

| 層次 | 技術 | 費用 | 狀態 |
|------|------|------|------|
| 前端 | Vite React → Next.js + S3 + CloudFront | $0 | 🔄 Phase 7 |
| 後端 API | API Gateway + Lambda (Python) | $0 | ✅ |
| 資料庫 | Supabase Free (PostgreSQL) | $0 | ✅ |
| Auth | Amazon Cognito | $0 | ✅ |
| 影片串流 | S3 + CloudFront Signed Cookie + Batch FFmpeg | $0 | 🔄 Phase 6 後端✅ 前端待做 |
| Email 發送 | Amazon SES | $0 | ✅（Sandbox） |
| Email Queue | Amazon SQS | $0 | ✅ |
| 金流 | ECPay | - | ✅ |
| **總計** | | **$0/月** | |

---

## 技術選型（實際）

- **Lambda 語言**：Python，純 `urllib` + `boto3`，無需 Layer
- **資料庫連線**：Supabase REST API（urllib 直打）
- **前端框架**：目前 Vite React，Phase 7 考慮換 Next.js
- **Auth**：Cognito（已完成）
- **Email Queue**：SQS 取代 Supabase pgmq

---

## Lambda 清單

| Lambda | 狀態 | 備註 |
|--------|------|------|
| `create_order` | ✅ 部署測試完成 | 使用 supabase-py layer |
| `ecpay_create_payment` | ✅ 部署測試完成 | 使用 supabase-py layer |
| `ecpay_callback` | ✅ 部署測試完成 | 使用 supabase-py layer |
| `send_transactional_email` | ✅ 部署測試完成 | 已改 urllib，無 layer |
| `handle_email_unsubscribe` | ✅ 部署測試完成 | 已改 urllib，無 layer |
| `notify_published_posts` | ✅ 部署測試完成 | 已改 urllib，無 layer |
| `process_email_queue` | ✅ 部署測試完成 | SQS trigger，無 layer |
| `handle_email_suppression` | ⏳ 待啟用 | 等 SES 出 Sandbox，需 SNS Topic |
| `auth_email_hook` | ⏳ 待啟用 | 等 Cognito KMS Key 設定 |
| `sync_gsc_metrics` | ⏳ 待啟用 | 等網站上線、GSC service account |

---

## 遷移階段

### Phase 1：Supabase 遷移 ✅
- [x] 開新 Supabase Free 帳號
- [x] 建立 schema（courses、products、orders、user_course_access 等）
- [x] 更新 `.env` 指向新 Supabase 專案
- [x] RLS policies 設定

### Phase 2：Cognito 建立 ✅
- [x] 建立 Cognito User Pool
- [x] 設定 App Client
- [x] 重寫 `useAuth.tsx` → Cognito SDK
- [x] 會員註冊（含驗證碼流程）、登入、登出

### Phase 3：Lambda 重建 ✅
- [x] 建立 SAM 基礎架構（API Gateway + Lambda）
- [x] `create_order`
- [x] `ecpay_create_payment`
- [x] `ecpay_callback`
- [x] `send_transactional_email`（已改 urllib）
- [x] `handle_email_unsubscribe`（已改 urllib）
- [x] `notify_published_posts`（已改 urllib）
- [x] `process_email_queue`（SQS 取代 pgmq）
- [x] `handle_email_suppression`（code 完成，待部署）
- [x] `auth_email_hook`（code 完成，待部署）
- [x] `sync_gsc_metrics`（code 完成，待部署）

### Phase 4：Email ✅（部分）
- [x] SES 網域驗證（solisforest.com）
- [x] SQS queue 建立（取代 pgmq）
- [x] 訂閱 / 退訂完整流程測試
- [x] 所有 email template 實作
- [ ] SES 申請移出 Sandbox（需官網上線）
- [ ] handle_email_suppression 啟用（SNS Topic）
- [ ] auth_email_hook 啟用（Cognito KMS）

### Phase 5：前端 ✅（大部分）
- [x] 所有頁面建好（首頁、課程、商店、部落格、會員、後台等）
- [x] 購買流程（ECPay 金流）
- [x] 課程解鎖（user_course_access）
- [x] 後台課程管理
- [x] 訂閱 / 退訂前端串接
- [ ] `/shop/:slug` 商品詳細頁（待建）

### Phase 6：影片串流 🔄（後端完成，前端待做）
- [x] S3 raw bucket（`solis-videos-raw-836923176646`）
- [x] S3 HLS bucket（`solis-videos-hls-836923176646`）
- [x] CloudFront Distribution + OAC（`d6hezkk15hu6r.cloudfront.net`）
- [x] CloudFront Signed Cookie（RSA key pair → SSM）
- [x] AWS Batch Fargate + FFmpeg container（ECR: `solis-ffmpeg-hls`）
- [x] Lambda: `trigger_batch`（S3 event → Batch job）
- [x] Lambda: `issue_cookie`（JWT 驗證 → Signed Cookie）
- [x] Lambda: `get_upload_presigned_url`（admin 上傳 → raw bucket）
- [x] 端對端轉檔測試通過（上傳 → FFmpeg HLS → S3）
- [ ] Supabase migration：`course_chapters` 加 `hls_ready` 欄位
- [ ] 前端 `MemberCourse.tsx`：改用 `/issue-cookie` + HLS.js 播放器
- [ ] 後台 `ChapterManager`：上傳狀態顯示（hls_ready 進度）

### Phase 7：上線 ❌
- [ ] 決定是否換 Next.js（目前 Vite React）
- [ ] S3 + CloudFront 部署前端
- [ ] 自訂 domain 設定（solisforest.com → Route 53）
- [ ] ECPay callback URL 更新
- [ ] SES 申請移出 Sandbox
- [ ] handle_email_suppression 啟用
- [ ] auth_email_hook 啟用
- [ ] sync_gsc_metrics 啟用（GSC service account）
- [ ] 上線前重新產生 Supabase Service Role Key（已曝光）
- [ ] 全功能測試後關閉 Lovable

---

## 待處理（近期）

| 項目 | 優先度 |
|------|--------|
| `/shop/:slug` 商品詳細頁 | 高 |
| Phase 6 前端播放器串接 | 高 |
| Supabase migration（hls_ready 欄位） | 高 |
| SES 移出 Sandbox | 上線前必做 |
| 換 Next.js 或繼續用 Vite | 需決定 |

---

## 注意事項

1. `create_order`、`ecpay_create_payment`、`ecpay_callback` 還在用 supabase-py layer，上線前可考慮一併改成 urllib
2. ECPay callback URL 在 Phase 7 更新
3. Supabase Service Role Key 已曝光（GitHub history），上線前必須重新產生
4. Lovable 訂閱不要急著關，等 Phase 7 全功能測試完再關
