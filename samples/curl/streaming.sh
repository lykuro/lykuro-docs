#!/usr/bin/env bash
# ストリーミング（SSE）。実行: LYKURO_API_KEY=sk-jp-... ./streaming.sh
set -euo pipefail
: "${LYKURO_API_KEY:?LYKURO_API_KEY が未設定です}"
BASE_URL="${LYKURO_BASE_URL:-https://api.lykuro.ai/deepseek/v1}"

curl -N -s "$BASE_URL/chat/completions" \
  -H "Authorization: Bearer $LYKURO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-chat",
    "messages": [{"role": "user", "content": "春をテーマに俳句を3つ作ってください。"}],
    "stream": true
  }'
