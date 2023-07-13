import { PineconeClient, type Vector } from "../services/pinecone";

// env var setup
import dotenv from "dotenv";
dotenv.config();

// Main Script
// node --loader ts-node/esm ./scripts/clear.ts
async function main() {
  const pinecone = await PineconeClient.init();
  await pinecone.resetIndex(
    process.env.INDEX_NAME!,
    process.env.INDEX_NAMESPACE!
  );
}

main();
