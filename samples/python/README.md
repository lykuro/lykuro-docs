# Python サンプル

```bash
cp .env.example .env        # LYKURO_API_KEY を記入
pip install -r requirements.txt

python chat.py              # 基本のチャット補完
python streaming.py         # ストリーミング
python function_calling.py  # Function Calling
```

`LYKURO_BASE_URL` を変えると上流を切り替えられます。

- DeepSeek: `https://api.lykuro.ai/deepseek/v1`（`model=deepseek-chat`）
- Qwen: `https://api.lykuro.ai/alibaba/compatible-mode/v1`（`model=qwen-turbo` など）
