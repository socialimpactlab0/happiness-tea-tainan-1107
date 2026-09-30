# 11/7 幸福茶席｜GitHub 正式版

這個 Repository 已整理成可直接用於 GitHub Pages 的正式網站。

## 已完成
- 保留較成熟的版面與手機優先設計。
- 移除設計草稿、screenshots、JSX、srcmap 等不需要公開的檔案。
- 圖片改用較小的 WebP。
- 加入 Facebook / LINE 分享用的 `assets/images/share.jpg`。
- 神韻藝術區已移除公開 placeholder，改為完整的深綠藝術視覺；日後若有授權舞台照再換即可。
- GAS、UTM、Meta Pixel、1–4 人報名欄位與原邏輯保留。

## 主要網站檔案

```text
index.html
config.js
assets/
README.md
```

## GAS
目前 `config.js` 已保留 GAS `/exec` 網址與活動編號：

- EVENT_ID：`2026-11-07-happiness-tea-tainan`

正式上線後請務必做 1 筆測試報名，確認 Google Sheet 有收到資料。

## 正式測試
1. 打開網站，確認手機版首頁正常。
2. 點「免費報名」，確認會滑到表單。
3. 選 2 位，確認會顯示第 2 位資料欄位。
4. 送出一筆測試報名。
5. Google Sheet 檢查：報名名單、流量紀錄、流量分析。
6. 確認後刪除測試資料。

## FB / LINE 分享縮圖
網站使用：

```html
<meta property="og:image" content="assets/images/share.jpg">
```

等 GitHub Pages 網址確定後，若要提高 Facebook 抓圖穩定度，可把 `og:image` 與 `twitter:image` 改成完整網址。

## 日後若取得授權神韻舞台照
目前神韻藝術區已是完整可上線的文字視覺。若日後有正式授權照片，再將 `.art-photo` CSS 背景改成該照片即可。