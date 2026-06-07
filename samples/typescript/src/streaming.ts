// ストリーミング（SSE）サンプル。
// 実行: npm run streaming
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.LYKURO_API_KEY,
  baseURL: process.env.LYKURO_BASE_URL ?? "https://api.lykuro.ai/deepseek/v1",
});

const stream = await client.chat.completions.create({
  model: "deepseek-chat",
  messages: [{ role: "user", content: "春をテーマに俳句を3つ作ってください。" }],
  stream: true,
});

for await (const chunk of stream) {
  const delta = chunk.choices[0]?.delta?.content;
  if (delta) process.stdout.write(delta);
}
process.stdout.write("\n");
