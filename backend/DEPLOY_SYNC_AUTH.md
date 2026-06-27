# 部署 Sync Auth - 雙驗證方案

## 準備工作

### 0. 套用新的 RLS Policies（重要！）

我們需要先在 Supabase 套用新的 RLS policies，讓它支援雙 Auth 方案：

```bash
cd supabase

# 推送新的 migration
supabase db push

# 或者手動在 Supabase SQL Editor 執行
# migrations/20260621000000_dual_auth_rls.sql
```

這個 migration 會：
- ✅ 設定 profiles 表的 RLS（用戶只能看自己的）
- ✅ 設定 orders 表的 RLS（用戶只能看自己的訂單，admin 可看全部）
- ✅ 設定 blog_posts 表的 RLS（admin 可管理，公開文章所有人可讀）
- ✅ 設定 storage.blog-images 的權限（admin 可上傳，所有人可讀）

### 1. 取得 Supabase JWT Secret

1. 前往 [Supabase Dashboard](https://app.supabase.com)
2. 選擇你的專案：`clyvbsxlmhozbaoktfsl`
3. 前往 **Project Settings** → **API**
4. 找到 **JWT Settings** 區塊
5. 複製 **JWT Secret**（一個很長的字串）

### 2. 更新 Layer 依賴

由於我們在 `sync_auth` 加入了 `PyJWT`，需要更新 shared layer：

```bash
cd backend/layers/shared/python
pip install PyJWT==2.8.0 -t .
cd ../../../
```

或者簡單做法：把 PyJWT 加到 `backend/layers/shared/requirements.txt`

## 部署步驟

### 方法 A: 使用 sam deploy（推薦）

```bash
cd backend

sam build

sam deploy \
  --parameter-overrides \
    "SupabaseJwtSecret=YOUR_JWT_SECRET_HERE" \
  --no-confirm-changeset
```

### 方法 B: 更新 samconfig.toml 後部署

編輯 `backend/samconfig.toml`，在 `parameter_overrides` 加入：

```toml
parameter_overrides = "... SupabaseJwtSecret=YOUR_JWT_SECRET_HERE ..."
```

然後執行：

```bash
cd backend
sam build
sam deploy
```

## 部署後測試

### 🎯 最佳測試方式：使用會員中心的訂單記錄

這是最真實的測試場景，因為 OrdersTab 已經在用 Supabase 直接查詢！

#### 測試步驟：

1. **啟動前端**
   ```bash
   npm run dev
   ```

2. **登入你的帳號**
   - 前往 `/auth`
   - 輸入帳號密碼登入
   - 打開 Browser DevTools → Console
   - ✅ 確認沒有 "Failed to sync auth" 錯誤
   - ✅ 應該看到登入成功訊息

3. **前往會員中心**
   - 點擊右上角頭像或前往 `/member`
   - 切換到「訂單記錄」tab
   - ✅ 如果有訂單，應該正常顯示
   - ✅ 如果沒訂單，應該顯示「尚無訂單記錄」

4. **檢查 Console**
   ```javascript
   // 在 Browser Console 執行以下測試
   
   // 1. 確認 Supabase session 存在
   const { data: { session } } = await supabase.auth.getSession();
   console.log('✅ Supabase session:', session);
   console.log('User ID:', session?.user?.id);
   
   // 2. 測試直接查詢（應該成功，不會被 RLS 擋掉）
   const { data, error } = await supabase.from('orders').select('*').limit(1);
   console.log('✅ Orders query:', data, error);
   
   // 3. 如果是 admin，測試 admin 查詢
   const { data: allOrders } = await supabase.from('orders').select('*');
   console.log('Admin query:', allOrders);
   ```

5. **如果是 Admin 用戶，測試後台**
   - 前往 `/admin`
   - ✅ 訂單列表應該正常顯示
   - ✅ 活動報名應該正常顯示
   - ✅ 部落格列表應該正常顯示（已改用 Supabase）
   - ⚠️ 其他 tab 可能還會用 /admin-db（還沒改）

### 1. 測試 /sync-auth API（選擇性）

```bash
# 先從前端登入取得 Cognito token
# 然後測試 sync-auth endpoint

curl -X POST https://YOUR_API_URL/prod/sync-auth \
  -H "Authorization: Bearer YOUR_COGNITO_TOKEN" \
  -H "Content-Type: application/json"

# 預期回應：
# {
#   "supabase_token": "eyJhbGc...",
#   "user_id": "xxx-xxx-xxx",
#   "email": "user@example.com",
#   "is_admin": false
# }
```

### 2. 測試前端登入流程

1. 開啟前端：`npm run dev`
2. 登入你的帳號
3. 打開 Browser DevTools → Console
4. 應該看到登入成功，沒有 "Failed to sync auth" 錯誤
5. 進入後台（如果是 admin）
6. 檢查 Admin.tsx 的訂單列表是否正常顯示

### 3. 檢查 Supabase Session

在 Browser Console 執行：

```javascript
// 檢查 Supabase session
const { data: { session } } = await supabase.auth.getSession();
console.log('Supabase session:', session);

// 測試直接查詢（應該要成功）
const { data, error } = await supabase.from('orders').select('*').limit(1);
console.log('Orders query:', data, error);
```

## 可能的問題

### 問題 1: JWT Secret 錯誤

**錯誤訊息**：Token verification failed / Invalid signature

**解決方法**：
- 確認 JWT Secret 正確（從 Supabase Dashboard 複製）
- 確認沒有多餘的空格或引號

### 問題 2: 訂單查詢失敗 / RLS 阻擋

**錯誤訊息**：
- `new row violates row-level security policy`
- 訂單列表空白但 Console 有錯誤
- `Error: No rows found`

**解決方法**：

1. 確認 Cognito sub 和 Supabase user_id 一致：
   ```javascript
   // 在 Console 執行
   const cognitoUser = userPool.getCurrentUser();
   cognitoUser.getSession((err, session) => {
     const payload = session.getIdToken().decodePayload();
     console.log('Cognito sub:', payload.sub);
   });
   
   const { data: { session } } = await supabase.auth.getSession();
   console.log('Supabase user_id:', session?.user?.id);
   
   // 這兩個應該要一樣！
   ```

2. 如果不一樣，檢查 sync_auth Lambda 是否正確設定 user_id

3. 檢查 RLS policies：
   ```sql
   -- 在 Supabase SQL Editor 執行
   SELECT * FROM pg_policies WHERE tablename = 'orders';
   
   -- 確認有類似這樣的 policy：
   -- USING (user_id = auth.uid()) 或
   -- USING (customer_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
   ```

### 問題 3: Layer 沒更新

**錯誤訊息**：`No module named 'jwt'`

**解決方法**：
```bash
cd backend/layers/shared/python
pip install PyJWT==2.8.0 -t .
cd ../../../
sam build
sam deploy
```

## Rollback 計畫

如果出問題需要回滾：

```bash
aws cloudformation delete-stack --stack-name solis-backend
# 然後重新部署舊版本
```

或者暫時關閉 sync-auth 功能，在前端 useAuth.tsx 註解掉：

```typescript
// 暫時註解這段
// try {
//   const cognitoToken = session.getIdToken().getJwtToken();
//   const { supabase_token } = await apiPost<{ supabase_token: string }>(
//     "/sync-auth",
//     {},
//     cognitoToken
//   );
//   await supabase.auth.setSession({
//     access_token: supabase_token,
//     refresh_token: "",
//   });
// } catch (err) {
//   console.error("Failed to sync auth:", err);
// }
```

## 下一步

部署成功並測試通過後：
1. 修改剩下的 admin 元件改用 Supabase 直接查詢
2. 刪除 `/admin-db` Lambda（節省成本）
3. 更新 RLS policies 確保權限正確
4. Git commit & push
