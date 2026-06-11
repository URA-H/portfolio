---
title: "threefortune-mcp"
catalogNumber: "HU-10"
matrixNumber: "HUR-010-A"
category: "12-inch"
year: 2026
format: "Eastern divination scroll, Ziwei star chart"
shortDescription: "東洋占術 3 種を Claude から呼び出せる MCP"
jacket: ../../assets/jackets/10-threefortune-mcp.png
githubUrl: "https://github.com/URA-H/threefortune-mcp"
techStack:
  - "TypeScript"
  - "MCP SDK"
  - "Node 20+"
  - "Vitest"
order: 6
href: "/works/threefortune-mcp"
---

四柱推命・九星気学・紫微斗数の 3 術 + 三術クロス分析を Claude から呼び出せるようにする MCP サーバー。命式やスコアを構造化データで返す。

## 公開している tools

```ts
hoshiyomi_full_reading    // 3術 + クロス分析を含む CombinedFortuneData を JSON で返す
hoshiyomi_summary         // 同データの要点だけを Markdown でまとめて返す
hoshiyomi_list_prefectures // 真太陽時補正に対応している都道府県一覧
```

## Claude との対話例

```
You: 1990 年 5 月 10 日 14:30 東京生まれの女性の四柱推命の要点を教えて

Claude (threefortune-mcp 経由):
[tool] hoshiyomi_summary {
  birth: "1990-05-10T14:30",
  prefecture: "東京",
  gender: "female"
}
→
## 四柱推命
- 年柱: 庚午 / 月柱: 辛巳 / 日柱: 甲午 / 時柱: 辛未
- 日主: 甲（陽木）— 五行バランスは火が強め

## 九星気学
- 本命星: 七赤金星 / 月命星: 五黄土星

## 紫微斗数
- 命宮: 巳 / 主星: 紫微星
...

あなたは「甲午日柱」生まれで、火の気が強い命式です。…
```

## 設計の核

- **3 術を同一インプットで叩ける**: 生年月日 + 性別 + 出生地 だけで 3 種類の命式が揃う
- **真太陽時補正**: 都道府県別の経度から地方時を補正
- **出力は診断ではない**: `hoshiyomi_*` は古典命理の構造を返すだけ。Claude が読み解く責務を持つ
