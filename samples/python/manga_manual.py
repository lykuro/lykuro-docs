"""文字だけの操作マニュアル → 漫画風操作マニュアル を生成するサンプルシステム。

3つの Lykuro 経由 API を組み合わせる:
  1) テキスト生成 (qwen-plus)       … マニュアルをコマ割りし、各コマの画像プロンプト・
                                       吹き出し・キャプションを JSON で設計する
  2) 画像生成 (qwen-image)          … 各コマのプロンプトから漫画風 PNG を生成する
                                       （DashScope の text2image 非同期フローを透過）
  3) ビジョン (qwen-vl-max)         … 生成画像を読み戻し、その手順を正しく描けているかを
                                       点検し、alt テキスト（説明文）を付与する

最後に全コマを並べた manga.html（漫画風マニュアル）を出力する。

使い方:
    cp .env.example .env          # LYKURO_API_KEY を記入
    pip install -r requirements.txt
    python manga_manual.py                       # 同梱の manga_manual.txt を使用
    python manga_manual.py --input your.txt --out out --max-panels 6
"""
from __future__ import annotations

import argparse
import base64
import json
import os
import pathlib
import time
from dataclasses import dataclass, field

import requests
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

# Lykuro はパスプレフィックスで上流を選ぶ透過プロキシ。
#   OpenAI 互換（テキスト/ビジョン）: /alibaba/compatible-mode/v1
#   DashScope ネイティブ（画像生成） : /alibaba/api/v1
LYKURO_ROOT = os.environ.get("LYKURO_ROOT", "https://api.lykuro.ai")
COMPAT_BASE = f"{LYKURO_ROOT}/alibaba/compatible-mode/v1"
DASHSCOPE_BASE = f"{LYKURO_ROOT}/alibaba/api/v1"

TEXT_MODEL = os.environ.get("LYKURO_TEXT_MODEL", "qwen-plus")
IMAGE_MODEL = os.environ.get("LYKURO_IMAGE_MODEL", "qwen-image")
VISION_MODEL = os.environ.get("LYKURO_VISION_MODEL", "qwen-vl-max")

API_KEY = os.environ.get("LYKURO_API_KEY")
if not API_KEY:
    raise SystemExit("環境変数 LYKURO_API_KEY が未設定です（.env.example を参照）。")

# テキスト生成・ビジョンは OpenAI SDK で。画像生成は DashScope 非同期 API を requests で叩く。
client = OpenAI(api_key=API_KEY, base_url=COMPAT_BASE)


@dataclass
class Panel:
    """1コマ分の設計と生成結果。"""

    index: int
    step_title: str
    image_prompt: str
    caption: str  # コマ下に載せる手順文
    speech: str = ""  # 吹き出しのセリフ（任意）
    image_path: str = ""  # 生成された PNG の相対パス
    alt_text: str = ""  # ビジョンが付けた説明文


# ── 1) テキスト生成: マニュアルをコマ割りする ─────────────────────────────────
PLANNER_SYSTEM = """あなたは操作マニュアルを漫画のコマ割りに変換する編集者です。
入力された操作手順を、初心者にも分かりやすい漫画のコマ列に分解してください。

各コマには次を含めます:
- step_title: そのコマで行う操作（短い見出し）
- image_prompt: 画像生成モデルへ渡す英語のプロンプト。manga / comic panel style,
  clean line art, a friendly character operating a device or screen を基調に、
  その手順の情景・UI・動作・表情を具体的に描写する
- caption: コマ下に表示する日本語の手順文（1〜2文、簡潔に）
- speech: キャラクターの吹き出しセリフ（日本語、短く。不要なら空文字）

必ず次の JSON だけを返すこと（前後の説明文・コードフェンス禁止）:
{"panels": [{"step_title": "...", "image_prompt": "...", "caption": "...", "speech": "..."}]}
"""


def plan_panels(manual_text: str, max_panels: int) -> list[Panel]:
    user = (
        f"次の操作マニュアルを、最大{max_panels}コマの漫画に分解してください。\n\n"
        f"--- マニュアル ---\n{manual_text}\n--- ここまで ---"
    )
    resp = client.chat.completions.create(
        model=TEXT_MODEL,
        messages=[
            {"role": "system", "content": PLANNER_SYSTEM},
            {"role": "user", "content": user},
        ],
        response_format={"type": "json_object"},
        temperature=0.4,
    )
    data = json.loads(resp.choices[0].message.content)
    panels: list[Panel] = []
    for i, p in enumerate(data.get("panels", [])[:max_panels], start=1):
        panels.append(
            Panel(
                index=i,
                step_title=p.get("step_title", f"Step {i}"),
                image_prompt=p.get("image_prompt", ""),
                caption=p.get("caption", ""),
                speech=p.get("speech", ""),
            )
        )
    if not panels:
        raise RuntimeError("コマ割りに失敗しました（panels が空）。")
    print(f"[1/3] テキスト生成: {len(panels)} コマに分解しました（{TEXT_MODEL}）")
    return panels


# ── 2) 画像生成: DashScope text2image 非同期フローを透過 ──────────────────────
def generate_image(prompt: str, out_path: pathlib.Path, *, size: str = "1024*1024") -> None:
    """qwen-image でコマ画像を生成し PNG を保存する。

    DashScope の text2image は「タスク作成 → ポーリング → 画像URL取得」の非同期方式。
    Lykuro は body を改変せず透過するため、上流の契約どおりに呼べる。
    """
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
        "X-DashScope-Async": "enable",  # 非同期タスクを要求
    }
    create = requests.post(
        f"{DASHSCOPE_BASE}/services/aigc/text2image/image-synthesis",
        headers=headers,
        json={
            "model": IMAGE_MODEL,
            "input": {"prompt": f"{prompt}\n\n4-koma manga panel, Japanese comic style, clean lineart"},
            "parameters": {"size": size, "n": 1},
        },
        timeout=30,
    )
    create.raise_for_status()
    task_id = create.json()["output"]["task_id"]

    # ポーリング（最大120秒）
    deadline = time.time() + 120
    while time.time() < deadline:
        time.sleep(3)
        poll = requests.get(
            f"{DASHSCOPE_BASE}/tasks/{task_id}",
            headers={"Authorization": f"Bearer {API_KEY}"},
            timeout=30,
        )
        poll.raise_for_status()
        output = poll.json()["output"]
        status = output["task_status"]
        if status == "SUCCEEDED":
            url = output["results"][0]["url"]
            img = requests.get(url, timeout=60)
            img.raise_for_status()
            out_path.write_bytes(img.content)
            return
        if status == "FAILED":
            raise RuntimeError(f"画像生成失敗: {output.get('message', 'unknown error')}")
    raise TimeoutError("画像生成がタイムアウトしました。")


# ── 3) ビジョン: 生成画像を点検し説明文を付ける ───────────────────────────────
def describe_panel(image_path: pathlib.Path, step_title: str) -> str:
    b64 = base64.b64encode(image_path.read_bytes()).decode()
    resp = client.chat.completions.create(
        model=VISION_MODEL,
        messages=[{
            "role": "user",
            "content": [
                {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64}"}},
                {"type": "text", "text": (
                    f"この漫画コマは操作手順「{step_title}」を表しています。"
                    "視覚障害者向けの代替テキスト（alt）として、1文の日本語で簡潔に説明してください。"
                )},
            ],
        }],
        temperature=0.2,
    )
    return resp.choices[0].message.content.strip()


# ── 出力: 漫画風マニュアル HTML を組版 ───────────────────────────────────────
def build_html(title: str, panels: list[Panel], out_dir: pathlib.Path) -> pathlib.Path:
    cards = []
    for p in panels:
        speech = f'<p class="speech">💬 {p.speech}</p>' if p.speech else ""
        cards.append(f"""    <figure class="panel">
      <span class="no">{p.index}</span>
      <img src="{p.image_path}" alt="{p.alt_text or p.step_title}" loading="lazy" />
      <figcaption>
        <h3>{p.step_title}</h3>
        {speech}
        <p class="caption">{p.caption}</p>
      </figcaption>
    </figure>""")
    html = f"""<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{title}（漫画版）</title>
  <style>
    body {{ font-family: system-ui, sans-serif; margin: 0; background: #f6f6f8; color: #1a1a1a; }}
    header {{ padding: 24px; text-align: center; }}
    .grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
             gap: 20px; padding: 0 24px 48px; max-width: 1100px; margin: 0 auto; }}
    .panel {{ background: #fff; border: 2px solid #111; border-radius: 8px; margin: 0;
              overflow: hidden; position: relative; box-shadow: 4px 4px 0 #111; }}
    .panel .no {{ position: absolute; top: 8px; left: 8px; background: #111; color: #fff;
                  width: 28px; height: 28px; border-radius: 50%; display: grid;
                  place-items: center; font-weight: 700; }}
    .panel img {{ width: 100%; display: block; aspect-ratio: 1; object-fit: cover; }}
    figcaption {{ padding: 12px 14px 16px; }}
    figcaption h3 {{ margin: 0 0 6px; font-size: 15px; }}
    .speech {{ background: #eef; border-radius: 12px; padding: 6px 10px; margin: 0 0 6px;
               font-size: 14px; }}
    .caption {{ margin: 0; font-size: 13px; color: #444; }}
  </style>
</head>
<body>
  <header><h1>{title}（漫画版）</h1><p>Generated with Lykuro AI</p></header>
  <main class="grid">
{chr(10).join(cards)}
  </main>
</body>
</html>
"""
    out = out_dir / "manga.html"
    out.write_text(html, encoding="utf-8")
    return out


def main() -> None:
    here = pathlib.Path(__file__).parent
    ap = argparse.ArgumentParser(description="文字マニュアル→漫画風マニュアル生成")
    ap.add_argument("--input", default=str(here / "manga_manual.txt"), help="入力マニュアル(.txt)")
    ap.add_argument("--out", default=str(here / "out"), help="出力ディレクトリ")
    ap.add_argument("--max-panels", type=int, default=6, help="最大コマ数")
    ap.add_argument("--no-vision", action="store_true", help="ビジョンによる説明付与を省略")
    args = ap.parse_args()

    manual_text = pathlib.Path(args.input).read_text(encoding="utf-8")
    title = manual_text.splitlines()[0].lstrip("# ").strip() or "操作マニュアル"
    out_dir = pathlib.Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    panels = plan_panels(manual_text, args.max_panels)

    for p in panels:
        png = out_dir / f"panel_{p.index:02d}.png"
        print(f"[2/3] 画像生成: コマ{p.index} 「{p.step_title}」 …")
        generate_image(p.image_prompt, png)
        p.image_path = png.name
        if not args.no_vision:
            p.alt_text = describe_panel(png, p.step_title)
            print(f"[3/3] ビジョン点検: {p.alt_text}")

    html_path = build_html(title, panels, out_dir)
    print(f"\n完成: {html_path}")
    print("ブラウザで開いて漫画風マニュアルを確認してください。")


if __name__ == "__main__":
    main()
