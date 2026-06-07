# Go サンプル

```bash
go mod tidy
LYKURO_API_KEY=sk-jp-YOUR_KEY go run .
```

`LYKURO_BASE_URL` で上流を切り替えられます（既定: DeepSeek）。

```bash
LYKURO_API_KEY=sk-jp-YOUR_KEY \
LYKURO_BASE_URL=https://api.lykuro.ai/alibaba/compatible-mode/v1 \
go run .
```

> 注: `model` も上流に合わせて変更してください（Qwen なら `qwen-turbo` など）。
