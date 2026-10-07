# 架構與資料格式

單一 `index.html`（照片全嵌時約 5–12 MB）。結構由上到下：

1. `<head>`：meta、Google 字型（Caprasimo＋Figtree＋Noto Sans TC）、一小段 script（≤640px 給 `<html>` 加 `app`、
   standalone 加 `sa`、上次是雨備就先加 `rainy-ui`）。
2. `<style>`：全站樣式。**手機覆寫規則一律放在 `</style>` 前的最末段**（同特異度後者勝）。
3. 靜態 HTML：`header.hero`、`nav.strip#strip`、`#days`（JS 填）、`#tickets`、`#resto`、`#food`、`#cost`、`footer`、
   燈箱 `#lb`、景點彈窗 `#modal`。手機 App 的 `#mapp` 由 JS 建。
4. 第一個 `<script>`：`const LAND=`（海岸線）、`const LINES=`（鐵道）。各一行，很長，**不要用編輯器整段讀**。
5. 第二個 `<script>`：主程式。資料常數在前，引擎在後。

> 讀檔技巧：檔案很大，`IMG`、`AREAMAPS`、`LAND` 都是超長單行。用 `grep -n "^const "` 找區段，
> `sed -n 'a,bp' | cut -c1-300` 看內容；用 Python 以「唯一錨點字串」做取代並 `assert s.count(a)==1`。

## 資料常數（依出現順序）

### `P`、`NAMES`、`GQ`
```js
const P={ shinagawa:[35.6285,139.7387], ... };          // [lat,lng]；路線幾何點也放這（不必有 NAMES）
const NAMES={ shinagawa:['品川站','station'], ... };     // 類型 hotel/spot/station/air → KIND 決定標記樣式
const GQ={ shinagawa:'品川駅', ... };                    // Google 地圖搜尋字（gUrl(k) 組網址）
```

### `MODE`、`KIND`
`MODE`＝交通方式 → `{c 線色, w 線寬, d 虛線, label, trk:1 畫成鐵軌, ic 線中間圖示}`。
現有：`rail shinkansen izukyu car taxi bus ropeway subway walk`。`GO_MODE` 把時間軸圖示（🚆🚄🚃🚗🚕🚌🚡🚇🚶）對到這些 key。

### `CARDS`（景點／店家卡）
```js
key:{ url:'官網', name:'顯示名', jp:'原文名', kind:'景點|美食|住宿|體驗|購物|溫泉',
      short:'一行簡介', wiki:['維基條目（沒內嵌照片時抓圖）'], text:'介紹（可含 <b>）',
      chips:['小標籤',...], info:[['地址','…'],['電話','…'],['開放','…'],['公休','…'],['門票','…']],
      video:[{u:'https://www.youtube.com/watch?v=ID&t=秒', l:'標籤'}] }
```
`IMG={key:'data:image/webp;base64,…' 或 [多張]}`：第一張是封面（16:10 裁切，橫式排前面）。

### `DAYS`（每天的外框）
```js
{n:1, date:'2/10', wd:'三', title:'桃園 → 成田 → 品川', sub:'副標', stay:'住宿名',
 map:{pts:['nrt','prince'], labels:{nrt:'r'}, minSpan:.3},   // labels：t/b/l/r 標籤方位；minSpan 最小經緯跨度
 cards:['prince'], rain:'雨備說明 HTML（桌機時刻表下方）'}
```
`DAYS[].map.legs` 已不用於每日地圖（路線由 STOPS 自動產生），只剩首頁總覽圖與靜岡總覽是手寫 legs。
初始化時會掛上 `d.stops=STOPS[d.n]`、`d.rainStops=RAIN_STOPS[d.n]`、`d.tl=stopsToTl(d.stops)`。

### `STOPS`（行程唯一來源）
```js
const STOPS={ 1:[
 {t:'13:30', i:'✈', n:'站名', k:'交通', d:'一行備註（純文字，不要放 HTML）', dur:'4 小時',
  card:'prince',          // 有卡片 → 時間軸縮圖、點了開卡片、地圖位置用卡片座標
  at:'nrt',               // 地圖位置（P 的 key），沒填就用 card 的座標；出發地不要標（會撐大 bbox）
  go:[{at:'19:53', i:'🚆', t:'成田 T2 → 品川　JR 成田特快 19:53–21:00・¥3,330', to:'yume'}],  // 到下一站的交通，可多段
  ol:[['livemax','kinomiya','taxi']] }   // 選項路線（地圖畫淡色）
]};
```
- `k`（類型）：`交通 景點 體驗 美食 購物 住宿 溫泉 選項 提醒`（`KSTY` 定色）。`選項`／`提醒` 不算主路線的站。
- `go[].to`：一站後面接兩段交通才到下一個有位置的站時，第一段的中途點（例：纜車上山再回來）。
- 桌機時刻表、手機時間軸、每日地圖、「現在」模式、景點頁的「已排入」標籤都從 STOPS 算。
- `RAIN_STOPS` 格式相同，只寫有雨天版的天；`actStops(d)` 依雨備開關決定用哪份。

### 自動路線（`autoLegs` → `legGeo` → `autoLegSvg`）
從當天早上的住宿（`lodgingAt(n)`）出發，依每段 `go` 的圖示決定交通方式，畫到下一個有位置的正式站。
- 鐵道類（rail/izukyu/shinkansen/subway）：`railGraph()` 由 `LINES` 建路網，`railRoute` Dijkstra 找路（`RAIL_OK` 限制可走的路線名）。
  斷頭 800 m 內接軌、2.5 km 內補直線（代價 ×4）；繞路超過直線 3 倍＋2 km 就放棄畫直線。
- 長途開車（>15 km）沿 `CAR_ROUTES` 走廊折線；其他（計程車、步行、巴士、市區開車）畫直線。
- 和前面路線重疊超過一半就平移並排；夠長的線段中間放交通圖示。

### `COST`、`BOOK`
```js
const COST=[{g:'住宿', k:'stay', rows:[['名稱','說明',金額|null(未知)|0(免費),'NT'|'¥','~'|'car'|'unit'|'']]}];
// 旗標：~＝約、car＝每台計（依同行人數分攤）、unit＝每櫃計（不加總）
const BOOK=[['id','2027-01-14'|null,'顯示時間','標題','說明','網址|連結名']];
```
`renderCost()` 產生花費頁 `#costBody` 與交通頁 `#moneyBox`；`renderBook()` 依截止日排序、打勾存 localStorage。

### 天氣 `WX_LOC`、`WX_DAY`
`WX_LOC={key:[名稱,緯,經,2月平均高溫,平均低溫,地圖錨點 P key]}`、`WX_DAY={天:[key…]}`。
出發前 16 天起向 Open-Meteo（免金鑰）抓預報，3 小時快取在 localStorage；之前顯示平年值（標「平年」「約」）。

### 餐廳 `RESTO`
```js
const RESTO={v:1, date:'2026/10/07', list:[
 ['id', 天(0=未定), '早餐|午餐|點心|晚餐', '地區', '店名', '料理', '備註', 'in'(已排入)|'c'(候選), '卡片 key', 'Google 查詢字', [lat,lng]]
]};
```
家人在網頁上用「＋ 新增餐廳」貼 Google 地圖連結 → 存在自己裝置 → 「送出」用 LINE 分享文字給主辦人 →
主辦人把文字貼給 Claude → 決定收哪些 → 加進 `list`、`v` 加一、`date` 改當天。

### 地區樹 `SPOT_TREE`（手機資訊 › 景點）
```js
{name:'靜岡', sub:'副標', col:'#56633f', lab:'t|b|l|r|c', kids:[ {name, sub, col, lab, keys:['cardKey',…]} ]}
```
第一層色塊總覽 → 點色塊放大 → 葉節點詳細圖＋已排入／候選名單。卡片沒放進樹就不會出現在景點頁。

### 其他
`MAP_ZONES`／`ZONE_DAYS`（地圖分頁可點的區域色塊）、`PACK`（行李清單）、`INFO_PANES`（資訊分段）、
`AREAMAPS`（官方手繪地圖，base64 WebP）、`KSTY`（時間軸類型配色）、`ICO`（Lucide 風格 SVG 圖示）。

## 引擎

- **地圖**：`buildMap(cfg,{W,H,big,pad,padT,aria})` → SVG 字串。`proj(bbox)` 等距圓柱投影（`pt` 是讀全域 `W/H` 的 closure，
  借用時要算完所有點才還原 W/H）。`marker()` 畫標記（有 `CARDS` 的加透明命中圈 `.hit`）、`layoutLabels(svg)` 排標籤避讓
  （開頭呼叫 `applyThumbs` 把有照片的標記換成圓形縮圖）、`animateMap` 路線動畫、`scaleBar`、`railBg` 背景鐵道。
- **縮放**：`makeZoom(BW,BH)` → `Z`（`init/apply/anim/bind/mid/relayout`，`zmax`）。改 `viewBox` 做向量縮放；
  `.mk` 與 `.zs` 群組給 `scale(1/z)` 維持螢幕大小；`vector-effect:non-scaling-stroke`。`Z.anim` 是對數倍率＋不動點縮放。
  實例：`MZ`（地圖分頁）、`SZ`（景點頁）、`FZ`（美食頁）、餐廳地圖每張一個。
- **桌機**：`dayBlocks`（每日區塊：時刻表＋地圖＋卡片）、`cardHTML(id,num)`、`openCard(id,fromMap)` 彈窗（照片輪播、影片）、
  地圖標記兩段式字卡（`pinTip`→再點開完整卡片）。
- **手機 App**：`appInit()` 建 `#mapp`（五分頁 home/plan/map/pack/info）、`go(tab)`、`setDay(i)`、`renderHome/renderPlan/renderMap/renderPack/renderSeg`、
  底部抽屜 `openSheet`、全域點擊 `appClick(e)`（回 true 表示已處理）。資訊分頁把桌機的 `#cost`、`#tickets` DOM 節點直接搬進來（內容只有一份）。
- **現在模式**：`tokyoNow()`（目的地時區）、`nowInfo()` 找現在與下一個；網址 `?now=2027-02-14T09:10` 模擬。
- **雨備**：`APP.rain` 全域開關、`applyTheme(anim)` 換 `html.rainy-ui` 色票、`actStops(d)`。
- **狀態**：localStorage（`前綴-app/pack/rain/resto/me/book/ppl/wx`），讀寫都包 try/catch（`lsGet/lsSet`）。
