---
id: auto-model-selection
title: 自動モデル選択（lykuro/auto）
sidebar_position: 6
---

# 自動モデル選択（lykuro/auto）

モデル名の代わりに `lykuro/auto` を指定すると、Lykuro AI Gateway がキーに設定された「スタンス（用途）」に基づいて、そのリクエストに最適な実モデルへ自動的にルーティングします。

- **対象**: 企業版のバーチャルキー限定の機能です（個人版キーでは使用できません）
- **明示指定のみ発動**: `lykuro/auto*` を指定したリクエストにのみ介入します。固定のモデル名（`qwen-plus` 等）を指定したリクエストは従来どおり無改変で上流へ透過されます
- **課金は実選択モデル**: 実際に選択されたモデルの単価で課金され、選択結果はレスポンスと利用ログで確認できます

## スタンス（用途）6 種

キー作成時、テナント管理者は以下のスタンスから 1 つを選びます。

| stance_key | 表示名 | 用途 |
|---|---|---|
| `agent_automation` | エージェント自動化 | ツール呼び出しを多用するエージェント処理の自動化 |
| `code_review` | コード生成・レビュー | コードの生成・レビュー（function calling 必須） |
| `data_extraction` | データ抽出・分類 | 構造化データの抽出・分類（JSON モード必須） |
| `internal_faq` | 社内 FAQ / ヘルプデスク | 社内 FAQ・ヘルプデスク応答 |
| `legal_review` | 契約書・法務レビュー | 契約書・法務文書のレビュー（品質優先固定・最上位モデルのみ） |
| `summarization` | 文書要約・議事録 | 長文ドキュメントの要約・議事録作成 |

## 推薦タイプ

スタンスに加えて、コストと品質のバランスを指定できます。

| 推薦タイプ | 説明 |
|---|---|
| `quality_first` | 品質優先。品質評価が上位のモデルを選択 |
| `balanced` | バランス（**既定**）。品質とコストの両立 |
| `cost_first` | コスト優先。要件を満たすうちコスト効率のよいモデルを選択 |

`legal_review` スタンスのみ **品質優先固定** です（推薦タイプは変更できません）。

## 指定方法

### (a) キー設定に従う — `lykuro/auto`

キー作成時にスタンスと推薦タイプを設定し、リクエストではモデル名に `lykuro/auto` を指定します。

```json
{ "model": "lykuro/auto" }
```

### (b) インラインでスタンスを明示 — `lykuro/auto-{stance_key}`

モデル名にスタンスを埋め込むと、そのリクエストに限りキー設定より優先されます。

```json
{ "model": "lykuro/auto-code_review" }
```

1 つのキーで複数の用途を使い分けたい場合に便利です。

## 利用例（curl）

base_url は `https://api.lykuro.ai/lykuro/v1` を使用します。

```bash
curl https://api.lykuro.ai/lykuro/v1/chat/completions \
  -H "Authorization: Bearer lk_YOUR_VIRTUAL_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "lykuro/auto",
    "messages": [
      {"role": "user", "content": "この議事録を3行に要約してください。..."}
    ]
  }'
```

レスポンスの `model` フィールドには、実際に選択されたモデル名が入ります。

OpenAI SDK からも `base_url` と `model` を差し替えるだけで利用できます。

```python
from openai import OpenAI

client = OpenAI(
    api_key="lk_YOUR_VIRTUAL_KEY",
    base_url="https://api.lykuro.ai/lykuro/v1",
)

response = client.chat.completions.create(
    model="lykuro/auto-summarization",
    messages=[{"role": "user", "content": "以下の文書を要約してください。..."}],
)
print(response.model)  # 実際に選択されたモデル
```

## 選択の仕組み

自動選択は、スタンスごとに実施している事前ベンチマークの結果に基づきます。

- 各候補モデルを基準モデルとペアワイズ比較し、**相対品質スコア R とその信頼区間**を算出
- R とコスト指数を組み合わせ、推薦タイプ（品質優先 / バランス / コスト優先）に応じて候補を順位付け
- ベンチマークが未整備のスタンスでは、静的な優先度による順位付けで安全に動作します（エラーにはなりません）

## 制約と優先順位

自動選択より常に優先されるルールがあります。

- **必要機能の自動考慮**: リクエストが要求する機能（tools / JSON モード / vision / コンテキスト長）を満たさないモデルは候補から自動的に除外されます
- **キーのモデル権限**: キーに設定されたモデル権限（deny）に該当するモデルは選択されません
- **予算超過時のティア制限**: テナント・キーの予算ポリシーによる制限が発動している間は、その範囲内でのみ選択されます

## 互換性に関する注記

- 旧形式の短いスタンス名（`lykuro/auto-faq`、`lykuro/auto-code`、`lykuro/auto-legal`、`lykuro/auto-summary`、`lykuro/auto-extract`、`lykuro/auto-agent`）も互換性のため引き続き使用できます
- 旧 `lykuro/auto-translate`（翻訳）は**廃止**されました。指定するとエラーになります
