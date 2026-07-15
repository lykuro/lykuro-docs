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
  // 非同期タスクAPI(X-DashScope-Async: enable)の場合のタスク照会仕様。
  asyncTask?: AsyncTaskRef;
};

export type AsyncStatusRow = { status: string; desc: string };

export type AsyncTaskRef = {
  pollEndpoint: string; // method + URL(タスク照会)
  note: string;
  statuses: AsyncStatusRow[];
  // 作成レスポンス+照会レスポンスの主要フィールド
  responseFields: ApiParam[];
};

// 非同期タスク(画像・動画・音声認識)の共通仕様。resultFields には kind ごとの
// 成功時の結果フィールドを渡す。
function asyncTaskRef(resultFields: ApiParam[]): AsyncTaskRef {
  return {
    pollEndpoint: `GET ${DASHSCOPE_BASE}/tasks/{task_id}`,
    note:
      "作成リクエストは即座に task_id を返し、生成はバックグラウンドで実行されます。" +
      "タスク照会APIを数秒間隔でポーリングし、task_status が SUCCEEDED になったら結果URLを取得してください。" +
      "結果URL・task_id の有効期限は24時間です(期限内にダウンロードして保存してください)。" +
      "照会APIの認証は作成時と同じ Authorization ヘッダーのみで、X-DashScope-Async は不要です。",
    statuses: [
      { status: "PENDING", desc: "キュー待ち(未実行)" },
      { status: "RUNNING", desc: "生成処理を実行中" },
      { status: "SUCCEEDED", desc: "成功。output に結果(URL等)が入る" },
      { status: "FAILED", desc: "失敗。output.code / output.message に失敗理由" },
      { status: "CANCELED", desc: "キャンセル済み(PENDING 中のみキャンセル可)" },
      { status: "UNKNOWN", desc: "タスク不明(期限切れ・存在しない task_id)" },
    ],
    responseFields: [
      { name: "output.task_id", type: "string", desc: "タスクID。照会APIのURLパスに使用" },
      { name: "output.task_status", type: "string", desc: "タスク状態(上表のいずれか)" },
      ...resultFields,
      { name: "output.code / output.message", type: "string", desc: "FAILED 時のエラーコードと理由" },
      { name: "usage", type: "object", desc: "課金対象量(SUCCEEDED 時)。動画は `video_duration`(秒)、画像は `image_count` 等" },
      { name: "request_id", type: "string", desc: "リクエスト識別子(サポート問い合わせ時に添付)" },
    ],
  };
}

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

// 動画系モデルのサブタイプ。モデル名から判定する(t2v/i2v/kf2v/r2v/動画編集/animate)。
export type VideoSubtype = "t2v" | "i2v" | "kf2v" | "r2v" | "edit" | "animate";

export function videoSubtype(model: string): VideoSubtype {
  if (model.includes("kf2v")) return "kf2v";
  if (model.includes("i2v")) return "i2v";
  if (model.includes("r2v")) return "r2v";
  if (model.includes("video-edit") || model.includes("videoedit") || model.includes("vace")) return "edit";
  if (model.includes("animate")) return "animate";
  return "t2v";
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
        note: "DashScope ネイティブAPI（非同期）。作成レスポンスの task_id をタスク照会APIに渡して結果画像URLを取得します（下の「非同期処理」参照）。",
        params: [
          { name: "model", type: "string", required: true, desc: "モデル名。例: `" + m.model + "`" },
          { name: "input.prompt", type: "string", required: true, desc: "生成プロンプト。日本語可、最大800文字程度。描きたい主題・スタイル・構図を具体的に" },
          { name: "input.negative_prompt", type: "string", desc: "描きたくない要素（例: `低品質, ぼやけ, 文字`）。最大500文字程度" },
          { name: "parameters.size", type: "string", desc: "出力解像度 `幅*高さ`。例: `1024*1024`（デフォルト）、`1280*720`、`720*1280`" },
          { name: "parameters.n", type: "integer", desc: "生成枚数。1〜4（デフォルト 1）。枚数分課金されます" },
          { name: "parameters.seed", type: "integer", desc: "乱数シード（0〜2147483647）。同一プロンプト+同一シードで再現性を確保" },
          { name: "parameters.prompt_extend", type: "boolean", desc: "プロンプトの自動拡張（LLMによる詳細化）。デフォルト true。忠実に従わせたい場合は false" },
          { name: "parameters.watermark", type: "boolean", desc: "生成画像への「AI生成」透かし付与。デフォルト false" },
        ],
        asyncTask: asyncTaskRef([
          { name: "output.results[].url", type: "string", desc: "SUCCEEDED 時: 生成画像のURL（n 枚分の配列。有効期限24時間）" },
        ]),
      };

    case "video": {
      const sub = videoSubtype(m.model);
      const isHHNote = m.model.startsWith("happyhorse")
        ? "HappyHorse 系は入力メディアを `input.media`（url を持つオブジェクトの配列）で指定し、`parameters` はオブジェクト自体が必須です（指定なしでも `{}` を送る）。"
        : "";
      const noteBySub: Record<VideoSubtype, string> = {
        t2v: "テキスト→動画: prompt の記述から動画を生成します。",
        i2v: m.model.startsWith("happyhorse")
          ? "画像→動画: `media` の画像を先頭フレームとして、prompt の指示どおりに動かした動画を生成します。"
          : "画像→動画: `img_url` の画像を先頭フレームとして、prompt の指示どおりに動かした動画を生成します。",
        kf2v: "先頭・末尾フレーム→動画: `first_frame_url` と `last_frame_url` の2枚の画像をつなぐ中間の動きを補間した動画を生成します。",
        r2v: m.model.startsWith("happyhorse")
          ? "参照→動画: `media` の参照画像の人物・キャラクターの外観を維持したまま、prompt のシーン・動きで動画を生成します。"
          : "参照→動画: `ref_images_url` の参照画像の人物・キャラクターの外観を維持したまま、prompt のシーン・動きで動画を生成します。",
        edit: m.model.startsWith("happyhorse")
          ? "動画編集: `media` の入力動画を prompt の指示（スタイル変換・要素の追加/削除・背景差し替え等）で編集した動画を生成します。出力の長さは入力動画に従います。"
          : "動画編集: `video_url` の入力動画を prompt の指示（スタイル変換・要素の追加/削除・背景差し替え等）で編集した動画を生成します。出力の長さは入力動画に従います。",
        animate: m.model.includes("mix")
          ? "動画人物差し替え: `video_url` の動画内の人物を、`image_url` のキャラクター画像の外観に差し替えた動画を生成します。"
          : "画像→アクション動画: `image_url` のキャラクター画像を、`video_url` の動作参照動画の動きで動かした動画を生成します。",
      };
      // HappyHorse 1.0 系は入力メディアを input.media（{"url": ...} の配列）で
      // 受け取る独自スキーマ(2026-07-15 実機検証)。Wan 系は公開 DashScope 仕様
      // (img_url 等)に従う。
      const isHH = m.model.startsWith("happyhorse");
      const hhInputBySub: Partial<Record<VideoSubtype, ApiParam[]>> = {
        i2v: [
          { name: "input.media", type: "array", required: true, desc: "先頭フレームにする入力画像。`[{\"url\": \"https://...\"}]` 形式（要素は url を持つオブジェクト）。公開URLのみ。アスペクト比は出力動画に引き継がれます" },
          { name: "input.prompt", type: "string", desc: "動きの指示プロンプト。日本語可、最大800文字程度（省略時は画像内容から自動推定）" },
        ],
        r2v: [
          { name: "input.media", type: "array", required: true, desc: "参照画像。`[{\"url\": \"https://...\"}, ...]` 形式（1〜複数枚）。人物・キャラクターの外観がこの画像に一致するよう維持されます" },
          { name: "input.prompt", type: "string", desc: "シーン・動きの指示プロンプト。参照画像の被写体をどう動かすかを記述（推奨）" },
        ],
        edit: [
          { name: "input.media", type: "array", required: true, desc: "編集対象・参照素材。`[{\"url\": \"https://...\", \"type\": \"video\"}]` 形式（各要素は url と type が必須。type 例: `video`=編集対象動画 / `image`=参照画像）" },
          { name: "input.prompt", type: "string", required: true, desc: "編集指示。例: 「背景を夜の街に差し替える」「アニメ調に変換する」" },
        ],
      };
      const wanInputBySub: Record<VideoSubtype, ApiParam[]> = {
        t2v: [
          { name: "input.prompt", type: "string", required: true, desc: "生成プロンプト。日本語可、最大800文字程度。被写体・動き・カメラワーク・スタイルを具体的に" },
        ],
        i2v: [
          { name: "input.img_url", type: "string", required: true, desc: "先頭フレームにする入力画像。公開URL または `data:image/png;base64,...`。形式: JPEG/PNG/BMP/WEBP、10MB以下。アスペクト比は出力動画に引き継がれます" },
          { name: "input.prompt", type: "string", desc: "動きの指示プロンプト。日本語可、最大800文字程度（省略時は画像内容から自動推定）。例: 「カメラをゆっくり右にパンしながら人物が振り返る」" },
        ],
        kf2v: [
          { name: "input.first_frame_url", type: "string", required: true, desc: "先頭フレームにする画像URL。形式: JPEG/PNG/BMP/WEBP、10MB以下" },
          { name: "input.last_frame_url", type: "string", required: true, desc: "末尾フレームにする画像URL。先頭フレームと同じアスペクト比を推奨" },
          { name: "input.prompt", type: "string", desc: "2枚の間の動き・変化の指示（省略時は自動補間）" },
        ],
        r2v: [
          { name: "input.ref_images_url", type: "array", required: true, desc: "参照画像URLの配列（1〜複数枚）。人物・キャラクターの外観がこの画像に一致するよう維持されます" },
          { name: "input.prompt", type: "string", required: true, desc: "シーン・動きの指示プロンプト。参照画像の被写体をどう動かすかを記述" },
        ],
        edit: [
          { name: "input.video_url", type: "string", required: true, desc: "編集対象の入力動画URL（MP4等）。出力の長さ・アスペクト比は入力に従います" },
          { name: "input.prompt", type: "string", required: true, desc: "編集指示。例: 「背景を夜の街に差し替える」「アニメ調に変換する」" },
          { name: "input.ref_images_url", type: "array", desc: "編集の参照画像URLの配列（差し替え先の素材等、対応モデルのみ）" },
        ],
        animate: [
          { name: "input.image_url", type: "string", required: true, desc: "キャラクター画像URL（動かしたい/差し替えたい人物の外観）" },
          { name: "input.video_url", type: "string", required: true, desc: "動作参照動画URL（この動画の動き・ポーズを適用）" },
        ],
      };
      const inputBySub: Record<VideoSubtype, ApiParam[]> = {
        ...wanInputBySub,
        ...(isHH ? hhInputBySub : {}),
      };
      // 生成系(t2v/i2v/kf2v/r2v)は長さ・解像度を指定、編集系(edit/animate)は入力動画に従う。
      const generative = sub === "t2v" || sub === "i2v" || sub === "kf2v" || sub === "r2v";
      return {
        endpoint: `POST ${DASHSCOPE_BASE}/services/aigc/video-generation/video-synthesis`,
        headers: [
          AUTH_HEADER,
          JSON_HEADER,
          { name: "X-DashScope-Async", type: "string", required: true, desc: "`enable`（非同期タスクとして実行）" },
        ],
        note: `DashScope ネイティブAPI（非同期）。${noteBySub[sub]}${isHHNote}生成には数十秒〜数分かかるため、結果はタスク照会APIで取得します（下の「非同期処理」参照）。`,
        params: [
          { name: "model", type: "string", required: true, desc: "モデル名。例: `" + m.model + "`" },
          ...inputBySub[sub],
          { name: "input.negative_prompt", type: "string", desc: "避けたい要素（例: `モザイク, 手ぶれ, 文字`）。最大500文字程度" },
          ...(generative
            ? [
                { name: "parameters.resolution", type: "string", desc: "解像度: `480P` / `720P` / `1080P`（対応値はモデルによる）。秒単価が解像度で変わるモデルがあります（単価はモデル一覧参照）" },
                { name: "parameters.duration", type: "integer", desc: "動画の長さ（秒）。通常 5 または 10（デフォルト 5）。課金は「出力秒数 × 単価」" },
              ]
            : [
                { name: "parameters.resolution", type: "string", desc: "出力解像度（対応モデルのみ。省略時は入力動画に従う）。課金は「出力秒数 × 単価」" },
              ]),
          { name: "parameters.prompt_extend", type: "boolean", desc: "プロンプトの自動拡張（LLMによる詳細化）。デフォルト true。指示に忠実に従わせたい場合は false" },
          { name: "parameters.seed", type: "integer", desc: "乱数シード（0〜2147483647）。同一入力+同一シードで再現性を確保" },
          { name: "parameters.watermark", type: "boolean", desc: "生成動画への「AI生成」透かし付与。デフォルト false" },
        ],
        asyncTask: asyncTaskRef([
          { name: "output.video_url", type: "string", desc: "SUCCEEDED 時: 生成動画（MP4）のURL。有効期限24時間" },
        ]),
      };
    }

    case "tts":
      return {
        endpoint: `POST ${DASHSCOPE_BASE}/services/aigc/multimodal-generation/generation`,
        headers: [AUTH_HEADER, JSON_HEADER],
        note: "DashScope ネイティブAPI（同期）。レスポンスの `output.audio.url` に音声ファイル（WAV）のURLが返ります（有効期限24時間。期限内にダウンロードして保存してください）。",
        params: [
          { name: "model", type: "string", required: true, desc: "モデル名。例: `" + m.model + "`" },
          { name: "input.text", type: "string", required: true, desc: "読み上げるテキスト（最大512トークン程度。課金はテキストのトークン数）" },
          { name: "input.voice", type: "string", desc: "話者（音色）。例: `Cherry` / `Serena` / `Ethan` / `Chelsie`（対応話者はモデルによる）" },
          { name: "parameters.language_type", type: "string", desc: "言語の指定（対応モデルのみ）。例: `Japanese`。省略時は自動判定" },
          { name: "parameters.stream", type: "boolean", desc: "SSEストリーミングで音声チャンクを逐次受信（対応モデルのみ）" },
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
        note: "DashScope ネイティブAPI（非同期）。音声ファイルを文字起こし（モデルにより翻訳）します。結果はタスク照会APIで取得します（下の「非同期処理」参照）。",
        params: [
          { name: "model", type: "string", required: true, desc: "モデル名。例: `" + m.model + "`" },
          { name: "input.file_urls", type: "array", required: true, desc: "音声ファイルの公開URLの配列（複数ファイルを一括処理可）。形式: WAV/MP3/MP4/AAC/OPUS 等、1ファイル2GB以下" },
          { name: "parameters.language_hints", type: "array", desc: "言語ヒント。例: `[\"ja\", \"en\"]`。指定すると認識精度が向上" },
          { name: "parameters.channel_id", type: "array", desc: "処理対象の音声チャンネル。例: `[0]`（デフォルト。モノラル/左チャンネル）" },
          { name: "parameters.diarization_enabled", type: "boolean", desc: "話者分離（対応モデルのみ）。デフォルト false" },
        ],
        asyncTask: asyncTaskRef([
          { name: "output.results[].transcription_url", type: "string", desc: "SUCCEEDED 時: 文字起こし結果（JSON）のURL。file_urls と同順の配列。有効期限24時間" },
          { name: "output.results[].subtask_status", type: "string", desc: "ファイル単位の成否（一部ファイルのみ失敗することがあります）" },
        ]),
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
