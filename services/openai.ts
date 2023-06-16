// Open AI
import { Configuration, OpenAIApi } from "openai";

export function getOpenAIClient() {
  // todo: init once
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY!,
  });
  const openai = new OpenAIApi(configuration);
  return openai;
}

export class OpenAIClient {
  openai: OpenAIApi;

  constructor() {
    this.openai = getOpenAIClient();
  }

  createEmbedding = async ({ input }: { input: string }) => {
    const createEmbeddingResponse = await this.openai.createEmbedding({
      model: "text-embedding-ada-002",
      input,
    });
    return createEmbeddingResponse.data.data[0].embedding;
  };

  createCompletion = async ({ prompt }: { prompt: string }) => {
    const createCompletionResponse = await this.openai.createCompletion({
      prompt,
      model: "text-davinci-003",
      max_tokens: 2048, // 4096 | 2048,
      temperature: 0.1,
    });
    return createCompletionResponse.data.choices[0].text;
  };
}
