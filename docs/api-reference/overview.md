---
id: overview
title: API 概要
sidebar_position: 1
hide_table_of_contents: true
---

# API 概要

Lykuro AI Gateway は **OpenAI / Anthropic 互換 API** を**透過リバースプロキシ**として提供します。
リクエストのパス・クエリ・本文は**改変されず**そのまま上流（DeepSeek / Alibaba）へ転送され、
Lykuro は認証ヘッダーを自社キーから上流キーへ差し替えるだけです（フォーマット変換は行いません）。

## base_url のしくみ

```
https://api.lykuro.ai/{プロバイダ}/{上流パス...}
```

- 先頭の `/{プロバイダ}` で上流を選択（`deepseek` / `alibaba`）
- 残りのパス・クエリ・本文はそのまま上流に届く
- お使いのツールの base_url を、この形に差し替えるだけで動作

## エンドポイント一覧

| 用途 | プロトコル | base_url |
|---|---|---|
| テキスト生成（OpenAI互換・DeepSeek） | HTTPS | `https://api.lykuro.ai/deepseek/v1` |
| テキスト生成（OpenAI互換・Alibaba） | HTTPS | `https://api.lykuro.ai/alibaba/compatible-mode/v1` |
| テキスト生成（Anthropic互換・DeepSeek） | HTTPS | `https://api.lykuro.ai/deepseek/anthropic` |
| テキスト生成（Anthropic互換・Alibaba） | HTTPS | `https://api.lykuro.ai/alibaba/apps/anthropic` |
| リアルタイム音声（Alibaba） | WSS | `wss://api.lykuro.ai/alibaba/api-ws/v1/realtime` |
| モデル一覧（公開） | HTTPS | `https://api.lykuro.ai/v1/models` |

## 開発ツール別の base_url

代表的なツールはそのまま base_url を差し替えるだけで動作します。

| ツール | base_url |
|---|---|
| Cursor / OpenAI SDK | `https://api.lykuro.ai/alibaba/compatible-mode/v1` または `https://api.lykuro.ai/deepseek/v1` |
| Codex | `https://api.lykuro.ai/alibaba/compatible-mode/v1` |
| Claude Code / OpenClaw / Hermes Agent | `https://api.lykuro.ai/alibaba/apps/anthropic` または `https://api.lykuro.ai/deepseek/anthropic` |

## 認証

API キーを次のいずれかのヘッダーで指定します。

```
Authorization: Bearer sk-jp-YOUR_KEY     # OpenAI 系クライアント
x-api-key: sk-jp-YOUR_KEY                # Anthropic 系クライアント（Claude Code 等）
```

API キーは [ダッシュボード](https://app.lykuro.ai) の「APIキー」メニューから発行できます。

## モデルの指定

完全なモデルIDは **`プロバイダ/モデル名`** 形式です（例: `alibaba/qwen-turbo`、`deepseek/deepseek-v4-flash`）。

- **`プロバイダ`** … base_url のパス（`/alibaba/...`、`/deepseek/...`）に使います
- **`モデル名`**（スラッシュ以降） … リクエスト本文の `model` に**そのまま**指定します

```jsonc
// base_url = https://api.lykuro.ai/alibaba/compatible-mode/v1
{ "model": "qwen-turbo" }

// base_url = https://api.lykuro.ai/deepseek/v1
{ "model": "deepseek-chat" }
```

DeepSeek は `https://api.lykuro.ai/deepseek`（ルート直下・本家と同じ base_url）でも `https://api.lykuro.ai/deepseek/v1` でも利用できます（`/deepseek/...` 配下を透過）。

利用可能なモデルの一覧は [モデル一覧](/docs/reference/models) を参照してください。

## Zero-Retention

プロンプト本文・レスポンス本文はどのシステムにも保存されません。
課金・監査に必要なメタデータ（トークン数・モデル名・タイムスタンプ等）のみ記録します。
