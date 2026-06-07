---
id: langchain
title: LangChain 統合ガイド
sidebar_position: 3
---

# LangChain 統合ガイド

`openai_api_base` を Lykuro の base_url に、`model` を上流ネイティブ名に設定します。

## Python (langchain-openai)

```python
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    model="deepseek-chat",
    openai_api_key="sk-jp-YOUR_KEY",
    openai_api_base="https://api.lykuro.ai/deepseek/v1",
)

response = llm.invoke("東京の人口は？")
print(response.content)
```

## RAG パイプライン例

```python
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.chains import RetrievalQA

# Embeddings も Lykuro AI を使用（上流が embeddings 対応の場合）
embeddings = OpenAIEmbeddings(
    openai_api_key="sk-jp-YOUR_KEY",
    openai_api_base="https://api.lykuro.ai/alibaba/compatible-mode/v1",
)

vectorstore = FAISS.from_texts(["ドキュメント1", "ドキュメント2"], embeddings)

llm = ChatOpenAI(
    model="qwen-turbo",
    openai_api_key="sk-jp-YOUR_KEY",
    openai_api_base="https://api.lykuro.ai/alibaba/compatible-mode/v1",
)

qa_chain = RetrievalQA.from_chain_type(llm=llm, retriever=vectorstore.as_retriever())
result = qa_chain.invoke("ドキュメントの内容は？")
print(result["result"])
```

## Node.js (langchain)

```typescript
import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI({
  modelName: "deepseek-chat",
  openAIApiKey: process.env.LYKURO_API_KEY,
  configuration: { baseURL: "https://api.lykuro.ai/deepseek/v1" },
});

const response = await model.invoke("こんにちは！");
console.log(response.content);
```
