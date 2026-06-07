"""ストリーミング（SSE）サンプル。"""
import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(
    api_key=os.environ["LYKURO_API_KEY"],
    base_url=os.environ.get("LYKURO_BASE_URL", "https://api.lykuro.ai/deepseek/v1"),
)


def main() -> None:
    stream = client.chat.completions.create(
        model="deepseek-chat",
        messages=[{"role": "user", "content": "春をテーマに俳句を3つ作ってください。"}],
        stream=True,
    )
    for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            print(delta, end="", flush=True)
    print()


if __name__ == "__main__":
    main()
