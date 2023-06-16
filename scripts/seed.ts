import { nanoid } from "nanoid";

import { findDownAll } from "vfile-find-down";
import { read } from "to-vfile";
import { matter } from "vfile-matter";

import { OpenAIClient } from "../services/openai";
import { PineconeClient, type Vector } from "../services/pinecone";

// env var setup
import dotenv from "dotenv";
dotenv.config();

// misc configs/consts to change runtime logic
const SHOULD_SUMMARIZE = false;

// util to walk the filesystem and find all markdown files
const retrieveLocalFiles = async () => {
  const files = await findDownAll(".md", ["documents"]); // ignore top-level README.md
  return files;
};

// Main Script
// node --loader ts-node/esm ./scripts/seed.ts
async function main() {
  // Here the VFiles will only have `cwd`, `data: {}`, `history`, and `messages` properties.
  const files = await retrieveLocalFiles();

  // This step will populate the VFiles' `value` and `data.matter` properties.
  const documents = await Promise.all(
    files.map(async (file) => {
      const doc = await read(file.path, "utf8");
      // write to data.matter
      matter(doc, { strip: true });
      return doc;
    })
  );

  // instantiate our clients
  const openai = new OpenAIClient();
  const pinecone = await PineconeClient.init();

  // vectors are what we will persist to our vector db
  const vectors: Vector[] = [];

  // for each document, we will create a vector
  for (const { value, path } of documents) {
    // this step is mandatory. we use an openai model to create
    // a vector from our documents' text.
    const vectorEmbedding = await openai.createEmbedding({
      input: String(value),
    });

    // arbitrary metadata we want to associate with our vector.
    // we typically want to include the actual text of the document
    // as metadata, otherwise the vector won't be very useful.
    const metadata: { text: string; summary?: string } = {
      text: String(value),
      summary: undefined,
    };

    // this step is optional. we use an openai model to create
    // a summary of our documents' text. we include this as arbitrary
    // metadata with our vector
    if (SHOULD_SUMMARIZE) {
      const completionText = await openai.createCompletion({
        prompt: `Summarize the following markdown text in 1 paragraph.

  ${value}`,
      });

      // assign the summary to our metadata
      metadata.summary = completionText;
    }

    vectors.push({
      // id: nanoid(),
      id: path,
      values: vectorEmbedding,
      metadata,
    });
  }

  const count = await pinecone
    .index(process.env.INDEX_NAME!)
    .namespace(process.env.INDEX_NAMESPACE!)
    .upsert({ vectors });

  console.log("upserted!", count, "vector(s)");
}

main();
