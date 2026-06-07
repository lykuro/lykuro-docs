---
id: chat-completions
title: テキスト生成 API
sidebar_position: 2
hide_table_of_contents: true
---

# テキスト生成 API

OpenAI Chat Completions API と互換です。base_url のプロバイダを差し替えるだけで利用できます。

## エンドポイント

```
POST https://api.lykuro.ai/deepseek/v1/chat/completions          # DeepSeek
POST https://api.lykuro.ai/alibaba/compatible-mode/v1/chat/completions   # Alibaba/Qwen
```

`model` には**上流ネイティブのモデル名**を指定します（プロバイダは base_url 側で指定済み）。

## リクエストパラメータ

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| `model` | string | ✓ | 上流ネイティブのモデル名（例: `deepseek-chat`, `qwen-turbo`）。[モデル一覧](/docs/reference/models) 参照 |
| `messages` | array | ✓ | 会話履歴。`role`（`system` / `user` / `assistant`）と `content` を持つオブジェクトの配列 |
| `stream` | boolean | | `true` でSSEストリーミング。デフォルト: `false` |
| `max_tokens` | integer | | 最大出力トークン数 |
| `temperature` | number | | 0.0〜2.0。高いほどランダム。デフォルト: `1.0` |
| `top_p` | number | | Nucleus sampling。デフォルト: `1.0` |
| `tools` | array | | Function Calling の定義リスト |
| `tool_choice` | string / object | | `"auto"` / `"none"` / `{"type":"function","function":{"name":"xxx"}}` |
| `response_format` | object | | `{"type":"json_object"}` で JSON 出力モード（対応モデルのみ） |
| `thinking` | object | | `{"type":"enabled","budget_tokens":5000}` Thinking mode（対応モデルのみ） |

その他のパラメータも上流にそのまま透過されます（未知のパラメータも含む）。

## messages の形式

### テキスト

```json
[
  { "role": "system", "content": "あなたは優秀なアシスタントです。" },
  { "role": "user",   "content": "Pythonでクイックソートを書いてください" }
]
```

### 画像入力（ビジョンモデル）

```json
[
  {
    "role": "user",
    "content": [
      { "type": "image_url", "image_url": { "url": "https://example.com/image.jpg" } },
      { "type": "text",      "text": "この画像を説明してください" }
    ]
  }
]
```

### 音声入力（Omniモデル）

```json
[
  {
    "role": "user",
    "content": [
      { "type": "input_audio", "input_audio": { "data": "<base64>", "format": "mp3" } },
      { "type": "text",        "text": "この音声を文字起こしして要約してください" }
    ]
  }
]
```

## レスポンス（非ストリーミング）

上流の応答がそのまま返ります。

```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1748000000,
  "model": "qwen-turbo",
  "choices": [
    {
      "index": 0,
      "message": { "role": "assistant", "content": "こんにちは！何かお手伝いできますか？" },
      "finish_reason": "stop"
    }
  ],
  "usage": { "prompt_tokens": 20, "completion_tokens": 15, "total_tokens": 35 }
}
```

## レスポンス（ストリーミング SSE）

```
data: {"id":"chatcmpl-abc","object":"chat.completion.chunk","choices":[{"delta":{"content":"こん"},"index":0}]}
data: {"id":"chatcmpl-abc","object":"chat.completion.chunk","choices":[{"delta":{"content":"にちは"},"index":0}]}
data: [DONE]
```

---

## サンプル

### curl — 基本

```bash
curl https://api.lykuro.ai/alibaba/compatible-mode/v1/chat/completions \
  -H "Authorization: Bearer sk-jp-YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen-turbo",
    "messages": [
      {"role": "system", "content": "あなたは優秀なアシスタントです。"},
      {"role": "user",   "content": "Pythonでクイックソートを書いてください"}
    ]
  }'
```

### curl — ストリーミング

```bash
curl https://api.lykuro.ai/alibaba/compatible-mode/v1/chat/completions \
  -H "Authorization: Bearer sk-jp-YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen-turbo",
    "messages": [{"role": "user", "content": "日本の歴史を教えてください"}],
    "stream": true
  }'
```

### Python（OpenAI SDK）— 基本

```python
from openai import OpenAI

client = OpenAI(
    api_key="sk-jp-YOUR_KEY",
    base_url="https://api.lykuro.ai/alibaba/compatible-mode/v1",
)

response = client.chat.completions.create(
    model="qwen-turbo",
    messages=[
        {"role": "system", "content": "あなたは優秀なアシスタントです。"},
        {"role": "user",   "content": "Pythonでクイックソートを書いてください"},
    ],
)
print(response.choices[0].message.content)
```

### Python — ストリーミング

```python
stream = client.chat.completions.create(
    model="qwen-turbo",
    messages=[{"role": "user", "content": "長い物語を書いてください"}],
    stream=True,
)
for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)
```

### Python — Thinking mode（qwen3-max / qwq-plus / deepseek-reasoner 等）

```python
response = client.chat.completions.create(
    model="qwen3-max",
    messages=[{"role": "user", "content": "この数学の問題を解いてください: ..."}],
    extra_body={"thinking": {"type": "enabled", "budget_tokens": 8000}},
)
print(response.choices[0].message.reasoning_content)  # 思考過程
print(response.choices[0].message.content)             # 最終回答
```

### Python — Function Calling

```python
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "指定した都市の天気を取得する",
            "parameters": {
                "type": "object",
                "properties": {"city": {"type": "string", "description": "都市名"}},
                "required": ["city"],
            },
        },
    }
]

response = client.chat.completions.create(
    model="qwen-turbo",
    messages=[{"role": "user", "content": "東京の天気は？"}],
    tools=tools,
    tool_choice="auto",
)
tool_call = response.choices[0].message.tool_calls[0]
print(tool_call.function.name)       # get_weather
print(tool_call.function.arguments)  # {"city": "東京"}
```

### Python — JSON 出力モード

```python
response = client.chat.completions.create(
    model="qwen-turbo",
    messages=[{"role": "user", "content": "東京・大阪・名古屋の人口をJSON形式で返してください"}],
    response_format={"type": "json_object"},
)
import json
print(json.loads(response.choices[0].message.content))
```

### Python — 画像解析

```python
import base64

with open("image.jpg", "rb") as f:
    image_data = base64.b64encode(f.read()).decode()

response = client.chat.completions.create(
    model="qwen-vl-max",
    messages=[{
        "role": "user",
        "content": [
            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_data}"}},
            {"type": "text", "text": "画像の内容を日本語で説明してください"},
        ],
    }],
)
print(response.choices[0].message.content)
```

### Python — DeepSeek を使う

```python
deepseek = OpenAI(
    api_key="sk-jp-YOUR_KEY",
    base_url="https://api.lykuro.ai/deepseek/v1",
)
response = deepseek.chat.completions.create(
    model="deepseek-chat",          # または deepseek-reasoner
    messages=[{"role": "user", "content": "高速なソートアルゴリズムを説明して"}],
)
print(response.choices[0].message.content)
```

### Node.js（OpenAI SDK）

```typescript
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "sk-jp-YOUR_KEY",
  baseURL: "https://api.lykuro.ai/alibaba/compatible-mode/v1",
});

const response = await client.chat.completions.create({
  model: "qwen-turbo",
  messages: [
    { role: "system", content: "あなたは優秀なアシスタントです。" },
    { role: "user",   content: "TypeScriptでソートアルゴリズムを書いてください" },
  ],
});
console.log(response.choices[0].message.content);
```
