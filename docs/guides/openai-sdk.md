---
id: openai-sdk
title: OpenAI SDK 統合ガイド
sidebar_position: 1
---

# OpenAI SDK 統合ガイド

OpenAI SDK は `base_url` を変えるだけで Lykuro AI に接続できます。
プロバイダは base_url のパスで選び、`model` には上流ネイティブ名を指定します。

| プロバイダ | base_url | model 例 |
|---|---|---|
| Alibaba/Qwen | `https://api.lykuro.ai/alibaba/compatible-mode/v1` | `qwen-turbo`, `qwen-max`, `qwen3-max` |
| DeepSeek | `https://api.lykuro.ai/deepseek/v1` | `deepseek-chat`, `deepseek-reasoner` |

## Python

```python
from openai import OpenAI

client = OpenAI(
    api_key="sk-jp-YOUR_KEY",
    base_url="https://api.lykuro.ai/alibaba/compatible-mode/v1",
)

# 通常の補完
response = client.chat.completions.create(
    model="qwen-turbo",
    messages=[
        {"role": "system", "content": "あなたは優秀なアシスタントです。"},
        {"role": "user", "content": "Python でフィボナッチ数列を書いてください。"},
    ],
    temperature=0.7,
)
print(response.choices[0].message.content)

# ストリーミング
stream = client.chat.completions.create(
    model="qwen-turbo",
    messages=[{"role": "user", "content": "長い物語を書いてください。"}],
    stream=True,
)
for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)
```

## Node.js / TypeScript

```typescript
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.LYKURO_API_KEY,
  baseURL: "https://api.lykuro.ai/alibaba/compatible-mode/v1",
});

// Function Calling
const tools: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_weather",
      description: "指定した都市の天気を取得する",
      parameters: {
        type: "object",
        properties: { city: { type: "string", description: "都市名" } },
        required: ["city"],
      },
    },
  },
];

const response = await client.chat.completions.create({
  model: "qwen-turbo",
  messages: [{ role: "user", content: "東京の天気は？" }],
  tools,
  tool_choice: "auto",
});
console.log(response.choices[0]);
```

## 環境変数

```bash
# .env
LYKURO_API_KEY=sk-jp-YOUR_KEY
OPENAI_BASE_URL=https://api.lykuro.ai/alibaba/compatible-mode/v1
```

`OPENAI_BASE_URL` を設定すると SDK が自動的に読み込みます。
DeepSeek を使う場合は `https://api.lykuro.ai/deepseek/v1` に変えてください。
