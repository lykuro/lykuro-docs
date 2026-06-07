---
id: litellm
title: LiteLLM 統合ガイド
sidebar_position: 4
---

# LiteLLM 統合ガイド

LiteLLM を使うと複数の LLM プロバイダーを統一インターフェースで呼び出せます。
`api_base` を Lykuro の base_url に、`model` を `openai/<上流ネイティブ名>` に設定します。

## インストール

```bash
pip install litellm
```

## 基本的な使い方

```python
import litellm

response = litellm.completion(
    model="openai/deepseek-chat",
    messages=[{"role": "user", "content": "こんにちは！"}],
    api_key="sk-jp-YOUR_KEY",
    api_base="https://api.lykuro.ai/deepseek/v1",
)
print(response.choices[0].message.content)
```

## 環境変数で設定

```bash
export OPENAI_API_KEY="sk-jp-YOUR_KEY"
export OPENAI_API_BASE="https://api.lykuro.ai/alibaba/compatible-mode/v1"
```

```python
import litellm

response = litellm.completion(
    model="openai/qwen-turbo",
    messages=[{"role": "user", "content": "こんにちは！"}],
)
```

## LiteLLM Proxy 経由

```yaml
# config.yaml
model_list:
  - model_name: qwen-turbo
    litellm_params:
      model: openai/qwen-turbo
      api_base: https://api.lykuro.ai/alibaba/compatible-mode/v1
      api_key: sk-jp-YOUR_KEY
  - model_name: deepseek-chat
    litellm_params:
      model: openai/deepseek-chat
      api_base: https://api.lykuro.ai/deepseek/v1
      api_key: sk-jp-YOUR_KEY
```

```bash
litellm --config config.yaml --port 4000
```
