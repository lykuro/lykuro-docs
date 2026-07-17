# Lykuro AI — サンプルコード

そのまま実行できる最小サンプルです。いずれも `base_url` を Lykuro に差し替えるだけで、
既存の OpenAI / Anthropic SDK がそのまま動くことを示します。

| ディレクトリ | 言語 | 内容 |
|---|---|---|
| [`python/`](./python) | Python | チャット / ストリーミング / Function Calling |
| [`typescript/`](./typescript) | TypeScript (Node) | チャット / ストリーミング |
| [`go/`](./go) | Go | チャット |
| [`curl/`](./curl) | シェル (cURL) | チャット / ストリーミング / モデル一覧 |

## 共通の準備

1. [ダッシュボード](https://app.lykuro.ai)で APIキー（`lk_live_...`）を発行
2. 各ディレクトリの `.env.example` を `.env` にコピーして `LYKURO_API_KEY` を記入

詳しい解説は [ドキュメントのサンプル集](https://docs.lykuro.ai/docs/cookbook) を参照してください。
