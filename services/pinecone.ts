// PineconeDB
import { PineconeClient as _PineconeClient } from "@pinecone-database/pinecone";

import type { Vector } from "@pinecone-database/pinecone";
export type { Vector } from "@pinecone-database/pinecone";
import type { VectorOperationsApi } from "@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch";

import type { DBClient } from "./db.interface";
export async function getPineconeClient() {
  // todo: init once
  const pinecone = new _PineconeClient();
  await pinecone.init({
    environment: process.env.PINECONE_ENVIRONMENT!,
    apiKey: process.env.PINECONE_API_KEY!,
  });
  return pinecone;
}

export class PineconeClient implements DBClient {
  client: _PineconeClient;
  index: VectorOperationsApi;

  constructor(client: _PineconeClient, index: VectorOperationsApi) {
    this.client = client;
    this.index = index;
  }

  /** An async-constructor helper */
  static async init({ indexName }: { indexName: string }) {
    const client = await getPineconeClient();
    const index = client.Index(indexName);
    return new PineconeClient(client, index);
  }

  async query({ vector }: { vector: number[] }) {
    const queryResponse = await this.index.query({
      queryRequest: {
        vector,
        topK: 10,
        includeMetadata: true,
        includeValues: false, // we don't need the actual vectors, just the text, which is stored in metadata
      },
    });

    return (
      queryResponse.matches?.map((match) => ({
        id: match.id,
        metadata: (match.metadata ?? {}) as Record<string, string>,
      })) ?? []
    );
  }

  /** returns upserted count */
  async upsert({ vectors }: { vectors: Vector[] }) {
    const upsertResult = await this.index.upsert({
      upsertRequest: {
        vectors,
      },
    });
    return upsertResult.upsertedCount!;
  }

  async delete({ ids }: { ids: string[] }) {
    const deleteResult = await this.index.delete1({
      ids,
    });
    return deleteResult;
  }

  static async createIndex({ indexName }: { indexName: string }) {
    const client = await getPineconeClient();
    await client.createIndex({
      createRequest: {
        dimension: 1536,
        name: indexName,
        metric: "cosine",
      },
    });
  }

  async clearIndex(indexName: string) {
    console.log("clear...", indexName);
    await this.index._delete({
      deleteRequest: {
        deleteAll: true,
      },
    });
    console.log("cleared", indexName);
  }
}
