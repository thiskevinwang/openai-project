// env var setup
import dotenv from "dotenv";
dotenv.config();

import { OpenAIClient } from "../services/openai.js";
import { PineconeClient } from "../services/pinecone.js";

import chalk from "chalk";

const createPrompt = (
  question: string,
  ctx: string
) => `Use the provided context delimited by triple quotes and separated by newlines to answer questions..
If the answer cannot be found in provided context, write a cat-themed apology.

"""
${ctx}
"""

Question:
${question}
`;

function getQuestionFromArgs() {
  const question = process.argv[2];
  if (!question) {
    throw new Error("question is required");
  }
  return question;
}

// node --loader ts-node/esm ./scripts/seed.ts "how many residents are there in cat-alonia?"
async function main() {
  console.log(
    chalk.magentaBright(`
  ╔═╗┌─┐┌┬┐╔═╗╔═╗╔╦╗
  ║  ├─┤ │ ║ ╦╠═╝ ║ 
  ╚═╝┴ ┴ ┴ ╚═╝╩   ╩ `)
  );
  const openai = new OpenAIClient();
  const pinecone = await PineconeClient.init();

  const question = getQuestionFromArgs();

  // convert the incoming question to a vector using OpenAI
  const vectorEmbedding = await openai.createEmbedding({
    input: question,
  });

  const matchingVectors = await pinecone
    .index(process.env.INDEX_NAME!)
    .namespace(process.env.INDEX_NAMESPACE!)
    .query({ vector: vectorEmbedding });

  // console.log("=== matching vectors ===");
  // console.log(matchingVectors);

  // create the context to be passed to OpenAI completions
  const ctx = matchingVectors
    ?.map((match) => ({
      summary: match.metadata?.summary,
      text: match.metadata?.text,
      id: match.id,
    }))
    ?.map(
      (c) => `Document: ${c.text}\nurl: https://developer.hashicorp.com${c.id}`
    ) // convert the most similar embedding vectors to summary & url pairs
    .join("\n")!; // separate each summary&url pair with a newline

  console.log("\n");
  console.log(chalk.cyan("=== question ==="));
  console.log(chalk.gray(question));

  let prompt = createPrompt(question, ctx);
  // Send a vanilla prompt to the model
  if (process.env.BYPASS_CONTEXT == "1") {
    console.log(chalk.red("=== using plain question ==="));
    prompt = question;
  }
  // Log the prompt
  if (process.env.WITH_PROMPT == "1") {
    console.log(chalk.yellow("=== prompt ==="));
    console.log(chalk.gray(prompt));
  }

  const completionText = await openai.createCompletion({ prompt });

  console.log(chalk.greenBright("=== answer ==="));
  console.log(chalk.gray(completionText?.trim()));
}

main();
