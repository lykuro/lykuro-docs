# Lykuro AI ドキュメント

[Lykuro AI Gateway](https://app.lykuro.ai) の公式ドキュメントサイト（[docs.lykuro.ai](https://docs.lykuro.ai)）のソースです。
DeepSeek・Qwen などの最先端 LLM を、**OpenAI / Anthropic 互換 API**・**円建て従量課金**で提供します。
`base_url` を差し替えるだけで、既存のコードがそのまま動きます。

```python
from openai import OpenAI

client = OpenAI(
    api_key="sk-jp-YOUR_KEY",
    base_url="https://api.lykuro.ai/deepseek/v1",  # ← ここだけ
)
resp = client.chat.completions.create(
    model="deepseek-chat",
    messages=[{"role": "user", "content": "こんにちは！"}],
)
print(resp.choices[0].message.content)
```

## 構成

| ディレクトリ | 内容 |
|---|---|
| `docs/` | ドキュメント本体（クイックスタート / API リファレンス / 統合ガイド / **サンプル集** / モデル一覧 / 価格） |
| `samples/` | **そのまま実行できるサンプルコード**（Python / TypeScript / Go / cURL） |
| `src/`, `static/` | Docusaurus のテーマ・コンポーネント・静的アセット |
| `openapi.yaml` | OpenAPI 3.1 仕様（API リファレンス生成元） |

## ローカルでプレビュー

[Docusaurus](https://docusaurus.io/) で構築しています（Node.js 20+）。

```bash
npm install
npm run start      # http://localhost:3000 で開発サーバ
npm run build      # 本番ビルド（build/ に出力）
```

## サンプルコードを動かす

```bash
cd samples/python
cp .env.example .env        # LYKURO_API_KEY を記入
pip install -r requirements.txt
python chat.py
```

各言語の手順は [`samples/`](./samples) の各 README を参照してください。

## リンク

- ドキュメント: https://docs.lykuro.ai
- ダッシュボード（APIキー発行・残高）: https://app.lykuro.ai
- お問い合わせ: support@lykuro.ai
