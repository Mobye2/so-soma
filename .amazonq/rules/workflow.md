# Workflow Rules

## Git Push 規則

每完成一輪有意義的對話或一個階段性任務，提醒用戶執行以下步驟：

1. 確認變更內容
2. 提醒用戶 commit 並 push：

```bash
git add .
git commit -m "描述這輪完成的內容"
git push
```

## 時機

- 完成一個 Phase 任務
- 完成一個功能
- 完成重要的設定或檔案變更
- 結束一輪有實質修改的對話前
