#!/usr/bin/env python3
"""
Lykuro 全モデル一括テストスクリプト
使い方: python3 test_models.py sk-jp-YOUR_KEY
"""

import sys
import json
import time
import urllib.request
import urllib.error

API_KEY = sys.argv[1] if len(sys.argv) > 1 else input("API Key: ")
BASE_URL = "https://api.lykuro.ai"
HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
}

# リアルタイム(WSS)モデルはスキップ
SKIP_SUFFIXES = ("-realtime", "-realtime-latest", "-realtime-2025", "-realtime-2026")

def request(path, body=None):
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(
        BASE_URL + path,
        data=data,
        headers=HEADERS,
        method="POST" if data else "GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            return json.loads(res.read()), None
    except urllib.error.HTTPError as e:
        return None, json.loads(e.read())
    except Exception as e:
        return None, {"error": {"code": "timeout", "message": str(e)}}

def get_models():
    req = urllib.request.Request(
        BASE_URL + "/v1/models",
        headers=HEADERS,
        method="GET",
    )
    with urllib.request.urlopen(req, timeout=10) as res:
        return json.loads(res.read())["data"]

def test_model(model_id):
    body = {
        "model": model_id,
        "messages": [{"role": "user", "content": "Hi"}],
        "max_tokens": 5,
    }
    return request("/v1/chat/completions", body)

# ────────────────────────────
print(f"\n{'='*60}")
print(f"  Lykuro 全モデルテスト")
print(f"{'='*60}\n")

models = get_models()
total = len(models)
print(f"取得モデル数: {total}\n")

results = {"ok": [], "error": [], "skip": []}

for i, m in enumerate(models, 1):
    mid = m["id"]

    # リアルタイムモデルはスキップ
    if any(mid.endswith(s) for s in SKIP_SUFFIXES) or "realtime" in mid:
        results["skip"].append(mid)
        print(f"[{i:3}/{total}] SKIP  {mid}")
        continue

    res, err = test_model(mid)
    time.sleep(0.3)  # レート制限対策

    if res and res.get("choices"):
        results["ok"].append(mid)
        print(f"[{i:3}/{total}] ✅ OK   {mid}")
    else:
        code = err.get("error", {}).get("code", "unknown") if err else "no_response"
        results["error"].append({"id": mid, "code": code})
        print(f"[{i:3}/{total}] ❌ NG   {mid}  ({code})")

# ────────────────────────────
print(f"\n{'='*60}")
print(f"  結果サマリー")
print(f"{'='*60}")
print(f"  ✅ 成功: {len(results['ok'])} モデル")
print(f"  ❌ 失敗: {len(results['error'])} モデル")
print(f"  ⏭  スキップ(WSS): {len(results['skip'])} モデル")

if results["error"]:
    print(f"\n  失敗モデル一覧:")
    for e in results["error"]:
        print(f"    - {e['id']}  ({e['code']})")

print()
