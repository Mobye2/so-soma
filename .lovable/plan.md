## 目標
將 Lovable Cloud 上的 23 個 public schema 資料表全部匯出為 CSV 檔案，方便你搬遷到其他 Supabase / Postgres 環境。

## 為什麼用這個方法
- Lovable Cloud 不開放 `pg_dump` 或外部資料庫連線字串，所以無法用 Windows psql / DBeaver 直連
- 但我在沙箱裡有 select 權限，可以用 `psql COPY ... TO CSV` 把每個資料表完整匯出
- `auth.users`（帳號密碼）任何方法都拿不到，這部分不在此計畫範圍

## 步驟

1. **列出所有 public schema 資料表**，確認 23 個表名與筆數
2. **逐表匯出 CSV** 到 `/mnt/documents/db-export/`
   - 每個檔案：`<table_name>.csv`，含表頭
   - 使用 `COPY (SELECT * FROM <table>) TO STDOUT WITH CSV HEADER`
3. **打包成 zip**：`/mnt/documents/db-export.zip`，方便你一次下載
4. **產生 manifest**：`/mnt/documents/db-export/README.txt` 列出每個表的筆數與匯出時間，方便對帳

## 不包含
- `auth.users`、`storage.objects` 等 Supabase 管理的 schema（無權限）
- Schema 結構（已經在 `supabase/migrations/` 程式碼裡了）
- pg_dump 格式 / SQL INSERT 格式（Lovable Cloud 限制）

## 搬到新環境怎麼用
1. 在新 Supabase 專案執行你 repo 裡的 `supabase/migrations/` 重建 schema
2. 用 Supabase Dashboard 的 Table Editor → Import CSV，或 `psql \copy` 把 CSV 灌回去
3. `auth.users` 另外處理（請使用者重設密碼）
