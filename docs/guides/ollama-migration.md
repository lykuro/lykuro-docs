---
id: ollama-migration
title: Ollama からの移行ガイド
sidebar_position: 5
---

# Ollama からの移行ガイド

Ollama から Lykuro AI への移行は `base_url` と `api_key`、`model` の変更だけで完了します。

## Python

```python
# Before (Ollama)
from openai import OpenAI
client = OpenAI(base_url="http://localhost:11434/v1", api_key="ollama")

# After (Lykuro AI) — base_url / api_key / model を変えるだけ
from openai import OpenAI
client = OpenAI(
    base_url="https://api.lykuro.ai/deepseek/v1",
    api_key="sk-jp-YOUR_KEY",
)
response = client.chat.completions.create(
    model="deepseek-chat",
    messages=[{"role": "user", "content": "こんにちは！"}],
)
```

## モデル名の対応表

| Ollama モデル | Lykuro AI（base_url / model） | 特徴 |
|---|---|---|
| `llama3.1:8b` | `/deepseek/v1` ・ `deepseek-chat` | 高速・コスパ重視 |
| `llama3.1:70b` | `/deepseek/v1` ・ `deepseek-chat` | 同等の出力品質 |
| `qwen2.5:7b` | `/alibaba/compatible-mode/v1` ・ `qwen-plus` | Alibaba 製 |
| `mistral` | `/deepseek/v1` ・ `deepseek-chat` | 汎用タスク |

## メリット

| | Ollama (ローカル) | Lykuro AI |
|---|---|---|
| 初期コスト | GPU 購入費が必要 | 不要 |
| スケール | シングルマシン上限 | 自動スケール |
| 最新モデル | 手動更新が必要 | 常に最新 |
| 本番利用 | 可用性・監視が課題 | マネージド |

## 注意点

- **プロンプト本文は保存されません** (Zero-Retention)。Ollama と同様にプライバシー保護されます
- ローカル実行と異なりネットワーク遅延が発生しますが、高速な中国LLMにより実測 TTFT は 200ms 以下が多数
