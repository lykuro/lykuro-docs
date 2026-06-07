"""Function Calling（ツール呼び出し）サンプル。"""
import json
import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

# Function Calling は Qwen 系が扱いやすいので Alibaba をデフォルトに
client = OpenAI(
    api_key=os.environ["LYKURO_API_KEY"],
    base_url="https://api.lykuro.ai/alibaba/compatible-mode/v1",
)

TOOLS = [{
    "type": "function",
    "function": {
        "name": "get_weather",
        "description": "指定した都市の現在の天気を取得する",
        "parameters": {
            "type": "object",
            "properties": {"city": {"type": "string", "description": "都市名"}},
            "required": ["city"],
        },
    },
}]


def get_weather(city: str) -> str:
    # 本来は外部APIを呼ぶ。ここではダミー値を返す。
    return json.dumps({"city": city, "weather": "晴れ", "temp_c": 22}, ensure_ascii=False)


def main() -> None:
    messages = [{"role": "user", "content": "東京と大阪の天気を教えて。"}]

    resp = client.chat.completions.create(model="qwen-plus", messages=messages, tools=TOOLS)
    msg = resp.choices[0].message
    messages.append(msg)

    for call in msg.tool_calls or []:
        args = json.loads(call.function.arguments)
        result = get_weather(**args)
        messages.append({"role": "tool", "tool_call_id": call.id, "content": result})

    final = client.chat.completions.create(model="qwen-plus", messages=messages, tools=TOOLS)
    print(final.choices[0].message.content)


if __name__ == "__main__":
    main()
