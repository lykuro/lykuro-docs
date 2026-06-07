"""最小のチャット補完サンプル。"""
import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(
    api_key=os.environ["LYKURO_API_KEY"],
    base_url=os.environ.get("LYKURO_BASE_URL", "https://api.lykuro.ai/deepseek/v1"),
)


def main() -> None:
    resp = client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": "あなたは親切な日本語アシスタントです。"},
            {"role": "user", "content": "Lykuro AI を一言で紹介して。"},
        ],
    )
    print(resp.choices[0].message.content)
    print("---")
    print("usage:", resp.usage)


if __name__ == "__main__":
    main()
