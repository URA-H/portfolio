---
title: "bureau-mcp"
catalogNumber: "HU-03"
matrixNumber: "HUR-003-A"
category: "LP"
year: 2026
format: "Vintage manila folder, org chart"
shortDescription: "フォルダベース仮想組織を Claude から読める MCP"
jacket: ../../assets/jackets/03-bureau-mcp.png
githubUrl: "https://github.com/URA-H/bureau-mcp"
techStack:
  - "TypeScript"
  - "MCP SDK"
  - "Node 20+"
order: 3
href: "/works/bureau-mcp"
---

ローカルの `.company/` フォルダをそのまま「仮想組織」として Claude に読ませる read-only/append-only な MCP サーバー。部署 = フォルダ、ノート = ファイルとして扱う。

## 公開している tools

```ts
// read-only
bureau_list_departments  // 部署一覧（フォルダ名 / 役割 / サブフォルダ）
bureau_list_todos        // 指定日付の TODO 一覧（部署横断、status フィルタ可）
bureau_read_note         // 相対パス指定でノート本文を返す（traversal ブロック付き）
bureau_search_notes      // 大文字小文字を無視した grep（スニペット + 行番号）
bureau_get_today         // 今日の digest（open/done TODO 数、inbox/decisions の有無）

// append-only write
bureau_add_todo          // 指定部署の todos/YYYY-MM-DD.md に 1 行追記
bureau_complete_todo     // テキストマッチした最初の open 行を [ ] → [x]
bureau_append_to_today   // 今日の inbox / decisions / learnings にタイムスタンプ追記
```

## Claude との対話例

```
You: 今日の状況をざっと教えて

Claude (bureau-mcp 経由):
[tool] bureau_get_today
→ secretary: 3 TODO open / 2 done · inbox に 1 件未整理
  creative: TODO なし
  coach: ジャーナル本日分あり

[tool] bureau_list_todos { status: "open" }
→ secretary/todos/2026-06-11.md:
  - [ ] ポートフォリオ詳細ページの仕上げ | 優先度: 高
  - [ ] Cloudflare デプロイの確認

未完了の TODO は 2 件です。秘書室の方は…
```

## 設計の核

- **append-only**: ファイルの上書き / 削除は `bureau_complete_todo` の checkbox flip を除いて一切しない
- **path traversal ブロック**: `bureau_read_note` は `.company/` 配下から外に出られない
- **stdio + jsonschema**: MCP の標準仕様に準拠、Claude Code / Claude Desktop どちらでも動く
