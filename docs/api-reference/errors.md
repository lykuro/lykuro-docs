---
id: errors
title: エラーコード
sidebar_position: 4
hide_table_of_contents: true
---

# エラーコード

Lykuro は透過プロキシのため、**上流（OpenAI/Anthropic 互換）が返したエラー本文・ステータスはそのまま透過**されます。
一方で、Lykuro 自身が判定するエラー（認証・残高・ルーティング・サーキットブレーカー）は次の形式で返します。

```json
{
  "error": {
    "code": "model_not_found",
    "message": "no upstream route for ..."
  }
}
```

## Lykuro が返すエラー

| コード | HTTP | 説明 | 対処 |
|---|---|---|---|
| `invalid_api_key` | 401 | APIキーが無効または未指定 | `Authorization: Bearer` か `x-api-key` を確認・再発行 |
| `api_key_revoked` | 401 | APIキーが無効化済み | 新しいキーを発行 |
| `api_key_expired` | 401 | APIキーの有効期限切れ | 新しいキーを発行 |
| `ip_not_allowed` | 403 | 許可IP以外からのアクセス | キーの許可IP設定を確認 |
| `insufficient_balance` | 402 | 残高不足 | ダッシュボードでチャージ |
| `model_not_found` | 404 | `/{プロバイダ}/パス` に対応する上流ルートが無い | base_url のプロバイダ・パスを確認 |
| `invalid_request` | 400 | リクエスト本文が読めない等 | リクエストを確認 |
| `circuit_open` | 503 | 上流障害が続きフェイルファスト中 | しばらく待ってリトライ |
| `upstream_error` | 502 | 上流への接続・応答エラー | しばらく待ってリトライ |
| `upstream_timeout` | 502 | 上流APIタイムアウト | リトライ |

:::note
上流自身が返す `401`（モデル/権限不正）、`400`（パラメータ不正）、`429`（上流レート制限）、`5xx` などは、
上流のエラー本文のまま透過されます。SDK のエラーハンドリングはそのまま利用できます。
上流へ**到達できない**場合（接続失敗・タイムアウト）のみ Lykuro が 502 を生成し、その `message` には**実際のエラー内容**が入ります（汎用文言ではありません）。
:::

## 課金との関係

- 上流の `429`（レート制限）・`5xx`（サーバーエラー）は**課金されません**（顧客有利）。
- 正常応答・クライアント起因の `4xx` は実消費トークンで課金されます。

## リトライ推奨のエラー

`429` や `502` / `503` 系はバックオフ付きリトライで解消する場合があります。

```python
import time

def chat_with_retry(client, **kwargs):
    for attempt in range(3):
        try:
            return client.chat.completions.create(**kwargs)
        except Exception:
            if attempt == 2:
                raise
            time.sleep(2 ** attempt)  # 1秒, 2秒, ...
```
