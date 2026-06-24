# 課程付款機制文件

## 整體流程

```
用戶結帳 → 建立 order → 前往 ECPay 付款 → ECPay callback → 解鎖課程
```

---

## 資料庫結構

### 相關資料表

| 表名 | 用途 |
|------|------|
| `products` | 商品（包含課程商品） |
| `courses` | 課程資訊，透過 `product_id` 關聯 products |
| `course_chapters` | 課程章節，`is_preview=true` 為免費試看 |
| `orders` | 訂單主表 |
| `order_items` | 訂單內容，每筆記錄一個商品 |
| `user_course_access` | 用戶課程觀看權限 |

### courses 關鍵欄位

| 欄位 | 說明 |
|------|------|
| `product_id` | 關聯 products 表，付款後透過此欄位找到課程 |
| `access_days` | 購買後幾天可觀看，`NULL` = 永久買斷 |

### course_chapters 關鍵欄位

| 欄位 | 說明 |
|------|------|
| `is_preview` | `true` = 免費試看，任何人可看 |

### user_course_access 欄位

| 欄位 | 說明 |
|------|------|
| `user_id` | Cognito sub（非 email） |
| `course_id` | 關聯 courses.id |
| `order_id` | 關聯 orders.id |
| `granted_at` | 開通時間 |
| `expires_at` | 到期時間，`NULL` = 永不到期 |

---

## 付款流程

### 1. 建立訂單（前端 Checkout）
- 前端呼叫 `POST /orders`
- Lambda `create_order` 在 `orders` + `order_items` 寫入資料
- `order_items.product_id` 必須正確填入

### 2. 發起付款（會員中心 → 訂單記錄）
- 前端呼叫 `POST /ecpay-create-payment`，帶入 `orderId`
- Lambda 從 orders 取得金額、從 order_items 取得商品名稱
- 回傳 ECPay 表單參數，前端自動 POST 到 ECPay
- `ReturnURL` = `{API_BASE_URL}/ecpay-callback`（ECPay server 打）
- `OrderResultURL` = `{site_url}/order-success?orderId=xxx`（用戶瀏覽器跳轉）
- `CustomField1` = order_id（callback 用來識別訂單）

### 3. ECPay Callback（付款完成後）
- ECPay POST 到 `{API_BASE_URL}/ecpay-callback`
- Lambda 驗證 CheckMacValue
- 更新 `orders.status` → `paid` 或 `payment_failed`
- 付款成功時：
  1. 查 `order_items.product_id` → 找對應 `courses`
  2. 計算 `expires_at`（根據 `courses.access_days`）
  3. 寫入 `user_course_access`
  4. 非同步發送確認 email

---

## 課程權限控制（前端）

### 課程列表頁 `/member-courses`
- 查 `user_course_access` WHERE `user_id = cognito_sub`
- 有權限 → 顯示「開始觀看」
- 無權限 → 顯示「進入課程」+ 🔒 badge

### 課程播放頁 `/member/courses/:slug`
- 查 `user_course_access` 確認 `hasAccess`
- `is_preview = true` 的章節 → 任何人可看
- `is_preview = false` 的章節：
  - `hasAccess = true` → 可播放
  - `hasAccess = false` → 顯示鎖定畫面

> ⚠️ 前端只做 UI 遮蔽，影片 URL 本身不受保護。  
> 真正的影片保護需要 Phase 6 的 CloudFront Signed URL。

---

## 新增課程 SOP

1. **建立商品**：後台 → 商品管理 → 新增，取得 `product_id`
2. **建立課程**：後台 → 課程管理 → 新增
   - 填入「觀看期限（天）」，留空 = 永久買斷
   - 選擇對應的 `product_id`（目前需手動在 Supabase 更新）
3. **新增章節**：在課程編輯頁 → 章節管理，設定 `is_preview`
4. **測試**：建立測試訂單 → 付款 → 確認 `user_course_access` 有紀錄

---

## 目前已設定的課程

| 課程 | product_id | access_days |
|------|-----------|-------------|
| 神經系統入門課：從科學到日常練習 | `170fd0ce-6375-41ca-a058-492019c0c03b` | NULL（永久） |

---

## 待處理

- [ ] Admin 後台課程表單加入 `product_id` 選擇器（目前需手動到 Supabase 設定）
- [ ] 前端課程播放頁加「到期日」提示（`expires_at` 有值時顯示）
- [ ] Phase 6：CloudFront Signed URL 保護真實影片檔案
- [ ] SES 移出 Sandbox（才能發信給真實用戶）
