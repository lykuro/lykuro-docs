---
id: realtime
title: リアルタイム API（WebSocket）
sidebar_position: 3
hide_table_of_contents: true
---

# リアルタイム API（WebSocket）

音声・テキストのリアルタイム双方向対話に使用します。
Alibaba DashScope の Realtime API を透過プロキシします。

## エンドポイント

```
wss://api.lykuro.ai/alibaba/api-ws/v1/realtime?model={model}
Authorization: Bearer lk_live_YOUR_KEY
```

`model` には**上流ネイティブのモデル名**を指定します（プロバイダ `alibaba` は base_url 側で指定済み）。

## 対応モデル

| model | 説明 |
|---|---|
| `qwen3.5-omni-plus-realtime` | フラッグシップ・音声/テキスト/画像対応 |
| `qwen3.5-omni-flash-realtime` | 軽量・低レイテンシ |
| `qwen3-omni-flash-realtime` | Qwen3 軽量リアルタイム |
| `qwen3-livetranslate-flash-realtime` | リアルタイム同時翻訳（60言語） |

## 音声フォーマット

| 方向 | フォーマット | サンプリングレート |
|---|---|---|
| 入力 | PCM16 | 16 kHz |
| 出力 | PCM16 | 24 kHz |

---

## 接続フロー

```
1. WSS 接続確立
   wss://api.lykuro.ai/alibaba/api-ws/v1/realtime?model=qwen3.5-omni-plus-realtime
   Authorization: Bearer lk_live_YOUR_KEY

2. session.update イベント送信（セッション設定）

3. 音声/画像データ送信
   input_audio_buffer.append  — 音声データ（Base64）
   input_image_buffer.append  — 画像データ（Base64）
   input_audio_buffer.commit  — バッファ確定

4. response.create — 応答生成リクエスト

5. サーバーからレスポンス受信
   response.text.delta        — テキストチャンク
   response.audio.delta       — 音声チャンク（Base64）
   response.done              — 完了（usage 含む／この時点で課金）
```

---

## クライアント送信イベント

| イベント type | 説明 | 主なパラメータ |
|---|---|---|
| `session.update` | セッション設定を更新 | `modalities`（text/audio）、`input_audio_format`、`output_audio_format`、`instructions`、`voice` |
| `input_audio_buffer.append` | 音声データをバッファに追加 | `audio`（Base64文字列） |
| `input_image_buffer.append` | 画像データをバッファに追加 | `image`（Base64文字列） |
| `input_audio_buffer.commit` | 音声バッファを確定（手動モード時） | — |
| `response.create` | 応答生成をリクエスト | — |
| `response.cancel` | 進行中の応答をキャンセル | — |

### session.update サンプル

```json
{
  "type": "session.update",
  "session": {
    "modalities": ["text", "audio"],
    "input_audio_format": "pcm16",
    "output_audio_format": "pcm16",
    "instructions": "あなたは親切な日本語アシスタントです。",
    "voice": "alloy"
  }
}
```

---

## サーバー受信イベント

| イベント type | 説明 |
|---|---|
| `session.created` | セッション確立完了 |
| `response.text.delta` | テキストチャンク（逐次） |
| `response.text.done` | テキスト生成完了 |
| `response.audio.delta` | 音声チャンク（Base64、逐次） |
| `response.audio.done` | 音声生成完了 |
| `response.audio_transcript.delta` | 出力音声の書き起こし（逐次） |
| `conversation.item.input_audio_transcription.completed` | 入力音声の書き起こし完了 |
| `input_audio_buffer.speech_started` | 発話開始検知（VAD） |
| `input_audio_buffer.speech_stopped` | 発話終了検知（VAD） |
| `response.done` | 応答完了（usage 含む） |

---

## サンプル — Python（音声リアルタイム対話）

```python
import asyncio
import json
import base64
import websockets

async def realtime_chat():
    url = "wss://api.lykuro.ai/alibaba/api-ws/v1/realtime?model=qwen3.5-omni-plus-realtime"
    headers = {"Authorization": "Bearer lk_live_YOUR_KEY"}

    async with websockets.connect(url, extra_headers=headers) as ws:
        # 1. セッション設定
        await ws.send(json.dumps({
            "type": "session.update",
            "session": {
                "modalities": ["text", "audio"],
                "input_audio_format": "pcm16",   # 16kHz PCM16
                "output_audio_format": "pcm16",  # 24kHz PCM16
                "instructions": "あなたは親切な日本語アシスタントです。",
            },
        }))

        # 2. 音声データ送信（16kHz PCM16）
        with open("input.pcm", "rb") as f:
            audio_data = base64.b64encode(f.read()).decode()

        await ws.send(json.dumps({"type": "input_audio_buffer.append", "audio": audio_data}))
        await ws.send(json.dumps({"type": "input_audio_buffer.commit"}))

        # 3. 応答生成リクエスト
        await ws.send(json.dumps({"type": "response.create"}))

        # 4. レスポンス受信
        async for message in ws:
            event = json.loads(message)
            if event["type"] == "response.text.delta":
                print(event["delta"], end="", flush=True)
            elif event["type"] == "response.audio.delta":
                audio_chunk = base64.b64decode(event["audio"])  # 再生処理へ
            elif event["type"] == "response.audio_transcript.delta":
                print(f"[書き起こし] {event['delta']}", end="", flush=True)
            elif event["type"] == "response.done":
                print("\n[完了]")
                break

asyncio.run(realtime_chat())
```

## サンプル — Node.js（音声リアルタイム対話）

```typescript
import WebSocket from "ws";
import fs from "fs";

const ws = new WebSocket(
  "wss://api.lykuro.ai/alibaba/api-ws/v1/realtime?model=qwen3.5-omni-plus-realtime",
  { headers: { Authorization: "Bearer lk_live_YOUR_KEY" } }
);

ws.on("open", () => {
  ws.send(JSON.stringify({
    type: "session.update",
    session: {
      modalities: ["text", "audio"],
      input_audio_format: "pcm16",
      output_audio_format: "pcm16",
      instructions: "あなたは親切な日本語アシスタントです。",
    },
  }));

  const audioData = fs.readFileSync("input.pcm").toString("base64");
  ws.send(JSON.stringify({ type: "input_audio_buffer.append", audio: audioData }));
  ws.send(JSON.stringify({ type: "input_audio_buffer.commit" }));
  ws.send(JSON.stringify({ type: "response.create" }));
});

ws.on("message", (data) => {
  const event = JSON.parse(data.toString());
  if (event.type === "response.text.delta") {
    process.stdout.write(event.delta);
  } else if (event.type === "response.audio.delta") {
    const audioChunk = Buffer.from(event.audio, "base64"); // 再生処理へ
  } else if (event.type === "response.done") {
    console.log("\n[完了]");
    ws.close();
  }
});

ws.on("error", (err) => console.error("WebSocket エラー:", err));
ws.on("close", () => console.log("接続終了"));
```

## サンプル — リアルタイム翻訳（60言語）

```python
async def live_translate():
    url = "wss://api.lykuro.ai/alibaba/api-ws/v1/realtime?model=qwen3-livetranslate-flash-realtime"
    headers = {"Authorization": "Bearer lk_live_YOUR_KEY"}

    async with websockets.connect(url, extra_headers=headers) as ws:
        await ws.send(json.dumps({
            "type": "session.update",
            "session": {"modalities": ["text"], "instructions": "日本語を英語にリアルタイム翻訳してください。"},
        }))
        with open("japanese_speech.pcm", "rb") as f:
            audio_data = base64.b64encode(f.read()).decode()
        await ws.send(json.dumps({"type": "input_audio_buffer.append", "audio": audio_data}))
        await ws.send(json.dumps({"type": "input_audio_buffer.commit"}))
        await ws.send(json.dumps({"type": "response.create"}))
        async for message in ws:
            event = json.loads(message)
            if event["type"] == "response.text.delta":
                print(event["delta"], end="", flush=True)
            elif event["type"] == "response.done":
                break

asyncio.run(live_translate())
```

## サンプル — wscat（接続テスト）

```bash
npm install -g wscat
wscat -c "wss://api.lykuro.ai/alibaba/api-ws/v1/realtime?model=qwen3.5-omni-plus-realtime" \
  -H "Authorization: Bearer lk_live_YOUR_KEY"
```

接続後にセッション設定を送信：

```json
{"type":"session.update","session":{"modalities":["text"],"instructions":"こんにちは！"}}
```

---

## 中断時の動作

| 状況 | 動作 |
|---|---|
| クライアント切断 | 上流 WSS 接続も即切断 |
| 上流切断 | クライアント WSS も切断。クライアント側で再接続 |
| セッション継続 | 非対応（再接続時は新規セッション） |

課金は `response.done` イベントごとに実消費トークンで行われます。
