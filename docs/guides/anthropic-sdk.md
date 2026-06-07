---
id: anthropic-sdk
title: Anthropic SDK / Claude Code 統合ガイド
sidebar_position: 2
---

# Anthropic SDK / Claude Code 統合ガイド

Lykuro AI は Anthropic Messages API を**ネイティブ透過**します。上流の Anthropic 互換エンドポイントへ
そのまま転送するため、`base_url` の差し替えだけで動作します。

| プロバイダ | base_url | model 例 |
|---|---|---|
| Alibaba/Qwen | `https://api.lykuro.ai/alibaba/apps/anthropic` | `qwen3-max`, `qwen-max` |
| DeepSeek | `https://api.lykuro.ai/deepseek/anthropic` | `deepseek-chat` |

:::note 認証ヘッダー
Anthropic 系クライアントは API キーを `x-api-key` ヘッダーで送ります。Lykuro はこれを受理します
（`Authorization: Bearer` も可）。
:::

## Python

```python
import anthropic

client = anthropic.Anthropic(
    api_key="sk-jp-YOUR_KEY",
    base_url="https://api.lykuro.ai/alibaba/apps/anthropic",
)

message = client.messages.create(
    model="qwen3-max",
    max_tokens=1024,
    messages=[{"role": "user", "content": "こんにちは！"}],
)
print(message.content[0].text)
```

## Node.js / TypeScript

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.LYKURO_API_KEY,
  baseURL: "https://api.lykuro.ai/deepseek/anthropic",
});

const message = await client.messages.create({
  model: "deepseek-chat",
  max_tokens: 1024,
  messages: [{ role: "user", content: "こんにちは！" }],
});
console.log(message.content[0]);
```

## Claude Code / OpenClaw / Hermes Agent

これらの Anthropic 系開発ツールは、設定の `base_url` を Lykuro に向けるだけで利用できます。

```
# Alibaba/Qwen を使う場合
model.base_url = https://api.lykuro.ai/alibaba/apps/anthropic

# DeepSeek を使う場合
model.base_url = https://api.lykuro.ai/deepseek/anthropic
```

API キーは各ツールの設定（`x-api-key` 相当）に `sk-jp-...` を指定します。
`model` には上流ネイティブ名（`qwen3-max`, `deepseek-chat` 等）を指定してください。
