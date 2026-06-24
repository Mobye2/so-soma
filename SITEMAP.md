# 網站地圖 Sitemap

## 公開頁面

```
/                           首頁
├── /about                  關於 Kaia
│
├── /courses                課程總覽（品牌理念、感性介紹）
│   ├── /forest-therapy     森林療癒介紹
│   ├── /mindful-yin-yoga   陰瑜珈介紹
│   │   └── /yin-yoga       → 轉址到 /mindful-yin-yoga
│   ├── /yin-yoga-free-trial 陰瑜珈免費試堂
│   └── /self-care          自我照顧介紹
│
├── /shop                   商品總覽（購買導向）
│   └── /shop/:slug         單一商品詳細頁（大綱、價格、加入購物車）（待建）
│
├── /events                 實體活動
├── /ebooks                 電子書
├── /quiz                   身心測驗
│
├── /blog                   部落格列表
│   ├── /blog/category/:slug    文章分類
│   └── /blog/:slug             單篇文章
│
├── /contact                聯絡我們
└── /unsubscribe            退訂 email
```

---

## 購買流程

```
/courses（或任何介紹頁）
  → 「了解更多 / 前往購買」按鈕
    → /shop/:slug（商品詳細 + 加入購物車）
      → /checkout（結帳）
        → ECPay 付款頁
          → /order-success（付款完成）
```

---

## 會員區（需登入）

```
/auth                       登入 / 註冊
/member                     會員中心
│   ├── 個人資料 tab
│   ├── 修改密碼 tab
│   └── 訂單記錄 tab
/member-courses             我的課程列表
│   ├── 已購買              → 進入課程
│   ├── 有免費試看章節      → 進入課程（只看試看章節）
│   └── 完全鎖住            → 跳到 /shop
└── /member/courses/:slug   課程播放頁
    ├── 已購買              → 所有章節可看
    └── 未購買              → 只有 is_preview=true 章節可看
```

---

## 後台（需管理員權限）

```
/admin
├── 課程管理 tab        新增／編輯課程、章節、觀看期限
├── 部落格管理 tab      新增／編輯文章
├── 商品管理 tab        新增／編輯商品
├── 訂閱者管理 tab
├── 聯絡訊息 tab
├── 管理員管理 tab
├── IG 貼文 tab
└── SEO 指標 tab
```

---

## 待建頁面

| 路由 | 說明 | 優先度 |
|------|------|--------|
| `/shop/:slug` | 單一商品詳細頁，含大綱、加入購物車 | 高 |

---

## 頁面性質說明

| 路由 | 性質 |
|------|------|
| `/courses` 及其子頁 | 感性介紹，建立信任，引導到 /shop |
| `/shop` | 理性購買，列出所有商品 |
| `/shop/:slug` | 決策頁，詳細說明 + 購買行動 |
| `/member-courses` | 已購買內容的入口 |
