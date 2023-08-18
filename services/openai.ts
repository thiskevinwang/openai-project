// Open AI
import { OpenAI } from "openai";
import { APIPromise } from "openai/src/core";
// import { APIError } from 'openai/src/error'
import type { Stream } from "openai/streaming";

export class OpenAIClient {
  openai: OpenAI;

  chatCompletionsDeployment = process.env.CHAT_COMPLETIONS_DEPLOYMENT!;
  chatCompletionsModel = process.env.CHAT_COMPLETIONS_MODEL!;
  chatCompletionsApiVersion = process.env.CHAT_COMPLETIONS_API_VERSION!;

  embeddingsDeployment = process.env.EMBEDDINGS_DEPLOYMENT!;
  embeddingsModel = process.env.EMBEDDINGS_MODEL!;
  embeddingsApiVersion = process.env.EMBEDDINGS_API_VERSION!;

  constructor() {
    this.openai = new OpenAI({
      // unused but required for the OpenAI constructor
      apiKey: "unused",
      defaultHeaders: {
        "api-key": process.env.AZURE_OPENAI_API_KEY,
      },
      baseURL: `https://${process.env.AZURE_OPENAI_NAMESPACE}.openai.azure.com/openai/deployments`,
    });
  }

  createEmbedding = async ({ input }: { input: string }) => {
    const createEmbeddingResponse = await this.openai.embeddings.create(
      {
        model: this.embeddingsModel,
        input,
      },
      {
        query: {
          "api-version": this.embeddingsApiVersion,
        },
        path: `/${this.embeddingsDeployment}/embeddings`,
      }
    );
    return createEmbeddingResponse.data[0].embedding;
  };

  createChatCompletion(opts: {
    messages: Array<OpenAI.Chat.Completions.CreateChatCompletionRequestMessage>;
    stream: true;
  }): APIPromise<Stream<OpenAI.Chat.Completions.ChatCompletionChunk>>;
  createChatCompletion(opts: {
    messages: Array<OpenAI.Chat.Completions.CreateChatCompletionRequestMessage>;
  }): APIPromise<OpenAI.Chat.Completions.ChatCompletion>;
  async createChatCompletion({
    messages,
    stream,
  }: {
    messages: Array<OpenAI.Chat.Completions.CreateChatCompletionRequestMessage>;
    stream?: true;
  }) {
    const options = {
      query: {
        "api-version": this.chatCompletionsApiVersion,
      },
      path: `/${this.chatCompletionsDeployment}/chat/completions`,
    };

    const baseBody = {
      messages: [...messages],
      model: this.chatCompletionsModel,
      max_tokens: 2048, // 4096 | 2048,
      temperature: 0.1,
    } satisfies OpenAI.Chat.Completions.CompletionCreateParamsNonStreaming;

    if (typeof stream == "undefined" || !stream) {
      return this.openai.chat.completions.create(baseBody, options);
    }
    if (stream) {
      const body = {
        ...baseBody,
        stream,
      } satisfies OpenAI.Chat.Completions.CompletionCreateParamsStreaming;

      return this.openai.chat.completions.create(body, options);
    }
  }
}
