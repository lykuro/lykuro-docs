# TypeScript (Node) サンプル

Node.js 20+ 推奨。`tsx` で直接実行します。`.env` は `--env-file` で読み込みます。

```bash
cp .env.example .env   # LYKURO_API_KEY を記入
npm install

node --env-file=.env node_modules/.bin/tsx src/chat.ts       # チャット
node --env-file=.env node_modules/.bin/tsx src/streaming.ts   # ストリーミング
```

`npm run chat` / `npm run streaming` でも実行できます（その場合は環境変数を別途エクスポートしてください）。
