// 最小のチャット補完サンプル。
// 実行: npm run chat
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.LYKURO_API_KEY,
  baseURL: process.env.LYKURO_BASE_URL ?? "https://api.lykuro.ai/deepseek/v1",
});

const resp = await client.chat.completions.create({
  model: "deepseek-chat",
  messages: [
    { role: "system", content: "あなたは親切な日本語アシスタントです。" },
    { role: "user", content: "Lykuro AI を一言で紹介して。" },
  ],
});

console.log(resp.choices[0].message.content);
console.log("---");
console.log("usage:", resp.usage);
