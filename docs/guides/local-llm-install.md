---
id: local-llm-install
title: ローカルLLM導入ガイド
sidebar_position: 6
---

# ローカルLLM導入ガイド

顧客環境(オンプレミス / VPC / 端末)で稼働する **Lykuro Native LLM Platform**(Private Gateway)と、独自推論エンジン **Lykuro Native Inference Engine** のインストール手順です。どちらも単一バイナリで、単体で完結して動作します。

| プロダクト | リポジトリ | 役割 |
|-----------|-----------|------|
| Native LLM Platform | [lykuroai/Native-LLM-Platform](https://github.com/lykuroai/Native-LLM-Platform)(Apache-2.0) | ローカルLLM Runtime を OpenAI 互換 API として提供するゲートウェイ |
| Native Inference Engine | [lykuroai/engine](https://github.com/lykuroai/engine) | 第三者 Runtime のコードを含まない独自推論エンジン |

## Native LLM Platform(Private Gateway)

ローカルLLM Runtime(Lykuro Native Inference Engine / vLLM / Ollama / TGI / OpenAI互換)を OpenAI 互換 API として提供するゲートウェイです。対応OSは Linux / macOS / Windows(amd64 / arm64、Windows は amd64)。プロンプト本文・レスポンス本文は保存しません(Zero-Retention)。

### 1. バイナリの取得

インストールスクリプトは取得・checksum 検証・配置のみを行います(サービス登録・常駐化はしません)。

```bash title="macOS / Linux"
curl -fsSL https://raw.githubusercontent.com/lykuroai/Native-LLM-Platform/main/deploy/install.sh | bash
```

```powershell title="Windows(PowerShell)"
# curl は Invoke-WebRequest の別名のため curl.exe を明示
curl.exe -fsSLO https://raw.githubusercontent.com/lykuroai/Native-LLM-Platform/main/deploy/install.bat; .\install.bat
```

```batch title="Windows(コマンドプロンプト)"
curl -fsSLO https://raw.githubusercontent.com/lykuroai/Native-LLM-Platform/main/deploy/install.bat && install.bat
```

手動の場合は [Releases](https://github.com/lykuroai/Native-LLM-Platform/releases) から自OSのバイナリと `checksums.txt` を取得し、SHA-256 を突合してください。ソースからのビルドは `make build`(Go 1.26+)。

### 2. 設定の自動生成

```bash
private-gateway init -config gateway.yaml
```

ローカルホストの既知ポートを走査して稼働中の Runtime を検出し、モデル定義と Virtual Key(原文は一度きり表示)を含む検証済みの設定を生成します。Runtime が見つからなくてもモデル 0 件の有効な設定を生成でき、モデルは後から管理画面の取込・`init --force` の再実行・手編集で追加できます。`--cidr` で走査範囲を指定できます。

手動で作る場合は `config/gateway.example.yaml` を `gateway.yaml` へコピーし、Gateway ID と Runtime エンドポイントを設定します。

### 3. 起動

実行ファイルをそのまま起動するだけです。常駐化したい場合は systemd / launchd / タスクスケジューラ等でラップしてください。

```bash title="Linux / macOS"
chmod +x private-gateway_<ver>_<os>_<arch>
./private-gateway_<ver>_<os>_<arch> serve -config gateway.yaml
```

```powershell title="Windows(PowerShell)"
Expand-Archive private-gateway_<ver>_windows_amd64.zip .
.\private-gateway_<ver>_windows_amd64.exe serve -config gateway.yaml
```

:::note Windows の注意
zip の SHA-256 を checksums.txt と突合のうえ展開してください。コード署名が無いため SmartScreen の警告が出た場合は「詳細情報 → 実行」または `Unblock-File` で解除します。
:::

### 4. ローカル管理画面(任意)

バイナリ埋め込みの Web 管理画面(概要・Virtual Key 管理・設定編集・監査ログ・メトリクス)を使えます。トークン未発行のまま有効化しても起動しません(Fail Closed)。

```bash
private-gateway admin-token        # トークン発行(一度きり表示。ハッシュのみ保存)
LYKURO_ADMIN_ENABLED=true private-gateway serve -config gateway.yaml
# → http://127.0.0.1:9465 を開き、発行したトークン(lkpadm_…)でログイン
```

「Runtime 検出」タブでローカルホスト(または CIDR 指定、最大 /22)を走査し、発見した Runtime を承認操作(取込)で設定へ追加できます。取込するまで発見済み Runtime へは一切接続しません。

### 5. Lykuro で外部提供 — 任意機能

Gateway は単体で完結して動作します。Gateway 上のローカルモデルを **Lykuro 経由で外部に有償提供**したい場合のみ、Lykuro ダッシュボードの**「ローカルLLM」**メニュー(一般・企業アカウント共通)から登録します。

1. Gateway 側で Virtual Key を発行します(`private-gateway genkey` または管理画面)
2. ダッシュボード「ローカルLLM」→「新規登録」で **名称 / Gateway URL / Virtual Key / 環境** を入力します。登録時に Lykuro が `GET /v1/models` で疎通確認し、成功すると即座に利用可能になります
3. 同期されたモデルごとに**公開 ON/OFF と価格(JPY / 1M トークン、入力・出力別)**を設定します。公開したモデルは以下のURLで、**任意の Lykuro アカウントの API キー**から利用できます

```text
https://api.lykuro.ai/pgw/{slug}/v1/chat/completions
```

- 利用者にはあなたが設定した価格で課金され、売上はプラットフォーム手数料(12%)控除後にあなたの口座残高へ加算されます
- モデル一覧は Lykuro が5分間隔で自動同期します(手動同期も可)
- 前提: Gateway は Lykuro(インターネット側)から **HTTPS で到達可能**である必要があります
- 中継はリクエスト・レスポンス無改変の透過方式で、プロンプト本文は保存されません(Zero-Retention)

Docker Compose(`deploy/docker-compose.example.yaml`)・Kubernetes Helm(`deploy/helm/lykuro-private-gateway/`)でのデプロイも任意で選べます。

## Lykuro Native Inference Engine

第三者推論 Runtime のコードを一切含まない独自推論エンジンです。gRPC / protobuf / abseil を静的リンクした単一自己完結バイナリで配布され、外部ライブラリ依存はありません。

### 1. バイナリの取得

macOS(Apple Silicon)はワンライナーで導入できます(curl は Gatekeeper 隔離を付けないため即実行可)。

```bash title="macOS(Apple Silicon)"
curl -fsSL https://raw.githubusercontent.com/lykuroai/engine/main/deploy/macos/install.sh | bash
```

その他のプラットフォームは [Releases](https://github.com/lykuroai/engine/releases) から取得します。

| ファイル | プラットフォーム | バックエンド |
|---------|----------------|------------|
| `lykuro-native-engine-macos-arm64` | macOS Apple Silicon | Metal(Mac GPU) |
| `lykuro-native-engine-linux-cuda-1.0.0.tar.gz` | Linux x86_64 + NVIDIA | CUDA GPU |
| `lykuro-native-engine-linux-amd64` | Linux x86_64(AMD / Intel) | CPU |
| `lykuro-native-engine-linux-arm64` | Linux aarch64 | CPU |

:::note macOS の注意
バイナリは ad-hoc 署名(未公証)です。ブラウザでダウンロードした場合のみ `xattr -d com.apple.quarantine <file>` が 1 回必要です。
:::

ソースビルドは CMake ≥ 3.24 / Ninja / C++20 コンパイラで行います:

```bash
cmake --preset release -DLYKURO_ENABLE_GRPC=ON
cmake --build --preset release
```

### 2. モデル取得と生成(config 不要)

```bash
# ローカルモデル一覧
native-engine list

# Hugging Face から取得し Lykuro artifact へ変換(Python 不要)
native-engine pull Qwen/Qwen2.5-0.5B-Instruct
#   -> ~/.lykuro/models/Qwen_Qwen2.5-0.5B-Instruct

# 生成(backend 自動選択: macOS=Metal / CUDA / CPU。プロンプト省略で REPL)
native-engine run ~/.lykuro/models/Qwen_Qwen2.5-0.5B-Instruct "日本の首都は?"
```

オプション: `--backend cpu|metal|metal-fp16|cuda[:N]`、`--max-tokens N`、`--temperature T`、`--system "..."`。

### 3. HTTP API サーバ(Ollama / OpenAI 互換)

```bash
native-engine serve --http            # 127.0.0.1:11434 で待ち受け
```

モデルは HF repo id で指定し、初回に自動 pull + キャッシュされます。OpenAI SDK は `base_url=http://127.0.0.1:11434/v1`、`api_key` は任意文字列で利用できます。

```bash
# OpenAI 互換(stream:true で SSE)
curl http://127.0.0.1:11434/v1/chat/completions \
  -d '{"model":"Qwen/Qwen2.5-0.5B-Instruct","messages":[{"role":"user","content":"2+2は?"}]}'

# Ollama 互換(stream:true で NDJSON)
curl http://127.0.0.1:11434/api/chat \
  -d '{"model":"Qwen/Qwen2.5-0.5B-Instruct","messages":[{"role":"user","content":"色を3つ"}]}'
```

:::warning 公開範囲の注意
HTTP API は認証なしです。`serve --host 0.0.0.0` で外部公開する場合は信頼できる社内 LAN 限定にし、ファイアウォールで制限してください。認証が必要なら次の gRPC + mTLS 形態を使います。
:::

### 4. 本番形態(gRPC + mTLS)

```bash
native-engine serve --config engine.json
```

```json title="engine.json(本番例。strict JSON、unknown key は拒否)"
{
  "engine":   { "id": "nie-prod-01", "listen_address": "127.0.0.1", "grpc_port": 19443, "log_level": "info" },
  "security": {
    "mtls_required": true,
    "server_cert_path": "/path/secrets/server.crt",
    "server_key_path":  "/path/secrets/server.key",
    "client_ca_path":   "/path/secrets/client-ca.crt",
    "control_identities": ["lykuro-model-manager"],
    "data_identities":    ["lykuro-model-manager", "lykuro-gateway"],
    "trusted_signing_keys": ["<Ed25519公開鍵hex>"]
  },
  "model":    { "artifact_path": "/Library/Application Support/Lykuro/Models/current" },
  "hardware": { "backend": "cuda", "device_id": 0 }
}
```

本番はモデル artifact を Ed25519 署名します(fail-closed: 署名鍵も `allow_unsigned_dev` も無い場合は起動を拒否):

```bash
./build/release/tools/sign_artifact keygen signer
./build/release/tools/sign_artifact sign signer.key /models/current
```

開発用は `"security": { "mtls_required": false, "allow_unsigned_dev": true }` で mTLS なし・未署名モデル可(起動時に警告)。運用手順はリポジトリの `docs/operations/runbook.md` を参照してください。

## 両者をつなぐ

Engine を HTTP API で起動しておけば、Private Gateway が `lykuro_native` Runtime として検出・取込できます。

```bash
# 1. Engine を HTTP モードで起動
native-engine serve --http     # 127.0.0.1:11434

# 2. Gateway 側で検出・取込
private-gateway init -config gateway.yaml     # 自動検出して設定生成
# または稼働中に: 管理画面「Runtime 検出」タブ → 取込
# 読み取り専用の確認のみなら: private-gateway discover
```

検出は `/api/version` の engine フィールドで `lykuro_native` を識別します。取込後、Gateway の Virtual Key 経由で OpenAI 互換 API として社内へ提供できます。さらに Lykuro 経由で外部提供したい場合は、上記「[Lykuro で外部提供](#5-lykuro-で外部提供--任意機能)」の手順でダッシュボードの「ローカルLLM」へ登録してください。
