---
title: "stocklens-mcp"
catalogNumber: "HU-11"
matrixNumber: "HUR-011-A"
category: "12-inch"
year: 2026
format: "1960s IBM mainframe technical doc"
shortDescription: "StockLens の API を Claude から呼べる MCP"
jacket: ../../assets/jackets/11-stocklens-mcp.png
githubUrl: "https://github.com/URA-H/stocklens-mcp"
techStack:
  - "TypeScript"
  - "MCP SDK"
  - "Node 20+"
order: 7
href: "/works/stocklens-mcp"
---

StockLens の FastAPI バックエンドを Claude から呼び出せるようにする MCP サーバー。CAN SLIM ランキング・O'Neil 6 ルール売却シグナル・AI 定性レビューを MCP ツールとして提供。

## 公開している tools

```ts
stocklens_health              // FastAPI バックエンドの生死確認（プリフライト）
stocklens_recommend           // CAN SLIM スコアによる銘柄ランキング
stocklens_get_stock           // 個別銘柄のスナップショット（価格・指標）
stocklens_check_sell_signals  // 保有銘柄に対する O'Neil 6 ルール検査
stocklens_ai_review           // Claude API + Web 検索による定性レビュー（6h cache）
```

## Claude との対話例

```
You: 日経 225 で CAN SLIM 上位 3 銘柄を教えて

Claude (stocklens-mcp 経由):
[tool] stocklens_recommend { market: "N225", top: 3 }
→
[
  { ticker: "7203", name: "Toyota Motor",  score: 92, ... },
  { ticker: "6758", name: "Sony Group",     score: 88, ... },
  { ticker: "8035", name: "Tokyo Electron", score: 85, ... }
]

[tool] stocklens_ai_review { ticker: "7203" }
→ EV シフトを背景に北米市場での販売は堅調、ただし為替リスクに留意…

現時点で CAN SLIM スコア上位はトヨタ・ソニー・東京エレクトロンです。Toyota は…
```

## 認証

`stocklens_health` 以外は **`X-API-Key`** が必要。環境変数 `STOCKLENS_API_KEY` で渡す。

## 設計の核

- **stocklens API のシン薄ラッパー**: ツールごとに zod schema で入出力を型保証
- **キャッシュは API 側**: MCP は薄く保ち、重い計算は FastAPI 側で 6h キャッシュ
- **投資判断は保証しない**: `stocklens_*` ツールの出力は分析データであり、推奨ではない
