---
id: quickstart
title: クイックスタート
sidebar_position: 1
description: Lykuro AI を5分以内に動かすガイド
---

# クイックスタート

Lykuro AI は OpenAI / Anthropic **互換**の API を**透過プロキシ**で提供します。
お使いのツールやSDKの **`base_url` を差し替えるだけ**で、リクエスト本文・パラメータはそのまま上流モデルに届きます。

## 1. APIキーを取得する

1. [ダッシュボード](https://app.lykuro.ai) にサインアップ
2. 電話番号認証を完了すると無料クレジットが付与されます
3. **APIキー** ページから `lk_live_...` 形式のキーを発行

## 2. base_url の決め方

base_url は **`https://api.lykuro.ai/{プロバイダ}/{上流パス}`** の形です。
先頭の `/{プロバイダ}` で上流（DeepSeek / Alibaba / Kimi / OpenAI / Anthropic / Google）を選び、残りはそのまま上流に届きます。

| 使い方 | base_url |
|---|---|
| OpenAI SDK（DeepSeek） | `https://api.lykuro.ai/deepseek/v1` |
| OpenAI SDK（Alibaba/Qwen） | `https://api.lykuro.ai/alibaba/compatible-mode/v1` |
| Anthropic SDK（DeepSeek） | `https://api.lykuro.ai/deepseek/anthropic` |
| Anthropic SDK（Alibaba/Qwen） | `https://api.lykuro.ai/alibaba/apps/anthropic` |
| OpenAI SDK（Kimi） | `https://api.lykuro.ai/kimi/v1` |
| OpenAI SDK（OpenAI 公式） | `https://api.lykuro.ai/openai/v1` |
| OpenAI SDK（Anthropic 互換レイヤー） | `https://api.lykuro.ai/anthropic/v1` |
| OpenAI SDK（Google Gemini） | `https://api.lykuro.ai/google/v1beta/openai` |
| Anthropic SDK（Claude 公式） | `https://api.lykuro.ai/anthropic` |
| Anthropic SDK（Kimi） | `https://api.lykuro.ai/kimi/anthropic` |
| リアルタイム音声（WSS） | `wss://api.lykuro.ai/alibaba/api-ws/v1/realtime` |

:::tip モデル名
`model` には**上流ネイティブのモデル名**を指定します（例: `deepseek-chat`, `qwen-turbo`, `kimi-k2.6`, `gpt-5.5`, `claude-sonnet-5`, `gemini-2.5-flash`）。
プロバイダは base_url で指定済みなので、`alibaba/` のような接頭辞は付けません。
利用可能なモデルは [モデル一覧](./reference/models) を参照してください。
:::

## 3. 最初のリクエスト

### Python (OpenAI SDK)

```python
from openai import OpenAI

client = OpenAI(
    api_key="lk_live_YOUR_KEY",
    base_url="https://api.lykuro.ai/deepseek/v1",
)

response = client.chat.completions.create(
    model="deepseek-chat",
    messages=[{"role": "user", "content": "こんにちは！"}],
)
print(response.choices[0].message.content)
```

### Node.js (OpenAI SDK)

```typescript
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "lk_live_YOUR_KEY",
  baseURL: "https://api.lykuro.ai/alibaba/compatible-mode/v1",
});

const response = await client.chat.completions.create({
  model: "qwen-turbo",
  messages: [{ role: "user", content: "こんにちは！" }],
});
console.log(response.choices[0].message.content);
```

### curl

```bash
curl https://api.lykuro.ai/deepseek/v1/chat/completions \
  -H "Authorization: Bearer lk_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-chat",
    "messages": [{"role": "user", "content": "こんにちは！"}]
  }'
```

## 4. 利用可能なモデル

```bash
curl https://api.lykuro.ai/v1/models \
  -H "Authorization: Bearer lk_live_YOUR_KEY"
```

詳細は [モデル一覧](./reference/models) を参照してください。

## 次のステップ

- [OpenAI SDK 統合ガイド](./guides/openai-sdk) — ストリーミング・Function Calling など
- [Anthropic SDK 統合ガイド](./guides/anthropic-sdk) — Claude Code / Messages API
- [価格表](./reference/pricing) — トークン単価と無料枠
- [レート制限](./reference/rate-limits) — Tier 別の上限値
