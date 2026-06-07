#!/usr/bin/env bash
# 利用可能なモデル一覧（公開エンドポイント）。実行: ./models.sh
set -euo pipefail

curl -s https://api.lykuro.ai/v1/models \
  ${LYKURO_API_KEY:+-H "Authorization: Bearer $LYKURO_API_KEY"}
