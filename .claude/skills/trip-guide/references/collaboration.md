# 合作方式、資料查證、交接與部署

## 和使用者合作
- 使用者用繁體中文就一律回繁體中文；畫面文案同語言，當地專名保留原文（夢テラス、えきねっと）。
- **重大改版先問、先給樣板**：用 AskUserQuestion 給 2–4 個選項（推薦的放第一個並標「（推薦）」）；
  版面類的改動先在 scratchpad 做一頁 mockup HTML、用 Playwright 截圖給使用者看（例：天氣 A/B/C、餐廳頁 B1/B2/B3，
  **每個切換狀態都要畫**，例如「依日期」「依地區」兩種都要給）。
- 一次改一件事；改完就 commit＋push，讓使用者在手機上看 Pages。
- 使用者提出想法時，若有更好的做法要直說理由（例：「午餐卡在 12:00 → 動物園只能移到隔天早上」），但決定權在使用者。
- 行程有硬限制時把推導鏈寫進 CLAUDE.md（為什麼這樣排），避免之後被改回去。
- 使用者說「刪掉」的東西在 CLAUDE.md 記「勿再加回」。
- 回報時說清楚：做了什麼、哪些沒實測（連不到外網）、哪些資料是估的。

## 資料來源與查證
- **使用者給的 PDF 手冊**：多半沒有中文字層 → `apt-get install poppler-utils poppler-data fonts-noto-cjk`
  （**poppler-data 是關鍵**，缺它 CJK 頁面渲染全白），`pdftoppm -r 110 -png`（小字用 200 dpi）轉圖再讀。
  記下手冊版本日期（價格、公休會過時）。
- **網路搜尋**（WebSearch）查營業時間、票價、電話；查到的標日期，沒查到的寫「未查證」或「待確認」，畫面上用灰字。
- **座標**：地理編碼服務常被網路政策擋 → 依官方地圖、地址估（±100–200 m），寫進 CLAUDE.md，並跑 `scripts/check.js` 落海檢查。
- **時間**：巴士、步行、推算的時間標「約」；鐵道時刻沒查就寫「推算」。
- **天氣平年值**：氣象局平年值的約略數字，畫面標「平年」「約」。
- **官方網址**：連不到外網時只填官方首頁，並說明沒實際點開驗證。

## CLAUDE.md（專案交接文件）
新行程 repo 根目錄一定要有。開頭寫：專案是什麼、目前行程表（Day｜日期｜內容｜過夜）、重要決策脈絡（別再改回去）。
之後每次改動加一節，**插在固定位置**（例如「GitHub Pages 發布」那節之前），格式：

```markdown
### 2026-10-07 變更（三十六）：一句話標題
使用者要求「原話」。（一兩句背景）
- **做了什麼**：資料改哪裡、函式叫什麼、規則是什麼。
- **沒查證**的地方。
- **踩雷**：花時間才發現的問題與解法。
- 驗證：`scratchpad/xxx.js`（測了什麼）。
```
末尾維護「待辦」與「index.html 內部結構」「修改慣例」三節。新對話開始時先讀 CLAUDE.md。

## Commit 與部署
- 在指定分支開發，commit 訊息用中文一句話標題＋條列；推送 `git push -u origin <branch>`，網路失敗才重試。
- GitHub Pages：Settings → Pages → Deploy from a branch（選開發分支、根目錄）。每次 push 觸發 `pages build and deployment`。
- 推送後確認發布成功再回報：`gh api "repos/<owner>/<repo>/actions/runs?per_page=1"` 看 `head_sha`、`status`、`conclusion`。
- YouTube 內嵌在 `file://` 會錯誤 153（需要 referrer），這是要放上 Pages 的原因之一，不是 bug。

## 驗證
- 每次改完：`node scripts/check.js index.html <scratchpad>/shots`（零 ✗）。
- 針對這次改動另寫一支 Playwright 腳本放 scratchpad：模擬點擊、量測數值（標記數、縮放倍率、溢出寬度）、截圖給自己看。
- 手機用 `viewport 390×844, isMobile, hasTouch, deviceScaleFactor 2`；桌機 1280×900。
- 改動前跑一次存輸出、改動後再跑比對（範例的 `twostep.js` 就是逐字比對桌機字卡流程沒被改壞）。
- 「現在」模式用 `?now=YYYY-MM-DDTHH:MM` 測；外部 API 用 `page.route` 給假資料。
