# Workflow Rules

## 對於不確定議題的作法
對於不確定的議題先向使用者確認後，或是提出蒐集資訊的需求，再依據資訊執行

## 不要使用POWERSHELL
不要在SHELL使用 powershell ....，容易出現編碼問題

## Git Push 規則

每完成一個階段性任務，提醒用戶執行以下步驟：

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


## 若要掌握專案狀況，直接查看/docs內文件