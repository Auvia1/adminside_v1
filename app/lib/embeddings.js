import { GoogleGenerativeAI } from "@google/generative-ai";

const client = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

export async function generateEmbedding(text) {
  const model = client.getGenerativeModel({
    model: "embedding-001",
  });

  const result = await model.embedContent(text);
  return result.embedding.values;
}

export async function extractTextFromFile(file) {
  const text = await file.text();
  return text;
}

export function splitTextIntoChunks(text, chunkSize = 500, overlap = 50) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.substring(start, end));
    start = end - overlap;
  }

  return chunks;
}
