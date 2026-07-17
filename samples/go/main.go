// 最小のチャット補完サンプル。
// 実行: LYKURO_API_KEY=lk_live_... go run .
package main

import (
	"context"
	"fmt"
	"os"

	openai "github.com/sashabaranov/go-openai"
)

func main() {
	key := os.Getenv("LYKURO_API_KEY")
	if key == "" {
		fmt.Fprintln(os.Stderr, "LYKURO_API_KEY が未設定です")
		os.Exit(1)
	}

	cfg := openai.DefaultConfig(key)
	baseURL := os.Getenv("LYKURO_BASE_URL")
	if baseURL == "" {
		baseURL = "https://api.lykuro.ai/deepseek/v1"
	}
	cfg.BaseURL = baseURL
	client := openai.NewClientWithConfig(cfg)

	resp, err := client.CreateChatCompletion(context.Background(), openai.ChatCompletionRequest{
		Model: "deepseek-chat",
		Messages: []openai.ChatCompletionMessage{
			{Role: openai.ChatMessageRoleSystem, Content: "あなたは親切な日本語アシスタントです。"},
			{Role: openai.ChatMessageRoleUser, Content: "Lykuro AI を一言で紹介して。"},
		},
	})
	if err != nil {
		panic(err)
	}
	fmt.Println(resp.Choices[0].Message.Content)
	fmt.Printf("---\nusage: %+v\n", resp.Usage)
}
