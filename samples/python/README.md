# Python サンプル

```bash
cp .env.example .env        # LYKURO_API_KEY を記入
pip install -r requirements.txt

python chat.py              # 基本のチャット補完
python streaming.py         # ストリーミング
python function_calling.py  # Function Calling
python manga_manual.py      # 文字マニュアル→漫画風マニュアル（テキスト生成＋画像生成＋ビジョン）
```

`manga_manual.py` は同梱の `manga_manual.txt`（文字だけの操作マニュアル）を読み込み、
コマ割り画像を生成して `out/manga.html`（漫画版）を出力します。詳細は
[Cookbook: 漫画風マニュアル生成](https://docs.lykuro.ai/docs/cookbook/manga-manual) を参照。

入力と生成結果のサンプルは [`example/index.html`](./example/index.html) にまとめています
（ブラウザで開くと、文字マニュアルと漫画版を並べて確認できます。API キー不要）。

`LYKURO_BASE_URL` を変えると上流を切り替えられます。

- DeepSeek: `https://api.lykuro.ai/deepseek/v1`（`model=deepseek-chat`）
- Qwen: `https://api.lykuro.ai/alibaba/compatible-mode/v1`（`model=qwen-turbo` など）
