# 系統架構總覽 ARCHITECTURE.md

前端頁面、後端 Lambda、資料庫表的完整對應關係。

---

## 架構圖

```
瀏覽器（Vite React）
  │
  ├── 靜態內容         → Supabase 直讀（blog_posts、products、courses）
  │
  └── 需要後端的動作   → API Gateway → Lambda → Supabase / SES / ECPay
```

---

## 頁面 × Lambda × 資料表對應

### 公開頁面

| 頁面 | 路由 | Lambda | Supabase 表 |
|------|------|--------|-------------|
| 首頁 | `/` | — | `products`、`courses`、`blog_posts` |
| 關於 | `/about` | — | — |
| 課程總覽 | `/courses` | — | `courses` |
| 森林療癒 | `/forest-therapy` | — | — |
| 陰瑜珈 | `/mindful-yin-yoga` | — | — |
| 陰瑜珈試堂 | `/yin-yoga-free-trial` | — | `courses`、`course_chapters` |
| 自我照顧 | `/self-care` | — | — |
| 商品列表 | `/shop` | — | `products` |
| 商品詳細 | `/shop/:slug` | — | `products` |
| 實體活動 | `/events` | — | — |
| 電子書 | `/ebooks` | — | `products` |
| 身心測驗 | `/quiz` | — | `quiz_results`（寫入） |
| 部落格列表 | `/blog` | — | `blog_posts` |
| 部落格分類 | `/blog/category/:slug` | — | `blog_posts` |
| 單篇文章 | `/blog/:slug` | — | `blog_posts` |
| 聯絡我們 | `/contact` | `send_transactional_email` | `contact_messages` |
| 退訂 Email | `/unsubscribe?token=` | `handle_email_unsubscribe` | `email_unsubscribe_tokens`、`suppressed_emails`、`newsletter_subscribers` |

---

### 購買流程

```
/shop 或介紹頁
  → 加入購物車（CartContext）
    → /checkout
        POST /orders          → create_order
                                  寫入: orders、order_items、event_registrations
                                  發信: send_transactional_email（event-registration-confirmation）

        POST /ecpay-create-payment → ecpay_create_payment
                                  讀取: orders、order_items
                                  回傳: ECPay 表單 HTML

    → ECPay 付款頁（外部）
        → ECPay POST callback → ecpay_callback
                                  更新: orders.status → paid
                                  寫入: user_course_access
                                  發信: send_transactional_email（order-payment-success）

    → /order-success（瀏覽器跳轉）
```

| 步驟 | Lambda | 讀寫表 |
|------|--------|--------|
| 建立訂單 | `create_order` | `orders`、`order_items`、`event_registrations` |
| 發起付款 | `ecpay_create_payment` | `orders`、`order_items` |
| 付款回呼 | `ecpay_callback` | `orders`、`user_course_access` |
| 付款成功發信 | `send_transactional_email` | `email_send_log`、`email_unsubscribe_tokens`、`suppressed_emails` |

---

### 會員區

| 頁面 | 路由 | Lambda | Supabase 表 |
|------|------|--------|-------------|
| 登入／註冊 | `/auth` | `sync_auth` | — |
| 會員中心 | `/member` | — | `profiles`、`orders` |
| 修改密碼 | `/member` → 密碼 tab | — | Cognito |
| 訂單記錄 | `/member` → 訂單 tab | — | `orders`、`order_items` |
| 我的課程列表 | `/member-courses` | — | `user_course_access`、`courses` |
| 課程播放頁 | `/member/courses/:slug` | — | `user_course_access`、`course_chapters` |

---

### 後台

| 後台 Tab | Lambda | Supabase 表 |
|----------|--------|-------------|
| 課程管理 | — | `courses`、`course_chapters`、`products` |
| 部落格管理 | `notify_published_posts`（發布時手動觸發） | `blog_posts`、`newsletter_subscribers` |
| 商品管理 | — | `products` |
| 訂閱者管理 | — | `newsletter_subscribers` |
| 聯絡訊息 | — | `contact_messages` |
| 管理員管理 | — | `user_roles` |
| IG 貼文 | — | `ig_posts` |
| SEO 指標 | `sync_gsc_metrics`（待啟用） | `seo_daily_metrics`、`seo_page_metrics`、`seo_query_metrics` |

---

## Lambda 清單

| Lambda | 觸發方式 | 狀態 | 說明 |
|--------|----------|------|------|
| `create_order` | POST `/orders` | ✅ 部署 | 建立訂單、寫 order_items |
| `ecpay_create_payment` | POST `/ecpay-create-payment` | ✅ 部署 | 產生 ECPay 表單 |
| `ecpay_callback` | POST `/ecpay-callback` | ✅ 部署 | 驗證付款、解鎖課程 |
| `send_transactional_email` | POST `/send-email` 或 Lambda invoke | ✅ 部署 | 統一發信入口 |
| `handle_email_unsubscribe` | GET `/unsubscribe` | ✅ 部署 | 退訂、寫入黑名單 |
| `notify_published_posts` | 後台發文後手動 invoke | ✅ 部署 | 發信給全體訂閱者 |
| `process_email_queue` | EventBridge rate(5min)，disabled | ✅ 部署 | 排空 pgmq queue（備用） |
| `handle_email_suppression` | SNS（SES bounce/complaint） | ⏳ 等 SES 出 Sandbox | 自動加黑名單 |
| `auth_email_hook` | Cognito Custom Email Sender | ⏳ 等 Cognito KMS 設定 | 驗證碼中文信 |
| `sync_auth` | POST `/sync-auth` | ✅ 部署 | Cognito ↔ Supabase 身份橋接，回傳 ES256 JWT |
| `sync_gsc_metrics` | EventBridge cron 每日，disabled | ⏳ 等網站上線、GSC 設定 | 同步 SEO 數據 |

---

## Email 模板清單

所有信件統一由 `send_transactional_email` 發出。

| templateName | 觸發時機 | 收件人 |
|---|---|---|
| `event-registration-confirmation` | 報名實體活動 | 報名者 |
| `order-payment-success` | ECPay 付款成功 | 購買者 |
| `contact-confirmation` | /contact 送出表單 | 聯絡者 |
| `welcome-member` | 新會員註冊 | 新會員 |
| `blog-post-subscriber-notice` | 新文章發布 | 全體 newsletter_subscribers |

---

## Supabase 表用途速查

| 表名 | 用途 |
|------|------|
| `products` | 商品（含課程商品） |
| `courses` | 課程資訊，透過 `product_id` 關聯 products |
| `course_chapters` | 課程章節，`is_preview=true` 免費試看 |
| `orders` | 訂單主表 |
| `order_items` | 訂單明細 |
| `user_course_access` | 用戶課程觀看權限 |
| `course_enrollments` | 課程報名記錄 |
| `event_registrations` | 實體活動報名 |
| `blog_posts` | 部落格文章，`publish_notified_at` 防重複發信 |
| `newsletter_subscribers` | 電子報訂閱者（email、source） |
| `suppressed_emails` | 退訂或退信黑名單 |
| `email_unsubscribe_tokens` | 退訂 token，一次性使用 |
| `email_send_log` | 所有發信記錄 |
| `contact_messages` | 聯絡表單訊息 |
| `profiles` | 會員資料（Cognito sub 對應） |
| `user_roles` | 管理員權限（admin / moderator / user） |
| `quiz_results` | 身心測驗結果 |
| `ig_posts` | IG 貼文管理 |
| `seo_daily_metrics` | GSC 每日整體數據 |
| `seo_page_metrics` | GSC 頁面維度數據 |
| `seo_query_metrics` | GSC 關鍵字維度數據 |
| `seo_sync_log` | GSC 同步記錄 |
| `launch_notify_subscribers` | 產品上架通知名單 |

---

## 身份驗證架構（Cognito ↔ Supabase 橋接）

本專案使用 **AWS Cognito 做主要 Auth**，Supabase 做資料庫。兩個系統的身份需要橋接。

### 登入流程

```
用戶輸入帳密
  → Cognito 驗證，回傳 Cognito JWT（RS256，id token）
  → 前端 POST /sync-auth，帶 Cognito JWT
      → Lambda 驗證 Cognito JWT（JWKS 公鑰驗簽）
      → 查 Supabase auth.users 是否已有對應 user
          ┌── 已存在（id 吻合）→ 直接用
          ├── email 存在但 id 不同 → 更新 id 為 Cognito sub
          └── 不存在 → 建立新 user（id = Cognito sub）
      → 呼叫 Supabase Admin generate_link（magiclink）
      → 用 hashed_token 呼叫 /auth/v1/verify
      → 拿到 Supabase 原生 ES256 JWT（access_token）
  → 前端收到 supabase_token
  → 存入 module-level _token
  → 所有 supabase.from() 查詢透過自訂 fetch 注入 Authorization header
```

### 關鍵設計決策

| 決策 | 原因 |
|------|------|
| 不自簽 JWT | Supabase 使用 ECC P-256（ES256），無法用 HS256 自簽 |
| 用 generate_link + verify | 唯一能拿到 Supabase 原生 ES256 token 的方式 |
| ensure_supabase_user 邏輯 | 處理 email 已被舊 Supabase user 佔用的情況 |
| module-level _token | 避免建立多個 GoTrueClient instance，統一注入 header |
| profiles 用 Cognito sub 做 id | Cognito sub 是穩定的 UUID，跨系統唯一識別符 |

### orders RLS 設計

`orders` 表用 `auth.jwt() ->> 'email'` 比對 `customer_email`，而非查 `auth.users` 表（因為舊訂單可能是 email 訂單，不是 auth user）。

```sql
USING (
  customer_email = (auth.jwt() ->> 'email') OR
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
)
```

---

## 安全性原則

### Key 管理規則

| Key 類型 | 存放位置 | 說明 |
|----------|----------|------|
| Supabase anon key | 前端 `VITE_SUPABASE_PUBLISHABLE_KEY` | 公開設計，權限由 RLS 控制 |
| Supabase service role key | Lambda 環境變數（SAM） | 繞過 RLS，絕對不能放前端 |
| Cognito JWT | 登入後存記憶體，隨請求帶入 | 呼叫 Lambda 時放 `Authorization: Bearer` |
| CloudFront private key | SSM Parameter Store（SecureString） | 影片簽章用，Lambda 執行時才讀取 |
| AWS credentials | 不存任何地方 | Lambda 用 IAM Role，本地用 AWS CLI profile |

**原則：任何以 `VITE_` 開頭的變數都會打包進前端 bundle，等同公開。只有 anon key 可以放。**

---

### Supabase RLS 設計原則

**判斷依據：誰需要讀這份資料？**

| 類型 | 做法 | 範例 |
|------|------|------|
| 完全公開內容 | anon 可讀，建 SELECT policy `using (true)` 或條件 | `courses`、`course_chapters`、`blog_posts` |
| 個人資料 | RLS 開啟，不建任何 anon policy，走 Lambda service key | `profiles`、`orders`、`course_enrollments` |
| 寫入操作 | 全部走 Lambda，前端不直接寫敏感表 | 課程管理、付款回呼 |
| 後台系統表 | RLS 開啟，不建任何 policy | `email_send_log`、`user_roles`、`seo_*` |

**service role key 不受 RLS 限制，所以 Lambda 永遠能存取所有表。**

---

### 各表 RLS 狀態

| 表 | RLS | anon 可讀 | 說明 |
|----|-----|-----------|------|
| `courses` | ✅ | ✅ published only | 公開課程介紹 |
| `course_chapters` | ✅ | ✅ | 章節列表公開，影片靠 CloudFront Cookie 保護 |
| `blog_posts` | ✅ | ✅ published only | 公開文章 |
| `products` | ✅ | ✅ is_active only | 公開商品 |
| `profiles` | ✅ | ❌ | 用戶個資 |
| `orders` | ✅ | ❌ | 訂單資料 |
| `order_items` | ✅ | ❌ | 訂單明細 |
| `course_enrollments` | ✅ | ❌ | 課程購買紀錄 |
| `user_roles` | ✅ | ❌ | 權限資料 |
| `quiz_results` | ✅ | ❌ | 健康測驗個資 |
| `email_send_log` | ✅ | ❌ | 後台系統 |
| `suppressed_emails` | ✅ | ❌ | 後台系統 |
| `seo_*` | ✅ | ❌ | 後台分析 |
| `newsletter_subscribers` | ✅ | anon 可寫 | 訂閱表單 |
| `contact_messages` | ✅ | anon 可寫 | 聯絡表單 |

---

### 前端存取資料的分工

```
前端 supabase client（anon key）
  └── 只查公開內容：courses、course_chapters、blog_posts、products

前端 → Lambda（帶 Cognito JWT）
  └── 所有涉及個人資料的查詢：course_enrollments、profiles
  └── 所有寫入操作：訂單、課程管理、影片上傳
  └── 影片播放：CloudFront Signed Cookie
```

---

## 待處理事項

| 項目 | 條件 | 優先度 |
|------|------|--------|
| SES 申請移出 Sandbox | 需要有官網上線 | 上線前必做 |
| handle_email_suppression 啟用 | 建立 SNS Topic → 填入 `SesNotificationTopicArn` → 重新部署 | SES 出 Sandbox 前 |
| auth_email_hook 啟用 | 建立 KMS Key → Cognito Custom Email Sender → 填入 `CognitoKmsKeyId` | SES 出 Sandbox 前 |
| sync_gsc_metrics 啟用 | 網站上線 → GSC 驗證 → Service Account → Secrets Manager | 上線後 |
| /shop/:slug 商品詳細頁 | 前端待建 | 高 |
| CloudFront Signed URL 影片保護 | Phase 6 | 上線前 |
| notify_published_posts 串接後台 | 後台發文按鈕加「發送通知」 | 中 |
