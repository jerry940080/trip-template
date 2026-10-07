# 新行程替換清單

`assets/reference-guide.html` 是熱海・伊豆・靜岡行程的完整版（照片已拿掉）。複製成 `index.html` 後依下列順序替換。
每一項都附 grep 錨點；**改完用 `grep -n "熱海\|靜岡\|河津\|izu-\|2027" index.html` 掃一遍，確認舊行程字樣清乾淨**
（若新行程剛好也去這些地方就保留）。行號會隨編輯變動，請一律用錨點找。

## 0. 底圖（第一個 `<script>`）

| 錨點 | 內容 | 怎麼換 |
|---|---|---|
| `const LAND=` | 海岸線多邊形 `[[ [lon,lat],… ],…]` | `python3 scripts/make_geo.py --bbox 經0,緯0,經1,緯1 --src japan\|world --write index.html`。bbox＝所有地點外擴約 0.2° |
| `const LINES=` | 鐵道真實線形 `[{n,c,s:[[[lon,lat]…]]}]` | 日本：国土数値情報 N02 鉄道データ（CC BY 4.0）自行轉換、裁切、RDP 簡化（容差 0.0002°）。其他國家：`make_geo.py --rails world`（Natural Earth，很粗、沒路線名），或先設 `const LINES=[];`（路線改畫直線，功能都正常） |
| `RAIL_OK` | 交通方式 → 可走哪些路線（依 `LINES[].n` 名稱比對） | 依新的路線名改正規式；沒有 LINES 就不用管 |
| `CAR_ROUTES` | 長途開車的高速公路走廊示意折線 `[[lat,lng]…]` | 換成新行程的長途開車路段，或清空 `[]`（直線） |

頁尾要附資料出處（Natural Earth 是公有領域；国土数値情報要寫 CC BY 4.0 出處）。

## 1. `<head>`

- `<title>`、`meta[name=description]`、`og:*`
- `<head>` 開頭那段小 script 裡的 `localStorage.getItem("izu-rain")` → 新前綴（見第 6 節）
- `meta[name=theme-color]` 若改配色要一起改

## 2. 地點與卡片（第二個 `<script>` 開頭）

| 錨點 | 格式（詳見 architecture.md） |
|---|---|
| `const P={` | `key:[lat,lng]`。路線轉折用的幾何點也放這裡（不用 NAMES） |
| `const NAMES={` | `key:[顯示名,類型]`，類型 `hotel／spot／station／air` |
| `const GQ={` | `key:'Google 地圖搜尋字'`（用當地語言店名＋地名最準） |
| `const CARDS={` | 景點卡。整段換掉 |
| `const IMG={` | 參考版是空的。照片用 `scripts/addphotos.py` 加 |
| `const KIND=`、`const MODE=` | 標記樣式、交通方式的線色與名稱（`MODE.rail.label='JR・特急'`、`izukyu` 是伊豆急，換成新行程的交通名稱；key 名可以留著不改） |
| `const GO_MODE=` | 時間軸圖示 → 交通方式。若新增交通方式要在這裡和 `MODE` 都加 |

## 3. 行程

| 錨點 | 說明 |
|---|---|
| `const DAYS=[` | 每天的 `n,date('2/10'),wd('三'),title,sub,stay,map:{pts,labels,minSpan},cards,rain` |
| `const STOPS={` | **行程唯一來源**。每天的站與交通段 |
| `const RAIN_STOPS={` | 雨天版（有需要的天才寫） |
| `const MAP_ZONES=`、`const ZONE_DAYS=` | 手機地圖分頁「點我放大」的區域色塊（某些天點很密時用）。沒有就清成 `{}` |
| `FOCUS_SKIP={nrt:1}` | 景點頁進區時排除的離群點（舊行程是成田機場） |
| 首頁總覽圖 `const cfg={pts:['nrt','prince','shizuoka'…` | hero 地圖的點、手寫 legs、labels |

## 4. 花費、訂票、天氣、餐廳、景點樹、行李

| 錨點 | 說明 |
|---|---|
| `const COST=[` | 分組 `{g,k,rows:[[名稱,說明,金額\|null,幣別'NT'\|'¥',旗標]]}`。`fmtC` 只認 `NT` 與 `¥`，其他幣別要改 `fmtC` 與 `renderCost` 的合計 |
| `const BOOK=[` | 訂票清單 `[id,截止日ISO\|null,顯示時間,標題,說明,'網址\|名稱']` |
| `const WX_LOC=`、`const WX_DAY=` | 天氣地點 `[名稱,緯,經,平均高溫,平均低溫,錨點 P key]`、每天顯示哪幾個地點 |
| `wxIso`、`wxFetch` 裡的 `2027-01-25`、`2027-02-10`、`2027-02-17`、`2027-02-18` | 年份與抓預報的期間（出發前 16 天起） |
| `const PACK=[` | 行李清單 |
| `const RESTO={v:1,date:` | 餐廳名單（`v` 從 1 開始） |
| `RS_REGS=[` | 餐廳頁的地區膠囊 |
| `rsParse` 裡 `o.reg=la>=35.4?'東京':…` | 貼 Google 地圖連結時依座標自動判斷地區的規則 |
| `const R=APP.rreg\|\|'熱海・河津'` | 餐廳頁「依地區」預設地區 |
| `rsSend` 裡 `【熱海伊豆行・餐廳推薦】` | 分享文字標題 |
| `const SPOT_TREE=[` | 景點頁地區樹（兩層），**每張卡片都要放進某個葉節點** |
| `const FOOD_TREE=[` | 美食地圖樹（目前手機改用餐廳頁，仍保留；可清成 `[]`） |
| `const INFO_PANES=` | 手機資訊分頁的分段 |

## 5. 靜態 HTML 與手寫內容

| 錨點 | 說明 |
|---|---|
| `<header class="hero">` | 標題、日期、路線字串、總覽圖容器 |
| `strip.innerHTML=` 裡的 `<a href="#shizuoka">靜岡總覽` | 導覽列特別連結 |
| `id="shizuoka"`（`return \`<section class="block" id="shizuoka">` 那段 JS） | 舊行程專屬的「靜岡總覽」（官方地圖 `AREAMAPS`、2 月活動、票券）。新行程可以改寫成新地區的總覽，或整段刪除（連 `strip` 連結、`appInit` 裡搬 `#shizuoka details.acc` 那行、`AREAMAPS`） |
| `const AREAMAPS=[` | 官方手繪地圖（base64 WebP）。沒有就 `[]` |
| `<section class="block" id="tickets">` | 交通頁：導言、手繪線路圖 SVG（`.rmap`）、圖例、每日交通卡 `.lday`、自駕須知。**全部手寫**，依新行程重寫 |
| `<section class="block" id="food">` | 必吃料理 `.foodgrid`（`data-wiki` 維基條目名） |
| `<footer>` | 資料出處 |
| `mh-ttl`、`mh-en`、`mh-flt` | 手機首頁標題、英文副標、航班 |
| `ma-kick` | 手機行程頁頂端小字 |

## 6. 日期、時區、儲存

- **localStorage 前綴 `izu-`**：同一個 GitHub 帳號的 Pages 都在同一個網域（`帳號.github.io`），**不換前綴兩個行程的行李清單、餐廳、雨備狀態會互相覆蓋**。全檔把 `izu-` 換成新代號（例 `kyu-`）。
- `dayDiff` 的 `Date.UTC(2027,1,10)` → 出發日（月份從 0 起算）。首頁倒數、旅途中跳到今天都靠它。
- `tokyoNow` 的 `timeZone:'Asia/Tokyo'` → 目的地時區（「現在」模式一律用目的地時間）。
- `?now=2027-02-14T09:10` 模擬網址的說明註解。

## 7. PWA（`sw.js`、`manifest.webmanifest`、`icons/`）

- `sw.js` 的 `const V='izu-v2'` → 新名稱（**同網域的快取會互相刪除**：activate 時會清掉所有不等於 `V` 的快取）。
- `manifest.webmanifest`：`name`、`short_name`、`description`、顏色。
- `icons/`：192、512、apple-touch 180 三張，可用 PIL 畫（舊的是富士山）。

## 8. 收尾

- `node scripts/check.js index.html <截圖資料夾>`：零 ✗；⚠ 落海的點逐一確認。
- 刪掉範例留下的 CLAUDE.md 內容（如果有複製），寫新行程自己的 CLAUDE.md。
- GitHub repo → Settings → Pages → 從分支發布。
