import React, { useMemo, useState } from "react";
import CodeBlock from "@theme/CodeBlock";
import styles from "./styles.module.css";
import data from "@site/src/data/models.generated.json";
import { apiRefFor, videoSubtype } from "./params";

// ─── Types ──────────────────────────────────────────────────────────────────
export type Model = {
  id: string;
  provider: string;
  model: string;
  category: string;
  group: string;
  kind: string;
  features: string[];
  price: string;
  docUrl?: string;
};

type Tab = { label: string; lang: string; code: string };

export const MODELS = (data as { models: Model[] }).models;

// ─── Feature metadata (label + filter order) ────────────────────────────────
const FEATURE_LABELS: Record<string, string> = {
  stream: "ストリーミング",
  tools: "Function Calling",
  json: "JSON出力",
  thinking: "思考モード",
  vision: "画像入力",
  audio: "音声入力",
  realtime: "リアルタイム",
  code: "コード生成",
  math: "数学",
  translation: "翻訳",
  ocr: "OCR",
  image: "画像生成",
  video: "動画生成",
  tts: "音声合成",
  asr: "音声認識",
  embedding: "埋め込み",
  rerank: "リランク",
  cache: "キャッシュ",
};
const FEATURE_ORDER = Object.keys(FEATURE_LABELS);

// ─── Base URLs (see config/models.yaml proxy routes) ────────────────────────
const OPENAI_BASE: Record<string, string> = {
  deepseek: "https://api.lykuro.ai/deepseek/v1",
  alibaba: "https://api.lykuro.ai/alibaba/compatible-mode/v1",
};
const WS_BASE = "wss://api.lykuro.ai/alibaba/api-ws/v1/realtime";
const DASHSCOPE_BASE = "https://api.lykuro.ai/alibaba/api/v1";

// ─── Series-representative example builders, keyed by kind ───────────────────
function promptFor(m: Model): string {
  if (m.features.includes("code")) return "Pythonでクイックソートを実装してください。";
  if (m.features.includes("math")) return "x^2 - 5x + 6 = 0 を解いてください。";
  if (m.features.includes("translation")) return "次の文を英訳してください: 「明日は晴れますように。」";
  return "こんにちは！できることを簡単に教えてください。";
}

function chatExamples(m: Model): Tab[] {
  const base = OPENAI_BASE[m.provider];
  const prompt = promptFor(m);
  const thinkingNote = m.features.includes("thinking")
    ? `\n# 思考モードを使う場合: extra_body={"thinking": {"type": "enabled"}} を追加`
    : "";
  return [
    {
      label: "curl",
      lang: "bash",
      code: `curl ${base}/chat/completions \\
  -H "Authorization: Bearer sk-jp-YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${m.model}",
    "messages": [{"role": "user", "content": "${prompt}"}]
  }'`,
    },
    {
      label: "Python",
      lang: "python",
      code: `from openai import OpenAI

client = OpenAI(api_key="sk-jp-YOUR_KEY", base_url="${base}")
${thinkingNote}
response = client.chat.completions.create(
    model="${m.model}",
    messages=[{"role": "user", "content": "${prompt}"}],
)
print(response.choices[0].message.content)`,
    },
    {
      label: "Node.js",
      lang: "typescript",
      code: `import OpenAI from "openai";

const client = new OpenAI({ apiKey: "sk-jp-YOUR_KEY", baseURL: "${base}" });

const res = await client.chat.completions.create({
  model: "${m.model}",
  messages: [{ role: "user", content: "${prompt}" }],
});
console.log(res.choices[0].message.content);`,
    },
  ];
}

function visionExamples(m: Model): Tab[] {
  const base = OPENAI_BASE[m.provider];
  const ask = m.features.includes("ocr")
    ? "画像内の文字をすべて書き起こしてください。"
    : "この画像を日本語で説明してください。";
  return [
    {
      label: "curl",
      lang: "bash",
      code: `curl ${base}/chat/completions \\
  -H "Authorization: Bearer sk-jp-YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${m.model}",
    "messages": [{
      "role": "user",
      "content": [
        {"type": "image_url", "image_url": {"url": "https://example.com/image.jpg"}},
        {"type": "text", "text": "${ask}"}
      ]
    }]
  }'`,
    },
    {
      label: "Python",
      lang: "python",
      code: `from openai import OpenAI

client = OpenAI(api_key="sk-jp-YOUR_KEY", base_url="${base}")

response = client.chat.completions.create(
    model="${m.model}",
    messages=[{
        "role": "user",
        "content": [
            {"type": "image_url", "image_url": {"url": "https://example.com/image.jpg"}},
            {"type": "text", "text": "${ask}"},
        ],
    }],
)
print(response.choices[0].message.content)`,
    },
  ];
}

function omniExamples(m: Model): Tab[] {
  const base = OPENAI_BASE[m.provider];
  return [
    {
      label: "Python",
      lang: "python",
      code: `import base64
from openai import OpenAI

client = OpenAI(api_key="sk-jp-YOUR_KEY", base_url="${base}")

with open("audio.mp3", "rb") as f:
    audio = base64.b64encode(f.read()).decode()

response = client.chat.completions.create(
    model="${m.model}",
    messages=[{
        "role": "user",
        "content": [
            {"type": "input_audio", "input_audio": {"data": audio, "format": "mp3"}},
            {"type": "text", "text": "この音声を文字起こしして要約してください。"},
        ],
    }],
)
print(response.choices[0].message.content)`,
    },
    {
      label: "curl",
      lang: "bash",
      code: `curl ${base}/chat/completions \\
  -H "Authorization: Bearer sk-jp-YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${m.model}",
    "messages": [{
      "role": "user",
      "content": [
        {"type": "image_url", "image_url": {"url": "https://example.com/image.jpg"}},
        {"type": "text", "text": "この画像について説明してください。"}
      ]
    }]
  }'`,
    },
  ];
}

function realtimeExamples(m: Model): Tab[] {
  return [
    {
      label: "Python",
      lang: "python",
      code: `import asyncio, json, base64
import websockets

async def main():
    url = "${WS_BASE}?model=${m.model}"
    headers = {"Authorization": "Bearer sk-jp-YOUR_KEY"}
    async with websockets.connect(url, extra_headers=headers) as ws:
        await ws.send(json.dumps({
            "type": "session.update",
            "session": {"modalities": ["text", "audio"],
                        "input_audio_format": "pcm16",
                        "output_audio_format": "pcm16"},
        }))
        with open("input.pcm", "rb") as f:
            await ws.send(json.dumps({
                "type": "input_audio_buffer.append",
                "audio": base64.b64encode(f.read()).decode(),
            }))
        await ws.send(json.dumps({"type": "input_audio_buffer.commit"}))
        await ws.send(json.dumps({"type": "response.create"}))
        async for msg in ws:
            ev = json.loads(msg)
            if ev["type"] == "response.text.delta":
                print(ev["delta"], end="", flush=True)
            elif ev["type"] == "response.done":
                break

asyncio.run(main())`,
    },
    {
      label: "Node.js",
      lang: "typescript",
      code: `import WebSocket from "ws";
import fs from "fs";

const ws = new WebSocket("${WS_BASE}?model=${m.model}", {
  headers: { Authorization: "Bearer sk-jp-YOUR_KEY" },
});

ws.on("open", () => {
  ws.send(JSON.stringify({
    type: "session.update",
    session: { modalities: ["text", "audio"], input_audio_format: "pcm16", output_audio_format: "pcm16" },
  }));
  const audio = fs.readFileSync("input.pcm").toString("base64");
  ws.send(JSON.stringify({ type: "input_audio_buffer.append", audio }));
  ws.send(JSON.stringify({ type: "input_audio_buffer.commit" }));
  ws.send(JSON.stringify({ type: "response.create" }));
});

ws.on("message", (d) => {
  const ev = JSON.parse(d.toString());
  if (ev.type === "response.text.delta") process.stdout.write(ev.delta);
  if (ev.type === "response.done") ws.close();
});`,
    },
  ];
}

function embeddingExamples(m: Model): Tab[] {
  const base = OPENAI_BASE[m.provider];
  return [
    {
      label: "Python",
      lang: "python",
      code: `from openai import OpenAI

client = OpenAI(api_key="sk-jp-YOUR_KEY", base_url="${base}")

resp = client.embeddings.create(
    model="${m.model}",
    input=["Lykuro AI Gateway", "OpenAI 互換の埋め込み"],
)
print(len(resp.data[0].embedding))`,
    },
    {
      label: "curl",
      lang: "bash",
      code: `curl ${base}/embeddings \\
  -H "Authorization: Bearer sk-jp-YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${m.model}",
    "input": ["Lykuro AI Gateway", "OpenAI 互換の埋め込み"]
  }'`,
    },
  ];
}

// DashScope ネイティブAPI（/alibaba/api/v1）経由。
// 詳細パラメータは Alibaba Model Studio のモデル仕様を参照してください。
function dashscopeExamples(m: Model): Tab[] {
  const path: Record<string, string> = {
    image: "/services/aigc/text2image/image-synthesis",
    video: "/services/aigc/video-generation/video-synthesis",
    tts: "/services/aigc/multimodal-generation/generation",
    asr: "/services/audio/asr/transcription",
    rerank: "/services/rerank/text-rerank/text-rerank",
  };
  const input: Record<string, string> = {
    image: `"input": {"prompt": "富士山を背景にした桜並木、写実的"}`,
    video: `"input": {"prompt": "波打ち際を走る犬、シネマティック"}`,
    tts: `"input": {"text": "こんにちは、Lykuro へようこそ。", "voice": "Cherry"}`,
    asr: `"input": {"file_urls": ["https://example.com/audio.mp3"]}`,
    rerank: `"input": {"query": "東京の天気", "documents": ["今日は晴れ", "明日は雨"]}`,
  };
  let body = input[m.kind];
  if (m.kind === "video") {
    // サブタイプ(t2v/i2v/kf2v/r2v/動画編集/animate)ごとに必須入力が異なる。
    // パラメータ表(params.ts の videoSubtype 分岐)と同じ判定を使う。
    const videoBody: Record<string, string> = {
      t2v: `"input": {"prompt": "波打ち際を走る犬、シネマティック"},\n    "parameters": {"resolution": "720P", "duration": 5}`,
      i2v: `"input": {\n      "img_url": "https://example.com/first-frame.png",\n      "prompt": "画像の犬が波打ち際を走り出す、シネマティック"\n    },\n    "parameters": {"resolution": "720P", "duration": 5}`,
      kf2v: `"input": {\n      "first_frame_url": "https://example.com/first-frame.png",\n      "last_frame_url": "https://example.com/last-frame.png",\n      "prompt": "つぼみがゆっくり開花する、タイムラプス"\n    },\n    "parameters": {"resolution": "720P", "duration": 5}`,
      r2v: `"input": {\n      "ref_images_url": ["https://example.com/character.png"],\n      "prompt": "参照キャラクターが雨の街を歩く、ローアングル"\n    },\n    "parameters": {"resolution": "720P", "duration": 5}`,
      edit: `"input": {\n      "video_url": "https://example.com/source.mp4",\n      "prompt": "背景を夜の街に差し替え、全体をアニメ調に変換する"\n    },\n    "parameters": {"watermark": false}`,
      animate: `"input": {\n      "image_url": "https://example.com/character.png",\n      "video_url": "https://example.com/dance-motion.mp4"\n    },\n    "parameters": {"watermark": false}`,
    };
    body = videoBody[videoSubtype(m.model)];
  }
  const ep = `${DASHSCOPE_BASE}${path[m.kind]}`;
  const async = m.kind === "image" || m.kind === "video" || m.kind === "asr";
  // 成功時に結果を取り出すフィールド(kind 別)。
  const resultField: Record<string, string> = {
    image: `"results": [{"url": "https://dashscope-result-....png"}]`,
    video: `"video_url": "https://dashscope-result-....mp4"`,
    asr: `"results": [{"transcription_url": "https://dashscope-result-....json", "subtask_status": "SUCCEEDED"}]`,
  };
  const poll = `
# レスポンス例（この時点では生成は未完了）:
# {"output": {"task_id": "a1b2c3d4-...", "task_status": "PENDING"}, "request_id": "..."}

# 2. 生成完了までポーリング（task_id は上記レスポンスの output.task_id。SUCCEEDED まで数十秒〜数分）
curl ${DASHSCOPE_BASE}/tasks/YOUR_TASK_ID \\
  -H "Authorization: Bearer sk-jp-YOUR_KEY"

# レスポンス例（成功時）。結果URLの有効期限は24時間:
# {"output": {"task_status": "SUCCEEDED", ${resultField[m.kind]}}, "usage": {...}, "request_id": "..."}`;
  const tabs: Tab[] = [
    {
      label: "curl",
      lang: "bash",
      code: `# DashScope ネイティブAPI（/alibaba/api/v1）経由${async ? "・非同期タスク" : ""}
${async ? "# 1. タスク作成\n" : ""}curl ${ep} \\
  -H "Authorization: Bearer sk-jp-YOUR_KEY" \\
  -H "Content-Type: application/json" \\${async ? '\n  -H "X-DashScope-Async: enable" \\' : ""}
  -d '{
    "model": "${m.model}",
    ${body}
  }'${async ? poll : ""}`,
    },
  ];
  if (async) {
    // 取り出しフィールド(kind 別)の Python 式。
    const pyResult: Record<string, string> = {
      image: `task["output"]["results"][0]["url"]`,
      video: `task["output"]["video_url"]`,
      asr: `task["output"]["results"][0]["transcription_url"]`,
    };
    // JSON リテラル(true/false/null)を Python リテラルへ変換して埋め込む。
    const pyJson = body
      .replace(/\btrue\b/g, "True")
      .replace(/\bfalse\b/g, "False")
      .replace(/\bnull\b/g, "None");
    const pyBody = `{\n        "model": "${m.model}",\n        ${pyJson.replace(/\n {4}/g, "\n        ")},\n    }`;
    tabs.push({
      label: "Python",
      lang: "python",
      code: `import time
import requests

BASE = "${DASHSCOPE_BASE}"
HEADERS = {"Authorization": "Bearer sk-jp-YOUR_KEY"}

# 1. タスク作成（非同期）— 即座に task_id が返る
r = requests.post(
    f"{BASE}${path[m.kind]}",
    headers={**HEADERS, "X-DashScope-Async": "enable"},
    json=${pyBody},
)
r.raise_for_status()
task_id = r.json()["output"]["task_id"]

# 2. 完了までポーリング（SUCCEEDED / FAILED / CANCELED で終了）
while True:
    task = requests.get(f"{BASE}/tasks/{task_id}", headers=HEADERS).json()
    status = task["output"]["task_status"]
    if status in ("SUCCEEDED", "FAILED", "CANCELED"):
        break
    time.sleep(5)  # PENDING / RUNNING の間は数秒間隔で照会

# 3. 結果の取得（URLの有効期限は24時間。期限内にダウンロードして保存する）
if status == "SUCCEEDED":
    print(${pyResult[m.kind]})
else:
    print(status, task["output"].get("code"), task["output"].get("message"))`,
    });
  }
  return tabs;
}

function buildExamples(m: Model): Tab[] {
  switch (m.kind) {
    case "text":
      return chatExamples(m);
    case "vision":
      return visionExamples(m);
    case "omni":
      return omniExamples(m);
    case "realtime":
      return realtimeExamples(m);
    case "embedding":
      return embeddingExamples(m);
    default: // image | video | tts | asr | rerank
      return dashscopeExamples(m);
  }
}

// ─── Component ──────────────────────────────────────────────────────────────
export default function ModelExplorer(): React.ReactElement {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Only show feature chips that actually occur in the dataset.
  const availableFeatures = useMemo(() => {
    const present = new Set<string>();
    MODELS.forEach((m) => m.features.forEach((f) => present.add(f)));
    return FEATURE_ORDER.filter((f) => present.has(f));
  }, []);

  const toggle = (f: string) =>
    setActive((prev) => {
      const next = new Set(prev);
      next.has(f) ? next.delete(f) : next.add(f);
      return next;
    });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MODELS.filter((m) => {
      for (const f of active) if (!m.features.includes(f)) return false;
      if (!q) return true;
      const hay = `${m.id} ${m.group} ${m.category} ${m.features.join(" ")}`.toLowerCase();
      return hay.includes(q);
    });
  }, [query, active]);

  // Group filtered results by category → group for display.
  const grouped = useMemo(() => {
    const byCat = new Map<string, Map<string, Model[]>>();
    for (const m of filtered) {
      if (!byCat.has(m.category)) byCat.set(m.category, new Map());
      const g = byCat.get(m.category)!;
      if (!g.has(m.group)) g.set(m.group, []);
      g.get(m.group)!.push(m);
    }
    return byCat;
  }, [filtered]);

  return (
    <div className={styles.explorer}>
      <div className={styles.controls}>
        <input
          className={styles.search}
          type="search"
          placeholder="モデル名・機能で検索（例: vision、qwen-coder、思考）"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="モデル検索"
        />
        <div className={styles.chips}>
          {availableFeatures.map((f) => (
            <button
              key={f}
              type="button"
              className={`${styles.chip} ${active.has(f) ? styles.chipActive : ""}`}
              onClick={() => toggle(f)}
              aria-pressed={active.has(f)}
            >
              {FEATURE_LABELS[f] ?? f}
            </button>
          ))}
          {active.size > 0 && (
            <button type="button" className={styles.clear} onClick={() => setActive(new Set())}>
              条件をクリア
            </button>
          )}
        </div>
        <div className={styles.count}>{filtered.length} 件のモデル</div>
      </div>

      <div className={styles.results}>
        {[...grouped.entries()].map(([cat, groups]) => (
          <div key={cat} className={styles.catBlock}>
            <div className={styles.catTitle}>{cat}</div>
            {[...groups.entries()].map(([group, models]) => (
              <div key={group} className={styles.groupBlock}>
                <div className={styles.groupTitle}>{group}</div>
                {models.map((m) => {
                  const open = expandedId === m.id;
                  return (
                    <div key={m.id} className={`${styles.rowWrap} ${open ? styles.rowWrapOpen : ""}`}>
                      <div className={styles.row}>
                        <code className={styles.modelId}>{m.id}</code>
                        <span className={styles.badges}>
                          {m.features.map((f) => (
                            <span key={f} className={styles.badge}>
                              {FEATURE_LABELS[f] ?? f}
                            </span>
                          ))}
                        </span>
                        {m.price && <span className={styles.price}>{m.price}</span>}
                        <button
                          type="button"
                          className={`${styles.apiBtn} ${open ? styles.apiBtnOpen : ""}`}
                          onClick={() => setExpandedId(open ? null : m.id)}
                          aria-expanded={open}
                        >
                          API参照 {open ? "▲" : "▼"}
                        </button>
                      </div>
                      {open && <ModelDetail model={m} />}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className={styles.empty}>該当するモデルがありません。検索条件を変更してください。</div>
        )}
      </div>
    </div>
  );
}

// ModelDetail renders the API parameter reference + runnable examples for one model.
export function ModelDetail({ model }: { model: Model }): React.ReactElement {
  const ref = apiRefFor(model);
  return (
    <div className={styles.detail}>
      <div className={styles.detailSection}>API パラメータ</div>
      <div className={styles.endpoint}>{ref.endpoint}</div>
      {ref.note && <p className={styles.note}>{ref.note}</p>}

      <table className={styles.paramTable}>
        <thead>
          <tr>
            <th>ヘッダー</th>
            <th>型</th>
            <th>必須</th>
            <th>説明</th>
          </tr>
        </thead>
        <tbody>
          {ref.headers.map((p) => (
            <tr key={p.name}>
              <td><code>{p.name}</code></td>
              <td>{p.type}</td>
              <td>{p.required ? "✓" : ""}</td>
              <td>{p.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <table className={styles.paramTable}>
        <thead>
          <tr>
            <th>パラメータ</th>
            <th>型</th>
            <th>必須</th>
            <th>説明</th>
          </tr>
        </thead>
        <tbody>
          {ref.params.map((p) => (
            <tr key={p.name}>
              <td><code>{p.name}</code></td>
              <td>{p.type}</td>
              <td>{p.required ? "✓" : ""}</td>
              <td>{p.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {ref.asyncTask && (
        <>
          <div className={styles.detailSection}>非同期処理（タスク照会API）</div>
          <div className={styles.endpoint}>{ref.asyncTask.pollEndpoint}</div>
          <p className={styles.note}>{ref.asyncTask.note}</p>

          <table className={styles.paramTable}>
            <thead>
              <tr>
                <th>task_status</th>
                <th>説明</th>
              </tr>
            </thead>
            <tbody>
              {ref.asyncTask.statuses.map((s) => (
                <tr key={s.status}>
                  <td><code>{s.status}</code></td>
                  <td>{s.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <table className={styles.paramTable}>
            <thead>
              <tr>
                <th>レスポンスフィールド</th>
                <th>型</th>
                <th>説明</th>
              </tr>
            </thead>
            <tbody>
              {ref.asyncTask.responseFields.map((p) => (
                <tr key={p.name}>
                  <td><code>{p.name}</code></td>
                  <td>{p.type}</td>
                  <td>{p.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <div className={styles.detailSection}>API 事例</div>
      <ExampleTabs key={model.id} tabs={buildExamples(model)} />

      {model.docUrl && (
        <a className={styles.docLink} href={model.docUrl} target="_blank" rel="noopener noreferrer">
          公式 API リファレンス ↗
        </a>
      )}
    </div>
  );
}

function ExampleTabs({ tabs }: { tabs: Tab[] }): React.ReactElement {
  const [idx, setIdx] = useState(0);
  const tab = tabs[Math.min(idx, tabs.length - 1)];
  return (
    <div className={styles.tabs}>
      <div className={styles.tabBar}>
        {tabs.map((t, i) => (
          <button
            key={t.label}
            type="button"
            className={`${styles.tabBtn} ${i === idx ? styles.tabBtnActive : ""}`}
            onClick={() => setIdx(i)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <CodeBlock language={tab.lang}>{tab.code}</CodeBlock>
    </div>
  );
}
