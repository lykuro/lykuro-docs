#!/usr/bin/env bash
# 基本のチャット補完。実行: LYKURO_API_KEY=lk_live_... ./chat.sh
set -euo pipefail
: "${LYKURO_API_KEY:?LYKURO_API_KEY が未設定です}"
BASE_URL="${LYKURO_BASE_URL:-https://api.lykuro.ai/deepseek/v1}"

curl -s "$BASE_URL/chat/completions" \
  -H "Authorization: Bearer $LYKURO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-chat",
    "messages": [{"role": "user", "content": "Lykuro AI を一言で紹介して。"}]
  }'
