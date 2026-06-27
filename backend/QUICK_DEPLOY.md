# 快速部署指令

## 前置準備

1. 取得 Supabase JWT Secret：
   - 前往 https://app.supabase.com
   - Project Settings → API → JWT Settings
   - 複製 JWT Secret

2. 設定環境變數（Windows PowerShell）：
```powershell
$env:SUPABASE_JWT_SECRET="你的_JWT_SECRET"
```

或（Windows CMD）：
```cmd
set SUPABASE_JWT_SECRET=你的_JWT_SECRET
```

## 部署

```bash
cd backend

# 1. Build Lambda 和 Layer
sam build

# 2. Deploy（會自動使用環境變數）
sam deploy --parameter-overrides "SupabaseJwtSecret=$env:SUPABASE_JWT_SECRET"
```

或者一行指令：
```bash
cd backend && sam build && sam deploy --parameter-overrides "SupabaseJwtSecret=YOUR_JWT_SECRET_HERE"
```

## 部署成功後

1. 記下 API URL：
   ```
   Outputs:
   ApiUrl = https://xxxxx.execute-api.ap-east-2.amazonaws.com/prod
   ```

2. 前往前端測試：
   ```bash
   cd ..
   npm run dev
   ```

3. 登入 → 前往會員中心 → 訂單記錄
   - 應該要正常顯示訂單（或顯示"尚無訂單記錄"）
   - Console 不應該有錯誤

## 如果出錯

查看 CloudWatch Logs：
```bash
# 查看 sync-auth logs
aws logs tail /aws/lambda/solis-backend-SyncAuthFunction --follow
```

或在 AWS Console：
CloudWatch → Log groups → /aws/lambda/solis-backend-SyncAuthFunction
