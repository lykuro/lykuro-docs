---
id: rate-limits
title: レート制限と Tier
sidebar_position: 3
---

# レート制限と Tier

アカウントは利用実績に応じて自動的に Tier が昇格します。

## Tier 別レート制限

| Tier | RPM | TPM | 昇格条件 |
|---|---|---|---|
| Tier 1 (初期) | 60 | 1,000,000 | — |
| Tier 2 | 300 | 5,000,000 | 累計消費 ¥3,000 以上 + 7日以上 |
| Tier 3 | 1,500 | 20,000,000 | 累計消費 ¥30,000 以上 + 30日以上 |
| Tier 4 | カスタム | カスタム | エンタープライズ契約 |

- **RPM**: Requests Per Minute
- **TPM**: Tokens Per Minute

## Tier の確認

ダッシュボードの残高ページ、または API で確認できます。

```bash
curl https://api.lykuro.ai/api/billing/balance \
  -H "Authorization: Bearer lk_live_YOUR_KEY"
```

```json
{
  "balance_jpy": 8500.0,
  "current_tier": 2,
  "next_tier_progress": {
    "next_tier": 3,
    "required_consumed_jpy": 30000,
    "current_consumed_jpy": 12500,
    "progress_percent": 41.7
  }
}
```

## レート制限エラー

レート制限を超えると `HTTP 429` が返ります。

```json
{
  "error": {
    "type": "rate_limit_exceeded",
    "code": "rate_limit_exceeded",
    "message": "リクエスト数が制限を超えました。しばらく待ってから再試行してください。"
  }
}
```

`Retry-After` ヘッダーに再試行可能になる秒数が含まれます。
