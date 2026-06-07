---
id: error-codes
title: エラーコード一覧
sidebar_position: 4
---

# エラーコード一覧

Lykuro は透過プロキシのため、**上流（OpenAI/Anthropic 互換）が返したエラーはそのまま透過**されます。
Lykuro 自身が判定するエラー（認証・残高・ルーティング・サーキットブレーカー）は以下の形式で返ります。

```json
{
  "error": {
    "code": "model_not_found",
    "message": "no upstream route for ..."
  }
}
```

## 認証エラー (401 / 403)

| コード | HTTP | 説明 |
|---|---|---|
| `invalid_api_key` | 401 | APIキーが無効または存在しない |
| `api_key_revoked` | 401 | APIキーが無効化済み |
| `api_key_expired` | 401 | APIキーの有効期限が切れている |
| `ip_not_allowed` | 403 | 許可IP以外からのアクセス |

## 残高エラー (402)

| コード | HTTP | 説明 |
|---|---|---|
| `insufficient_balance` | 402 | 残高が不足しています |

## ルーティングエラー (404)

| コード | HTTP | 説明 |
|---|---|---|
| `model_not_found` | 404 | `/{プロバイダ}/パス` に対応する上流ルートが無い。base_url を確認 |

## 可用性エラー (502 / 503)

| コード | HTTP | 説明 |
|---|---|---|
| `circuit_open` | 503 | 上流障害が続きフェイルファスト中。しばらく待ってリトライ |
| `upstream_error` | 502 | 上流への接続・応答エラー |
| `upstream_timeout` | 502 | 上流 API がタイムアウト |

## サーバーエラー (500)

| コード | HTTP | 説明 |
|---|---|---|
| `internal_error` | 500 | Lykuro AI 内部エラー。サポートまでご連絡ください |

:::note 上流のエラー
モデル名やパラメータの不正、上流のレート制限（`429`）、上流のサーバーエラー（`5xx`）などは、
上流のエラー本文・ステータスのまま透過されます。SDK のエラーハンドリングはそのまま利用できます。
:::
