# 購買後內容交付系統 — 設計文件

## 概覽

本文件描述「購買後內容交付系統」的完整架構設計、遷移計劃、以及部署順序。
目標：讓任何商品（課程、電子書、活動、直播）購買後，會員都能在統一的「我的購買」頁面取得對應內容。

---

## 現有問題

| 問題 | 說明 |
|------|------|
| `user_course_access` 只記課程 | 電子書、活動購買後沒有存取記錄 |
| `ecpay_callback` 只解鎖課程 | 其他商品付款後無對應行為 |
| 前端 `MemberCourses` 只顯示課程 | 其他購買內容無法呈現 |
| 管理員無法設定購買後訊息 | 只能靠 email，無法在會員頁顯示 |

---

## 目標架構

```
orders
  └── order_items
        └── product_id → products
              ├── post_purchase_note    管理員自訂文字
              ├── post_purchase_image   管理員自訂圖片
              └── product_deliverables  可交付內容清單
                    └── type: video_course | ebook_url | event_info | live_link

user_product_access（取代 user_course_access）
  ├── user_id → Cognito sub
  ├── product_id → products
  └── order_id → orders
```

---

## 資料表設計

### 修改 `products`（加欄位）

```sql
ALTER TABLE products
  ADD COLUMN post_purchase_note  text,
  ADD COLUMN post_purchase_image text;
```

| 欄位 | 型別 | 說明 |
|------|------|------|
| `post_purchase_note` | text | 管理員自訂的購買後文字訊息，支援換行 |
| `post_purchase_image` | text | 管理員自訂的購買後圖片 URL |

---

### 新增 `product_deliverables`

```sql
CREATE TABLE product_deliverables (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type        text NOT NULL CHECK (type IN ('video_course','ebook_url','event_info','live_link','download')),
  title       text NOT NULL,
  content     text,        -- 依 type：課程 slug / 下載 URL / 說明文字 / 直播連結
  sort_order  int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);
```

| type | content 用途 |
|------|-------------|
| `video_course` | courses.slug，導向課程播放頁 |
| `ebook_url` | 電子書下載或閱讀連結 |
| `event_info` | 活動說明（地點、時間、集合方式） |
| `live_link` | 直播連結（Zoom / Google Meet） |
| `download` | 其他下載檔案 URL |

---

### 新增 `user_product_access`（取代 `user_course_access`）

```sql
CREATE TABLE user_product_access (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     text NOT NULL,
  product_id  uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  order_id    uuid REFERENCES orders(id) ON DELETE SET NULL,
  granted_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz,
  UNIQUE(user_id, product_id)
);
```

| 欄位 | 說明 |
|------|------|
| `user_id` | Cognito sub（text，不是 FK） |
| `product_id` | 指向 products |
| `order_id` | 哪筆訂單解鎖，手動授權為 null |
| `expires_at` | null = 永久，有值 = 訂閱制到期 |

---

### 遷移 `user_course_access` → `user_product_access`

```sql
INSERT INTO user_product_access (id, user_id, product_id, order_id, granted_at, expires_at)
SELECT
  uca.id,
  uca.user_id,
  c.product_id,
  uca.order_id,
  uca.granted_at,
  uca.expires_at
FROM user_course_access uca
JOIN courses c ON c.id = uca.course_id
WHERE c.product_id IS NOT NULL;
```

---

### 遷移現有 `product_deliverables`（為現有課程建立記錄）

```sql
INSERT INTO product_deliverables (product_id, type, title, content, sort_order)
SELECT
  c.product_id,
  'video_course',
  p.title,
  c.slug,
  0
FROM courses c
JOIN products p ON p.id = c.product_id
WHERE c.product_id IS NOT NULL;
```

---

### RLS

```sql
-- user_product_access：本人可讀
ALTER TABLE user_product_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own access"
  ON user_product_access FOR SELECT
  USING (user_id = auth.uid()::text);

-- product_deliverables：有存取權的人可讀
ALTER TABLE product_deliverables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users with access can view deliverables"
  ON product_deliverables FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_product_access
      WHERE user_id = auth.uid()::text
      AND product_id = product_deliverables.product_id
      AND (expires_at IS NULL OR expires_at > now())
    )
  );
```

---

### Admin Trigger（更新版）

```sql
-- 新 admin 加入時，取得所有商品存取權
CREATE OR REPLACE FUNCTION grant_admin_all_products()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'admin' THEN
    INSERT INTO user_product_access (user_id, product_id, granted_at, expires_at)
    SELECT NEW.user_id, p.id, now(), NULL
    FROM products p
    WHERE p.id NOT IN (
      SELECT product_id FROM user_product_access WHERE user_id = NEW.user_id
    )
    ON CONFLICT (user_id, product_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 新商品上架時，自動給所有 admin
CREATE OR REPLACE FUNCTION grant_new_product_to_admins()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_product_access (user_id, product_id, granted_at, expires_at)
  SELECT r.user_id, NEW.id, now(), NULL
  FROM user_roles r
  WHERE r.role = 'admin'
  ON CONFLICT (user_id, product_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 後端（Lambda）修改

### `ecpay_callback` 修改

付款成功後，寫入 `user_product_access`（取代現有的 `user_course_access`）：

```python
# 現有邏輯（找 course_id）→ 改成找 product_id
# order_items → product_id → insert user_product_access

INSERT INTO user_product_access (user_id, product_id, order_id, granted_at)
SELECT user_id, oi.product_id, o.id, now()
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
WHERE o.id = :order_id
ON CONFLICT (user_id, product_id) DO NOTHING;
```

### `course_access` Lambda

改查 `user_product_access`，透過 `product_deliverables` 找到課程 slug：

```python
# 查有沒有對應 product 的存取權
SELECT 1 FROM user_product_access
WHERE user_id = :user_id
AND product_id = (
  SELECT product_id FROM courses WHERE id = :course_id
)
AND (expires_at IS NULL OR expires_at > now())
```

---

## 前端修改

### 頁面重構

| 現有 | 改成 | 說明 |
|------|------|------|
| `/member-courses` | `/member/purchases` | 顯示所有已購商品 |
| `MemberCourses.tsx` | `MemberPurchases.tsx` | 統一購買後入口 |
| `MemberCourse.tsx` | 保留 | 只處理影片播放 |

### `MemberPurchases` 顯示邏輯

```
拿到 user_product_access 清單
  └── 對每個 product：
        ├── 顯示 post_purchase_note（如有）
        ├── 顯示 post_purchase_image（如有）
        └── 依 product_deliverables 顯示內容：
              ├── video_course → 進入課程按鈕 → /member/courses/:slug
              ├── ebook_url   → 下載/閱讀按鈕
              ├── event_info  → 顯示活動資訊文字
              └── live_link   → 顯示直播連結
```

### 後台 `ProductsTab` 新增欄位

每個商品編輯頁加：
- `post_purchase_note`（Textarea）
- `post_purchase_image`（上傳）
- `product_deliverables`（依 type 動態欄位）

---

## 部署順序

**嚴格按照以下順序，避免 FK 錯誤或資料遺失。**

### Phase 1：DB Migration（不影響現有功能）

```
1. products 加 post_purchase_note, post_purchase_image
2. 建立 product_deliverables 表
3. 建立 user_product_access 表
4. 遷移 user_course_access → user_product_access
5. 遷移現有課程 → product_deliverables
6. 設定 RLS
7. 更新 admin triggers
```

**此階段：舊功能完全不受影響，新表建好備用。**

### Phase 2：後端 Lambda

```
1. 更新 ecpay_callback：寫入 user_product_access（同時保留舊的 user_course_access 寫入，雙寫過渡）
2. 更新 course_access：改查 user_product_access
3. 部署、測試購買流程
```

**此階段：雙寫確保舊流程不中斷。**

### Phase 3：前端

```
1. 新增 MemberPurchases.tsx
2. 更新路由 /member-courses → /member/purchases
3. 更新後台 ProductsTab（加 post_purchase_note, post_purchase_image, deliverables）
4. 測試所有商品類型的購買後顯示
```

### Phase 4：清理

```
1. 確認所有流程正常後，移除 ecpay_callback 的雙寫邏輯
2. 移除 user_course_access 表（或保留作歷史記錄）
3. 移除前端 MemberCourses.tsx
```

---

## 測試清單

- [ ] 購買課程 → `user_product_access` 有記錄 → 會員頁顯示課程
- [ ] 購買電子書 → `user_product_access` 有記錄 → 會員頁顯示下載連結
- [ ] 購買活動 → `user_product_access` 有記錄 → 會員頁顯示活動訊息
- [ ] Admin 自動取得所有商品存取權
- [ ] 新商品上架 → Admin 自動取得存取權
- [ ] 管理員設定 `post_purchase_note` → 會員頁正確顯示
- [ ] 過期商品（`expires_at`）不再顯示

---

## 檔案對應

| 檔案 | 動作 |
|------|------|
| `supabase/migrations/20260627030000_user_product_access.sql` | Phase 1 DB migration |
| `backend/functions/ecpay_callback/app.py` | Phase 2 雙寫 |
| `backend/functions/course_access/app.py` | Phase 2 改查新表 |
| `src/pages/MemberPurchases.tsx` | Phase 3 新增 |
| `src/components/admin/ProductsTab.tsx` | Phase 3 加欄位 |
| `src/App.tsx` | Phase 3 更新路由 |
