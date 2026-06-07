// API parameter reference per model kind — the "API参考" content shown when a model's
// 「API例」button is opened. Endpoints mirror the proxy routes in config/models.yaml.

export type ApiParam = {
  name: string;
  type: string;
  required?: boolean;
  desc: string;
};

export type ApiRef = {
  endpoint: string; // method + URL
  headers: ApiParam[];
  params: ApiParam[]; // request body / query parameters
  note?: string;
};

type ModelLike = {
  provider: string;
  model: string;
  kind: string;
  features: string[];
};

const OPENAI_BASE: Record<string, string> = {
  deepseek: "https://api.lykuro.ai/deepseek/v1",
  alibaba: "https://api.lykuro.ai/alibaba/compatible-mode/v1",
};
const WS_BASE = "wss://api.lykuro.ai/alibaba/api-ws/v1/realtime";
const DASHSCOPE_BASE = "https://api.lykuro.ai/alibaba/api/v1";

const AUTH_HEADER: ApiParam = {
  name: "Authorization",
  type: "string",
  required: true,
  desc: "Bearer 形式の Lykuro APIキー（例: `Bearer sk-jp-...`）",
};
const JSON_HEADER: ApiParam = {
  name: "Content-Type",
  type: "string",
  required: true,
  desc: "`application/json`",
};

// Shared OpenAI-compatible chat/completions request parameters.
function chatParams(m: ModelLike): ApiParam[] {
  const params: ApiParam[] = [
    { name: "model", type: "string", required: true, desc: "モデル名（スラッシュ以降）。例: `" + m.model + "`" },
    { name: "messages", type: "array", required: true, desc: "会話メッセージ配列。各要素は `role`(system/user/assistant) と `content`" },
    { name: "stream", type: "boolean", desc: "`true` で SSE ストリーミング応答（デフォルト false）" },
    { name: "stream_options", type: "object", desc: "`{\"include_usage\": true}` で最終チャンクに usage を含める" },
    { name: "max_tokens", type: "integer", desc: "生成する最大出力トークン数" },
    { name: "temperature", type: "number", desc: "0〜2。大きいほどランダム（デフォルト 1.0）" },
    { name: "top_p", type: "number", desc: "核サンプリング。0〜1" },
    { name: "presence_penalty", type: "number", desc: "-2〜2。既出トークンの再出現を抑制" },
    { name: "frequency_penalty", type: "number", desc: "-2〜2。頻出トークンを抑制" },
    { name: "stop", type: "string | array", desc: "生成を停止する文字列" },
    { name: "seed", type: "integer", desc: "再現性のための乱数シード" },
  ];
  if (m.features.includes("tools")) {
    params.push(
      { name: "tools", type: "array", desc: "Function Calling のツール定義（`type: \"function\"`）" },
      { name: "tool_choice", type: "string | object", desc: "`auto` / `none` / 特定関数の指定" },
    );
  }
  if (m.features.includes("json")) {
    params.push({ name: "response_format", type: "object", desc: "`{\"type\": \"json_object\"}` で JSON 出力を強制" });
  }
  if (m.features.includes("thinking")) {
    if (m.provider === "deepseek") {
      params.push({ name: "thinking", type: "object", desc: "思考モード切替。`{\"type\": \"enabled\"}`（extra_body 経由）" });
    } else {
      params.push(
        { name: "enable_thinking", type: "boolean", desc: "思考モードを有効化（extra_body 経由）" },
        { name: "thinking_budget", type: "integer", desc: "思考に使う最大トークン数（extra_body 経由）" },
      );
    }
  }
  return params;
}

export function apiRefFor(m: ModelLike): ApiRef {
  const openai = OPENAI_BASE[m.provider] ?? OPENAI_BASE.alibaba;

  switch (m.kind) {
    case "text":
      return {
        endpoint: `POST ${openai}/chat/completions`,
        headers: [AUTH_HEADER, JSON_HEADER],
        params: chatParams(m),
      };

    case "vision":
      return {
        endpoint: `POST ${openai}/chat/completions`,
        headers: [AUTH_HEADER, JSON_HEADER],
        note: "`messages[].content` は配列で指定し、`{\"type\": \"image_url\", \"image_url\": {\"url\": ...}}` と `{\"type\": \"text\", \"text\": ...}` を組み合わせます。画像は URL または `data:` base64。",
        params: [
          ...chatParams(m),
          { name: "vl_high_resolution_images", type: "boolean", desc: "高解像度画像入力を有効化（対応モデルのみ）" },
        ],
      };

    case "omni":
      return {
        endpoint: `POST ${openai}/chat/completions`,
        headers: [AUTH_HEADER, JSON_HEADER],
        note: "テキスト・画像・音声・動画を `messages[].content` の配列で混在指定できます。音声出力時は `stream: true` が必要です。",
        params: [
          ...chatParams(m),
          { name: "modalities", type: "array", desc: "出力モダリティ。例: `[\"text\", \"audio\"]`" },
          { name: "audio", type: "object", desc: "音声出力設定。例: `{\"voice\": \"Cherry\", \"format\": \"wav\"}`" },
        ],
      };

    case "realtime":
      return {
        endpoint: `WSS ${WS_BASE}?model=${m.model}`,
        headers: [AUTH_HEADER],
        note: "WebSocket 接続後、イベント駆動でやり取りします。主なクライアントイベント: `session.update` / `input_audio_buffer.append` / `input_audio_buffer.commit` / `response.create`。",
        params: [
          { name: "model", type: "string (query)", required: true, desc: "接続URLの `?model=` で指定" },
          { name: "session.modalities", type: "array", desc: "`[\"text\", \"audio\"]` など" },
          { name: "session.voice", type: "string", desc: "音声合成の話者" },
          { name: "session.input_audio_format", type: "string", desc: "入力音声形式。例: `pcm16`（16kHz）" },
          { name: "session.output_audio_format", type: "string", desc: "出力音声形式。例: `pcm16`（24kHz）" },
          { name: "session.instructions", type: "string", desc: "システム指示（人格・タスク）" },
          { name: "session.turn_detection", type: "object", desc: "VAD による発話区切り設定" },
        ],
      };

    case "embedding":
      return {
        endpoint: `POST ${openai}/embeddings`,
        headers: [AUTH_HEADER, JSON_HEADER],
        params: [
          { name: "model", type: "string", required: true, desc: "モデル名。例: `" + m.model + "`" },
          { name: "input", type: "string | array", required: true, desc: "ベクトル化するテキスト（複数可）" },
          { name: "dimensions", type: "integer", desc: "出力ベクトルの次元数（対応モデルのみ）" },
          { name: "encoding_format", type: "string", desc: "`float`（デフォルト）または `base64`" },
        ],
      };

    case "image":
      return {
        endpoint: `POST ${DASHSCOPE_BASE}/services/aigc/text2image/image-synthesis`,
        headers: [
          AUTH_HEADER,
          JSON_HEADER,
          { name: "X-DashScope-Async", type: "string", required: true, desc: "`enable`（非同期タスクとして実行）" },
        ],
        note: "DashScope ネイティブAPI。非同期タスクIDを受け取り、タスク照会APIで結果を取得します。",
        params: [
          { name: "model", type: "string", required: true, desc: "モデル名。例: `" + m.model + "`" },
          { name: "input.prompt", type: "string", required: true, desc: "生成プロンプト" },
          { name: "input.negative_prompt", type: "string", desc: "ネガティブプロンプト" },
          { name: "parameters.size", type: "string", desc: "画像サイズ。例: `1024*1024`" },
          { name: "parameters.n", type: "integer", desc: "生成枚数" },
          { name: "parameters.seed", type: "integer", desc: "乱数シード" },
        ],
      };

    case "video":
      return {
        endpoint: `POST ${DASHSCOPE_BASE}/services/aigc/video-generation/video-synthesis`,
        headers: [
          AUTH_HEADER,
          JSON_HEADER,
          { name: "X-DashScope-Async", type: "string", required: true, desc: "`enable`（非同期タスクとして実行）" },
        ],
        note: "DashScope ネイティブAPI（非同期）。`img_url` を与えると画像→動画（i2v）になります。",
        params: [
          { name: "model", type: "string", required: true, desc: "モデル名。例: `" + m.model + "`" },
          { name: "input.prompt", type: "string", desc: "生成プロンプト（t2v）" },
          { name: "input.img_url", type: "string", desc: "入力画像URL（i2v）" },
          { name: "parameters.resolution", type: "string", desc: "解像度。例: `720P`" },
          { name: "parameters.duration", type: "integer", desc: "動画の長さ（秒）" },
        ],
      };

    case "tts":
      return {
        endpoint: `POST ${DASHSCOPE_BASE}/services/aigc/multimodal-generation/generation`,
        headers: [AUTH_HEADER, JSON_HEADER],
        note: "DashScope ネイティブAPI。音声URL（または base64）を返します。",
        params: [
          { name: "model", type: "string", required: true, desc: "モデル名。例: `" + m.model + "`" },
          { name: "input.text", type: "string", required: true, desc: "読み上げるテキスト" },
          { name: "input.voice", type: "string", desc: "話者（音色）。例: `Cherry`" },
          { name: "parameters.language_type", type: "string", desc: "言語の指定（対応モデルのみ）" },
        ],
      };

    case "asr":
      return {
        endpoint: `POST ${DASHSCOPE_BASE}/services/audio/asr/transcription`,
        headers: [
          AUTH_HEADER,
          JSON_HEADER,
          { name: "X-DashScope-Async", type: "string", required: true, desc: "`enable`（ファイル文字起こしは非同期）" },
        ],
        note: "DashScope ネイティブAPI。音声ファイルを文字起こし（モデルにより翻訳）します。",
        params: [
          { name: "model", type: "string", required: true, desc: "モデル名。例: `" + m.model + "`" },
          { name: "input.file_urls", type: "array", required: true, desc: "音声ファイルURLの配列" },
          { name: "parameters.language_hints", type: "array", desc: "言語ヒント。例: `[\"ja\", \"en\"]`" },
        ],
      };

    default: // rerank
      return {
        endpoint: `POST ${DASHSCOPE_BASE}/services/rerank/text-rerank/text-rerank`,
        headers: [AUTH_HEADER, JSON_HEADER],
        note: "DashScope ネイティブAPI。クエリに対する文書の関連度スコアを返します。",
        params: [
          { name: "model", type: "string", required: true, desc: "モデル名。例: `" + m.model + "`" },
          { name: "input.query", type: "string", required: true, desc: "検索クエリ" },
          { name: "input.documents", type: "array", required: true, desc: "並べ替える文書の配列" },
          { name: "parameters.top_n", type: "integer", desc: "返す上位件数" },
          { name: "parameters.return_documents", type: "boolean", desc: "結果に文書本文を含めるか" },
        ],
      };
  }
}
