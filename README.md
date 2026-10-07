# trip-template

旅遊懶人包範本。每次規劃新旅行：

1. 按 **Use this template → Create a new repository**（設 Public，免費帳號的 Pages 需要公開 repo）。
2. 到 https://claude.ai/connect-github 確認 Claude GitHub App 可以存取新 repo。
3. 在 https://claude.ai/code 選新 repo 開對話，輸入：
   `/trip-guide 我要規劃 2027/4/1–4/5 京都 5 天，4 個大人，搭鐵路。請直接 commit 並推到 main 分支。`
4. 第一次推上去後：Settings → Pages → Deploy from a branch → `main` / `(root)` → Save。

skill 本體在 `.claude/skills/trip-guide/`，來源是 jerry940080/IzuAtami-trip 的熱海・伊豆・靜岡行程。
