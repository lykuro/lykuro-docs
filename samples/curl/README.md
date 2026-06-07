# cURL サンプル

```bash
chmod +x *.sh
export LYKURO_API_KEY=sk-jp-YOUR_KEY

./chat.sh        # 基本のチャット補完
./streaming.sh   # ストリーミング（SSE）
./models.sh      # 利用可能なモデル一覧
```

`LYKURO_BASE_URL` で上流を切り替えられます（既定: DeepSeek）。
