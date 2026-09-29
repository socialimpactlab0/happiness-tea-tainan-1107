# 11/7 幸福茶席｜正式網站部署說明

這一包已經把新版 v3 視覺、報名表、GAS 後端、Google Sheet 欄位、UTM 漏斗追蹤、Meta Pixel 串接整理好。

## 你只要做 5 件事

### 1. 新建 Google Sheet
建議名稱：
`1107幸福茶席報名名單`

### 2. 建立 Apps Script
在 Google Sheet：
「擴充功能」→「Apps Script」

把：
- `gas/Code.gs`
- `gas/Analytics.gs`

貼到 Apps Script。

### 3. 初始化工作表
先執行：
`setupRegistrationSheet`

再執行：
`setupAnalyticsDashboard`

授權完成後，Google Sheet 會出現：
- 報名名單
- 流量紀錄
- 流量分析

### 4. 部署 GAS
Apps Script 右上：
「部署」→「新增部署作業」→「網頁應用程式」

設定：
- 執行身分：我
- 誰可以存取：所有人

部署完成後，複製結尾為 `/exec` 的網址。

### 5. 把 /exec 貼到 config.js
開啟 `config.js`，找到：

`GAS_WEB_APP_URL: ""`

改成：

`GAS_WEB_APP_URL: "https://script.google.com/macros/s/XXXXX/exec"`

存檔後，把整個網站資料夾上傳到 GitHub Pages 即可。

---

## 正式上線前測試

1. 打開網站 → 流量紀錄應出現 `page_view`
2. 點「立即報名」→ 應出現 `registration_click`
3. 開始填資料 → 應出現 `form_start`
4. 實際送一筆測試 → 報名名單出現資料
5. 流量紀錄出現 `registration_success`
6. 流量分析有數字
7. 測試完成後，再刪除測試資料

---

## FB 廣告網址範例

`https://你的網址/?utm_source=facebook&utm_medium=paid_social&utm_campaign=1107_happiness&utm_content=doctor_a`

建議：
- utm_source：facebook / instagram
- utm_medium：paid_social
- utm_campaign：1107_happiness
- utm_content：doctor_a / doctor_b / tea_a 等

---

## 重要
- 報名欄位與原 mind-body-tea-tainan 相同。
- 一次最多 4 位。
- 每位都需要姓名、手機、職業。
- 同一活動中，相同手機會阻止重複報名。
- 11/7 的活動編號已改成：
  `2026-11-07-happiness-tea-tainan`
- 原 Meta Pixel ID 已保留。
