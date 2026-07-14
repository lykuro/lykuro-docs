---
id: deprecations
title: モデル提供終了スケジュール
sidebar_position: 5
---

# モデル提供終了スケジュール

上流プロバイダー（Alibaba Cloud Model Studio 等）が提供終了を告知したモデルの一覧です。**終了日以降、該当モデルへのリクエストはエラーになります**。事前に後継モデルへの移行をお願いします。

:::info 移行はモデル名の変更だけです
Lykuro は OpenAI/Anthropic 互換の透過プロキシのため、`base_url` や API キーの変更は不要です。リクエスト body の `model` を後継モデル名に変更するだけで移行できます。
:::

:::caution 終了日前からレート上限が縮小されます
Alibaba は廃止告知の時点から、対象モデルの QPM/TPM（毎分リクエスト数・トークン数）を段階的に縮小します。終了日ギリギリではなく、早めの移行を推奨します。
:::

## 終了済み

| モデル | 終了日 | 後継 |
|---|---|---|
| `qwen-long-latest` | 2026-05-13 | `qwen-plus` ほか最新系列 |
| `qwen-math-plus-latest` | 2026-05-13 | Qwen 3.7 / 3.6 系 |

上記はカタログから削除済みです。

## 2026年10月10日 終了予定（Alibaba 一括終了）

Alibaba 公式の[モデル廃止スケジュール](https://help.aliyun.com/en/model-studio/model-depreciation)に基づきます。後継は Alibaba の公式推奨です。

### メインラインモデル

| モデル | 公式推奨の後継 |
|---|---|
| `qwen-turbo` | Qwen 3.7 / 3.6 系（低価格帯なら `qwen-flash` / `qwen3.6-flash`） |
| `qwen-vl-max` | `qwen3.6-flash` |
| `qwen-vl-plus` | `qwen3.6-flash` |
| `qwq-plus` | Qwen 3.6 系（thinking 対応モデル） |
| `qvq-max` | Qwen 3.6 系 VL（thinking 対応モデル） |
| `qwen-math-turbo` | Qwen 3.7 / 3.6 系 |

### プレビュー版

| モデル | 公式推奨の後継 |
|---|---|
| `qwen3.6-max-preview` | `qwen3.7-max` |
| `qwen3-max-preview` | `qwen3-max` |

### Qwen3 オープンソース系列（ホスト版）

`qwen3-8b` / `qwen3-14b` / `qwen3-30b-a3b`（instruct/thinking-2507 含む）/ `qwen3-32b` / `qwen3-235b-a22b`（instruct/thinking-2507 含む）/ `qwen3-next-80b-a3b-instruct` / `qwen3-next-80b-a3b-thinking`

→ 公式推奨の後継: **`qwen3.7-plus`**

### Qwen3 Coder 系列

`qwen3-coder-plus`（スナップショット 2025-07-22 / 2025-09-23 含む）/ `qwen3-coder-next` / `qwen3-coder-flash`（スナップショット含む）/ `qwen3-coder-30b-a3b-instruct` / `qwen3-coder-480b-a35b-instruct`

→ 公式推奨の後継: **`qwen3.7-plus`**

### Qwen3 VL 系列

`qwen3-vl-flash`（スナップショット含む）/ `qwen3-vl-8b` / `qwen3-vl-30b-a3b` / `qwen3-vl-32b` / `qwen3-vl-235b-a22b`（各 instruct/thinking）

→ 公式推奨の後継: **`qwen3.7-plus`** または `qwen3.6-flash`

## Lykuro 側の対応状況

- 自動モデル選択（`lykuro/auto`）の候補からは、終了告知済みモデルを先行して除外しています（2026-07-14 に `qwen-turbo` を除外済み。ご利用中の推薦が自動で後継に切り替わります）
- 終了日に合わせて、該当モデルはモデル一覧・価格表からも削除します
- DeepSeek 系および Qwen 3.7 / 3.6 / 3.5 の主力モデル、wan 系動画・画像モデルには現時点で終了予定はありません

ご不明点は [サポート](https://app.lykuro.ai/support) までお問い合わせください。
