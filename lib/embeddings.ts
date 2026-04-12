import { getOpenAI } from "./openai";
import { prisma } from "./db";
import { chunkText } from "./utils";

export async function createEmbedding(text: string): Promise<number[]> {
  const openai = getOpenAI();
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

export async function storeEmbeddings(
  documentId: string,
  text: string
): Promise<void> {
  const chunks = chunkText(text, 500, 50);

  for (const chunk of chunks) {
    const vector = await createEmbedding(chunk);
    const vectorStr = `[${vector.join(",")}]`;

    await prisma.$executeRaw`
      INSERT INTO "Embedding" (id, "documentId", content, vector)
      VALUES (
        gen_random_uuid()::text,
        ${documentId},
        ${chunk},
        ${vectorStr}::vector
      )
    `;
  }
}

export async function searchSimilarChunks(
  documentId: string,
  query: string,
  topK = 5
): Promise<string[]> {
  const queryVector = await createEmbedding(query);
  const vectorStr = `[${queryVector.join(",")}]`;

  const results = await prisma.$queryRaw<{ content: string }[]>`
    SELECT content
    FROM "Embedding"
    WHERE "documentId" = ${documentId}
    ORDER BY vector <=> ${vectorStr}::vector
    LIMIT ${topK}
  `;

  return results.map((r) => r.content);
}
