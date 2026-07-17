---
title: サンプル集（Cookbook）
sidebar_position: 0
description: Lykuro AI を使った実践的なコードサンプル集（Python / TypeScript / Go / cURL）
---

# サンプル集（Cookbook）

よくあるユースケースを **Python / TypeScript / Go / cURL** の4言語で掲載しています。
すべて Lykuro AI の**透過プロキシ**経由で、`base_url` を差し替えるだけで動作します。

:::tip 前提
- APIキー（`lk_live_...`）は [ダッシュボード](https://app.lykuro.ai) で発行してください。
- サンプルではキーを環境変数 `LYKURO_API_KEY` から読み込みます。
- `base_url` は用途で選びます（[API概要](../api-reference/overview) 参照）:
  - OpenAI互換（DeepSeek）: `https://api.lykuro.ai/deepseek/v1`
  - OpenAI互換（Qwen）: `https://api.lykuro.ai/alibaba/compatible-mode/v1`
  - Anthropic互換（DeepSeek）: `https://api.lykuro.ai/deepseek/anthropic`
:::

## 目次

| ページ | 内容 | 言語 |
|---|---|---|
| [ストリーミング](./streaming) | SSE で逐次トークンを受信 | Python / TS / Go / cURL |
| [Function Calling](./function-calling) | ツール呼び出し（関数実行） | Python / TS / Go / cURL |
| [構造化出力（JSON）](./structured-output) | `response_format` で JSON を強制 | Python / TS / cURL |
| [画像入力（ビジョン）](./vision) | 画像を理解させる（Qwen-VL） | Python / TS / cURL |
| [埋め込み（Embeddings）](./embeddings) | ベクトル化と類似度検索 | Python / TS / cURL |
| [推論モデル](./reasoning) | 思考過程付きモデルの使い方 | Python / cURL |
| [エラー処理・リトライ](./error-handling) | 堅牢な本番実装パターン | Python / TS / Go |
| [漫画風マニュアル生成](./manga-manual) | 文字マニュアル→漫画化（テキスト生成＋画像生成＋ビジョン） | Python / cURL |

## 動かせるサンプルコード

そのまま実行できる最小プロジェクトを [`samples/`](https://github.com/lykuro/lykuro-docs/tree/main/samples) に置いています。

```bash
git clone https://github.com/lykuro/lykuro-docs.git
cd lykuro-docs/samples/python
cp .env.example .env   # LYKURO_API_KEY を記入
pip install -r requirements.txt
python chat.py
```
