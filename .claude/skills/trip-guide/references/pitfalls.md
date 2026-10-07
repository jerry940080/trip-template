# 踩雷筆記

範例專案實際踩過、花時間才查出來的問題。改程式前先掃一遍。

## 編輯大檔
- **用字串切割改資料時，錨點要限定在目標區段內**。`MODE` 裡也有 ` shinkansen:{`，直接找 `'\n shinkansen:{'` 命中 MODE，把後面整段吃掉。
- **切函式用函式自己的結尾字串當錨點**，不要用 `"\n}"`：結尾 `}` 不在行首時會切到下一個函式，把別的函式一起刪掉。
- **插卡片以前一張卡的 `chips:[…]},` 結尾當錨點**：找 `"\n "` 會命中卡片內第二行的 `"\n  text:"`，新卡被塞進舊卡物件裡（語法合法、但 `CARDS.新卡` 是 undefined）。
- 每次取代都 `assert s.count(anchor)==1`。
- `STOPS[].d` 是純文字，不要放 `<b>`（會原樣顯示）。
- 刪卡片要一起刪 `IMG[key]`（否則孤兒照片佔 MB 級空間）、`P／NAMES／GQ`、`DAYS[].cards／map.pts`、`SPOT_TREE`、`FOOD_TREE`、`RESTO`。

## JavaScript
- **TDZ**：在宣告前就會被呼叫的全域（例：桌機日圖在 `THB` 宣告前就排標籤）要用 `var`；`const` 報錯會被 try/catch 吞掉，功能默默失效。
  延遲建立設定物件（`MPN()`）也是同理。
- `arr.map(fn)` 會把 index 傳成第二參數：`d.cards.map(cardHTML)` 讓編號從 0 開始。寫 `(k,i)=>cardHTML(k,i+1)`。
- `proj()` 回傳的 `pt` 讀的是**呼叫當下**的全域 `W/H`：借用時算完所有點才還原。
- 縮放動畫換圖時舊動畫還在跑 → `makeZoom` 用 `Z.gen` 世代號，`init` 時 +1，`anim` 每格檢查。
- 倍率與中心各自線性內插，放大 40 倍以上目標會飛出畫面 → 對數倍率＋不動點縮放。
- 路線畫線動畫 `stroke-dasharray` 配 `non-scaling-stroke` 會在放大後只剩一小段 → 第一次縮放就把動畫收尾。

## CSS
- **手機覆寫規則一定放在 `</style>` 前**：放中段會被後面同特異度的基礎規則蓋掉。
- `display:flex` 會蓋過 `[hidden]` → 加 `.x[hidden]{display:none}`（範例的透明遮罩擋住整個 App 就是這樣）。
- `#mapp button{color:inherit}`（ID 權重）會蓋過 `.chips button.on` → App 內按鈕顏色規則要加 `#mapp` 前綴。
- 全域選擇器會漏到別處（交通頁 `.lg` 樣式漏到地圖圖例）→ 一律加區塊前綴。
- `.mapcard svg{width:100%}` 會撐大圖例小樣本 → 樣本 SVG 另外固定尺寸。
- 不要對有 viewBox 的 SVG 設 `max-height`（會等比縮小左右留白）。
- `position:sticky` 只在父容器範圍內有效 → 手機用 `.day-body{display:contents}` 讓地圖和卡片同層。
- summary 內主副標用 grid 不要用 flex（副標會把主標擠成直排）。

## SVG 地圖
- `<g>` 本身沒有填色面積，手指點在圓標旁邊會漏接 → 放一圈透明命中圈 `pointer-events="all"`；定位字卡時要排除它。
- 命中圈互相重疊時，選離手指最近的標記。
- 縮圖時原圓標用 `opacity:0` 不能 `display:none`（字卡定位與點擊判斷靠它的 bbox）。
- 標籤 `layoutLabels` 只看 `:scope>text`，否則抓到縮圖裡的號碼字。
- iPhone Safari 對大張 SVG 套 CSS `filter` 會模糊、缺塊 → 換色用屬性選擇器（`rect[fill="#d7e3ea"]`）。
- 出發地（前一晚住宿）不要標進當天 bbox，否則比例尺撐到 50 km，點全擠在一起。
- 小比例尺看不出座標誤差（300 m ≈ 5 px），放大就落海 → 改座標都跑落海檢查（`scripts/check.js`）。

## iOS／Safari
- 桌面圖示（standalone）的狀態列顏色只在啟動時讀一次 → `black-translucent`＋自己畫色條；改了 meta 要刪掉圖示重加。
- Safari 動態改 `theme-color` 不會重讀 → 每次把 meta 拆掉重放，並在 rAF 與 350／800 ms 後各補一次。
- iOS 26 standalone 底部會保留收起工具列的空間 → `html.sa` 用 `height:100lvh`、底部 `max(env(safe-area-inset-bottom),22px)`。
- 彈窗與燈箱頂部扣 `env(safe-area-inset-top)`，按鈕才不會被時間、瀏海蓋住。

## 部署
- GitHub Pages 回 `Cache-Control: max-age=600`：SW 裡的 fetch 要 `cache:'no-cache'`，否則推上去 10 分鐘內還是舊版。
- **同一個 GitHub 帳號的所有 Pages 同網域**：localStorage 前綴與 SW 快取名稱每個行程要不同。
- Pages 發布偶爾卡在排隊（Cancel 按不了）→ 再推一個新 commit 取代。分支發布每小時約 10 次軟上限，小修改集中再推。
- 查發布狀態：`gh api "repos/<owner>/<repo>/actions/runs?per_page=1"`。

## 測試
- Playwright 截圖要等路線動畫跑完（約 4 秒），900 ms 時只看得到前兩個標記不是 bug。
- 無頭 Chromium 沒有彩色 emoji，截圖裡的天氣圖示是黑白的。
- 開發環境常連不到維基百科、Open-Meteo、地理編碼服務 → 用 Playwright `route` 假資料測，並告訴使用者哪些沒實測。
- 測試腳本寫在 scratchpad，截圖資料夾一定要帶參數；不要把截圖、`undefined/` 資料夾提交進 repo。
