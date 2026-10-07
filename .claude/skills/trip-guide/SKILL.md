---
name: trip-guide
description: 製作與維護「單一 HTML 檔」的旅遊懶人包網站（部署在 GitHub Pages、可分享給同行者、手機可加到主畫面離線看）。包含每日路線地圖（依交通方式自動畫線）、時間軸行程、景點卡片（照片輪播＋影片）、手機 App 版（行程／地圖／清單／資訊）、雨備切換、花費分攤、訂票清單、天氣、餐廳口袋名單。當使用者要規劃新的旅遊行程、建立行程網站或懶人包、或修改既有懶人包（加景點、改行程、補照片、調地圖）時使用。Use when the user wants to plan a trip and build/maintain a single-file travel itinerary website (trip guide, 旅遊懶人包, 行程表, itinerary page).
---

# 旅遊懶人包（單一 HTML 檔）

這個 skill 來自一個完整做完的範例（2027 年 2 月 熱海・伊豆・靜岡 8 天 7 夜），引擎、版面、資料格式與踩過的雷都已整理好。
新行程**從範例複製再換資料**，不要從零重寫。

## 檔案

| 路徑 | 用途 |
|---|---|
| `assets/reference-guide.html` | 完整可運作的範例（照片已拿掉，0.4 MB）。**新行程就從這份複製成 `index.html`** |
| `assets/sw.js`、`assets/manifest.webmanifest`、`assets/icons/` | 離線版（PWA）。複製到 repo 根目錄，**改快取名稱與 App 名稱** |
| `references/new-trip-checklist.md` | **建新行程時必讀**：範例裡每一處綁定舊行程的地方（含 grep 錨點），逐項換掉 |
| `references/architecture.md` | 資料格式（`P／NAMES／CARDS／DAYS／STOPS／COST／BOOK／RESTO…`）與引擎函式。改任何資料前先讀 |
| `references/features.md` | 功能清單與設計決策（桌機區塊、手機 App 五分頁、現在模式、雨備、天氣、餐廳頁…），決定要保留哪些 |
| `references/pitfalls.md` | 踩雷筆記。**動手改程式前掃一遍**，大部分 bug 都在這裡出現過 |
| `references/collaboration.md` | 和使用者合作的方式、資料查證、部署與 CLAUDE.md 交接紀錄的寫法 |
| `scripts/check.js` | 總檢查：資料引用完整性、座標落海、桌機手機零錯誤、無橫向溢出。**每次改完都跑** |
| `scripts/make_geo.py` | 產生新地區的海岸線 `LAND`（日本用 dataofjapan、其他國家用 Natural Earth）與粗略鐵道 |
| `scripts/addphotos.py` | 把使用者貼的照片轉 WebP 嵌進 `IMG` |
| `scripts/strip_media.py` | 拿掉內嵌照片，做出輕量版（參考版就是這樣做的） |

## 建立新行程的流程

1. **問清楚再動手**（用 AskUserQuestion，給選項）：日期與天數、出發地與航班、同行人數與年齡層、
   每晚住哪（已訂／待訂）、交通方式（租車／鐵路）、必去與不要的地方、預算幣別、介面語言。
   使用者已有的資料（PDF 手冊、Google 地圖連結、Excel）請他提供。
2. **建 repo 骨架**：`cp assets/reference-guide.html index.html`，複製 `sw.js`、`manifest.webmanifest`、`icons/`。
3. **依 `references/new-trip-checklist.md` 逐項替換**。順序：底圖（`make_geo.py`）→ `P／NAMES／GQ` →
   `CARDS` → `DAYS`＋`STOPS`（＋`RAIN_STOPS`）→ `COST`、`BOOK`、`RESTO`、`SPOT_TREE`、`WX_*`、`MAP_ZONES` →
   靜態 HTML 區塊（hero、交通頁、美食）→ 日期常數、時區、localStorage 前綴、PWA 名稱。
   舊行程的資料整段刪掉，不要留著「之後再改」——留下的舊地名會出現在畫面上。
4. **跑 `node scripts/check.js index.html <截圖資料夾>`**，看截圖確認地圖、時間軸、景點頁。
5. **寫 CLAUDE.md**（專案交接文件，格式見 `references/collaboration.md`），commit、push、開 GitHub Pages。

## 修改既有懶人包

- 改行程**只改 `STOPS`**（桌機時刻表、手機時間軸、每日地圖路線、「現在」模式都從它產生）。
  `COST`、`BOOK`、交通頁的每日卡片、首頁路線字串是手寫的，要一起檢查。
- 加景點：`P`（座標）＋`NAMES`＋`GQ`（Google 地圖搜尋字）＋`CARDS`＋放進 `SPOT_TREE` 葉節點＋排進 `STOPS`（或當 `選項`）。
- 刪景點：上述全部，加上 `IMG[key]`、`DAYS[].cards`、`DAYS[].map.pts`、`RESTO`、`FOOD_TREE`。用 grep 搜 key 確認清乾淨。
- 改座標後一定跑 `check.js`（落海檢查）。小比例尺的圖看不出 300 m 誤差，放大就很明顯。
- 改 `sw.js` 要把版本號 `V` 加一。

## 原則

- 單一 HTML 檔、不用框架與外部函式庫（字型除外）；照片 base64 WebP 內嵌，離線也能看。
- 文案用使用者的語言；當地專有名詞保留原文。時間沒查證的標「約」，資料沒查證的在 CLAUDE.md 註明「未查證」。
- **重大改版先做樣板（mockup，存 scratchpad 截圖給使用者看）並給 2–4 個選項讓使用者挑**；一次改一件事，改完就推上去讓使用者在手機上看。
- 不捏造地理資料：沒有道路／步道圖資就畫直線或示意線，並說明。
- 使用者說刪掉的東西記在 CLAUDE.md「勿再加回」。
