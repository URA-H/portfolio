---
title: "routeshot"
catalogNumber: "HU-09"
matrixNumber: "HUR-009-A"
category: "12-inch"
year: 2026
format: "Vintage optical instrument manual, camera mechanism"
shortDescription: "個人開発のスクショ撮影を 1 コマンドで終わらせる CLI"
jacket: ../../assets/jackets/09-routeshot.png
githubUrl: "https://github.com/URA-H/routeshot"
techStack:
  - "TypeScript"
  - "Playwright"
  - "Node 20+"
  - "Vitest"
order: 5
href: "/works/routeshot"
---

dev server を起動して、設定ファイルに書いた `routes × viewports` を全部回って PNG にする CLI。ポートフォリオ用スクショ撮影のために作った内製ツール。

## 設定（routeshot.config.json）

```json
{
  "baseUrl": "http://localhost:4321",
  "routes": ["/", "/about", "/works/stocklens", "/works/atlas"],
  "viewports": [
    { "name": "desktop", "width": 1440, "height": 900 },
    { "name": "mobile",  "width":  390, "height": 844 }
  ],
  "output": "docs/screenshots"
}
```

## 実行例

```bash
$ npx routeshot
routeshot: 4 routes × 2 viewports = 8 screenshots
waiting for http://localhost:4321/ to respond…
server ready, launching browser
  ✓ / @ desktop (510KB, 1366ms)
  ✓ / @ mobile (412KB, 982ms)
  ✓ /about @ desktop (388KB, 1124ms)
  ✓ /about @ mobile (302KB, 891ms)
  ...
done — 8 screenshots in 11.4s
```

## これで撮ったもの

- StockLens: 16 枚
- 星読みAI: 10 枚
- atlas: 3 枚
- sharekanji / trending-lens: 各 2 枚

このポートフォリオに載ってるスクショも全部 routeshot 製。
