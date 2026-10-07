# CLAUDE.md — 旅遊懶人包（從 trip-template 建立）

> 使用者以繁體中文溝通，回覆請一律使用繁體中文。

## 這個 repo 是什麼
從 `trip-template` 範本開出來的旅遊懶人包專案：單一 `index.html`，用 GitHub Pages 發布給同行者。
做法、資料格式、踩雷筆記都在 `.claude/skills/trip-guide/`（輸入 `/trip-guide` 或說「用 trip-guide 規劃…」即可載入）。

## 第一次對話（repo 裡還沒有 index.html）
1. 載入 trip-guide skill，依 `SKILL.md` 的「建立新行程的流程」進行：先用選項問清楚日期、人數、住宿、交通、必去與不要的地方。
2. 從 `.claude/skills/trip-guide/assets/` 複製範例與 PWA 檔到 repo 根目錄，依 `references/new-trip-checklist.md` 逐項換成新行程。
3. 換掉 localStorage 前綴與 `sw.js` 快取名（同一 GitHub 帳號的 Pages 同網域，不換會和其他行程互相覆蓋）。
4. 在網站根目錄放 `trip.json`（格式見 `references/new-trip-checklist.md` 第 9 節），首頁 https://jerry940080.github.io/ 會自動列出這趟。
5. `node .claude/skills/trip-guide/scripts/check.js index.html <scratchpad>/shots` 零錯誤後 commit、push。
6. **把這份 CLAUDE.md 改寫成這次行程的交接文件**（專案是什麼、行程表、重要決策、變更紀錄、待辦），刪掉本節。

## 分支與發布
- 使用者若說「直接推到 main」，就 commit 到 main；GitHub Pages 設 Settings → Pages → Deploy from a branch → main / root。
- 網址：`https://<帳號>.github.io/<repo 名稱>/`。
