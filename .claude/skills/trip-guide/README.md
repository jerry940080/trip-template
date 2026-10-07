# trip-guide skill

把「熱海・伊豆・靜岡 旅遊懶人包」的做法打包成 Claude Code skill：單一 HTML 檔、GitHub Pages 發布、
每日路線地圖、手機 App 版、雨備、花費、訂票清單、天氣、餐廳口袋名單。

## 在新的 GitHub 專案使用
1. 把整個 `trip-guide/` 資料夾複製到新 repo 的 `.claude/skills/trip-guide/`，commit、push。
2. 在那個 repo 開 Claude Code（網頁版或 CLI），說「用 trip-guide 幫我規劃 2027/4 京都 5 天的行程懶人包」，
   或輸入 `/trip-guide`。Claude 會先問日期、住宿、交通、必去景點，再從範例複製出新的 `index.html`。
3. Settings → Pages 從分支發布，就有網址可以分享。

## 個人電腦（CLI）全域安裝
複製到 `~/.claude/skills/trip-guide/`，之後所有專案都能用。

## 內容
- `SKILL.md`：流程與原則（Claude 讀的入口）
- `references/`：替換清單、資料格式、功能清單、踩雷筆記、合作方式
- `assets/reference-guide.html`：完整範例（照片已拿掉）；`sw.js`、`manifest.webmanifest`、`icons/`：離線版
- `scripts/`：`check.js` 總檢查、`make_geo.py` 海岸線、`addphotos.py` 嵌照片、`strip_media.py` 做輕量版

## 更新這個 skill
原專案（jerry940080/IzuAtami-trip）有新功能時，在原專案跑
`python3 .claude/skills/trip-guide/scripts/strip_media.py index.html .claude/skills/trip-guide/assets/reference-guide.html`
更新範例，必要時補 `references/`，再重新複製到其他專案。
