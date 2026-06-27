# ✅ 部署前檢查清單

## 📋 檢查項目

### 1. Supabase Migration
- [ ] 套用新的 RLS policies: `cd supabase && supabase db push`
- [ ] 確認 migration 成功（沒有錯誤訊息）

### 2. 取得必要的 Secret
- [ ] 從 Supabase Dashboard 取得 JWT Secret
  - Project Settings → API → JWT Settings → JWT Secret
- [ ] 記錄下來（等下部署會用到）

### 3. 更新 Lambda Layer
- [ ] Layer 已加入 PyJWT 依賴
  - ✅ 已更新 `backend/layers/shared/requirements.txt`

### 4. 檢查程式碼修改
- [ ] ✅ `backend/functions/sync_auth/app.py` - 已建立
- [ ] ✅ `backend/template.yaml` - 已加入 SyncAuthFunction
- [ ] ✅ `src/hooks/useAuth.tsx` - 登入時呼叫 sync-auth
- [ ] ✅ `src/pages/Admin.tsx` - 改用 Supabase 直接查詢
- [ ] ✅ `src/components/admin/BlogPostsTab.tsx` - 改用 Supabase 直接查詢

### 5. 測試環境準備
- [ ] 本地前端可以正常啟動: `npm run dev`
- [ ] 有測試帳號可以登入
- [ ] （如果是 admin）確認在 Cognito 有 admin group

## 🚀 部署步驟（照順序執行）

### Step 1: 套用 RLS Migration
```bash
cd supabase
supabase db push
```

**預期結果**：
```
Applying migration 20260621000000_dual_auth_rls.sql...
✓ Migration applied successfully
```

### Step 2: 部署 Lambda
```bash
cd ../backend
sam build
sam deploy --parameter-overrides "SupabaseJwtSecret=YOUR_JWT_SECRET"
```

**預期結果**：
```
Successfully created/updated stack - solis-backend in ap-east-2
Outputs:
  ApiUrl: https://xxxxx.execute-api.ap-east-2.amazonaws.com/prod
```

### Step 3: 測試前端
```bash
cd ..
npm run dev
```

1. 開啟 http://localhost:8080
2. 登入帳號
3. 前往 `/member` → 訂單記錄
4. 檢查 Console 沒有錯誤

### Step 4: 驗證功能

#### 一般用戶測試
- [ ] 登入成功（Console 沒有 "Failed to sync auth" 錯誤）
- [ ] 會員中心 → 訂單記錄正常顯示
- [ ] 會員中心 → 個人資料可以查看

#### Admin 測試（如果是 admin 帳號）
- [ ] 後台 `/admin` 可以進入
- [ ] 訂單列表正常顯示
- [ ] 活動報名正常顯示
- [ ] 部落格列表正常顯示
- [ ] 可以編輯部落格文章
- [ ] 可以上傳圖片到部落格

#### Console 驗證
在 Browser DevTools Console 執行：

```javascript
// 1. 檢查 Supabase session
const { data: { session } } = await supabase.auth.getSession();
console.log('✅ Session:', session);
console.log('User ID:', session?.user?.id);

// 2. 測試直接查詢
const { data, error } = await supabase.from('orders').select('*').limit(1);
console.log('✅ Query result:', data, error);
```

## ⚠️ 常見問題

### 問題 1: RLS 阻擋查詢
**症狀**: 訂單列表空白，Console 顯示 RLS policy violation

**檢查**:
```javascript
// 檢查 user_id 是否一致
const cognitoUser = userPool.getCurrentUser();
cognitoUser.getSession((err, session) => {
  const payload = session.getIdToken().decodePayload();
  console.log('Cognito sub:', payload.sub);
});

const { data: { session } } = await supabase.auth.getSession();
console.log('Supabase user_id:', session?.user?.id);
// 這兩個應該一樣！
```

### 問題 2: JWT Secret 錯誤
**症狀**: 登入後 Console 顯示 "Failed to sync auth"

**解決**: 檢查 Lambda 環境變數中的 SUPABASE_JWT_SECRET 是否正確

### 問題 3: Layer 沒更新
**症狀**: Lambda 錯誤 "No module named 'jwt'"

**解決**:
```bash
cd backend
sam build --use-container
sam deploy
```

## ✅ 測試通過後

- [ ] Git commit 所有改動
- [ ] Push 到 remote
- [ ] 記錄測試結果
- [ ] 繼續改其他 admin 元件（CoursesTab 等）

## 📝 Rollback 計畫

如果測試失敗需要回滾：

1. 暫時關閉 sync-auth（前端）:
   - 在 `useAuth.tsx` 註解掉 sync-auth 相關程式碼

2. 或完全回滾（後端）:
   ```bash
   aws cloudformation delete-stack --stack-name solis-backend
   # 然後重新部署舊版本
   ```
