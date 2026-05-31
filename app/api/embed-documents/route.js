import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import { PDFParse } from "pdf-parse";

export const runtime = "nodejs";
const MAX_CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 100;

// Strip null bytes and non-printable control characters that PostgreSQL rejects
function sanitizeText(text) {
  if (!text) return "";
  // Remove null bytes, and other C0/C1 control chars except \n \r \t
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, "");
}

// Lazy initialize to catch errors at runtime
let genai = null;
let supabase = null;

function initializeClients() {
  if (genai && supabase) return;

  console.log("🔍 [INIT] Initializing Gemini and Supabase clients...");

  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }
  if (!process.env.SUPABASE_URL) {
    throw new Error("SUPABASE_URL environment variable is not set");
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is not set");
  }

  genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log("✅ [INIT] Clients initialized successfully");
}

function chunkText(text, maxSize = MAX_CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  console.log(`✂️ [CHUNK] Starting text chunking...`);
  console.log(`✂️ [CHUNK] Max chunk size: ${maxSize}, Overlap: ${overlap}`);
  console.log(`✂️ [CHUNK] Total text length: ${text.length} characters`);

  const chunks = [];

  // If text is smaller than chunk size, return single chunk
  if (text.length <= maxSize) {
    chunks.push(text);
    console.log(`✂️ [CHUNK] Text is smaller than chunk size, returning 1 chunk`);
    return chunks;
  }

  let start = 0;
  let chunkCount = 0;

  while (start < text.length) {
    const end = Math.min(start + maxSize, text.length);
    const chunk = text.substring(start, end);
    chunks.push(chunk);
    chunkCount++;
    console.log(`✂️ [CHUNK] Chunk ${chunkCount}: start=${start}, end=${end}, size=${chunk.length}`);

    // Move forward by (maxSize - overlap)
    // This ensures we always make progress
    const step = maxSize - overlap;
    start += step;

    // If we've gone past the end, break
    if (start >= text.length) {
      break;
    }
  }

  console.log(`✂️ [CHUNK] Chunking complete: ${chunks.length} total chunks`);
  return chunks;
}

async function generateEmbedding(text) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not set");
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`;

  console.log(`🔧 [GEMINI] Calling Google Embedding API directly...`);
  console.log(`🔧 [GEMINI] URL: ${url.replace(apiKey, "***")}`);
  console.log(`🔧 [GEMINI] Text length: ${text.length} chars`);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "models/gemini-embedding-001",
        content: {
          parts: [
            {
              text: text,
            },
          ],
        },
        taskType: "RETRIEVAL_DOCUMENT",
        outputDimensionality: 768,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`❌ [GEMINI] API Error:`, errorData);
      throw new Error(
        `Gemini API error: ${errorData.error?.message || response.statusText}`
      );
    }

    const data = await response.json();
    console.log(`✅ [GEMINI] Embedding received with ${data.embedding.values.length} dimensions`);
    return data.embedding.values;
  } catch (error) {
    console.error(`❌ [GEMINI] Error:`, error.message);
    throw error;
  }
}

export async function POST(request) {
  try {
    console.log("🚀 [STEP 1] Embedding API called");

    // Initialize clients (with proper error handling)
    console.log("🔧 [STEP 1] Initializing clients...");
    initializeClients();
    console.log("✅ [STEP 1] Clients ready");

    let clinicId, fileName, fileContent;
    
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      console.log("📄 [STEP 2] Parsing FormData request...");
      const formData = await request.formData();
      clinicId = formData.get("clinicId");
      fileName = formData.get("fileName");
      const file = formData.get("file");

      if (!clinicId || !fileName || !file) {
        return Response.json(
          { success: false, error: "Missing required fields: clinicId, fileName, file" },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());

      if (fileName.toLowerCase().endsWith(".pdf")) {
        console.log(`📄 [STEP 2] Parsing PDF file: ${fileName}`);
        try {
          const parser = new PDFParse({ data: buffer });
          const pdfData = await parser.getText();
          fileContent = pdfData.text;
        } catch (err) {
          console.error("❌ [STEP 2] Failed to parse PDF:", err);
          return Response.json(
            { success: false, error: "Failed to parse PDF file" },
            { status: 400 }
          );
        }
      } else {
        fileContent = buffer.toString("utf-8");
      }
    } else {
      console.log("📄 [STEP 2] Parsing request body...");
      const bodyText = await request.text();
      console.log(`📄 [STEP 2] Request body size: ${bodyText.length} bytes`);

      let body;
      try {
        body = JSON.parse(bodyText);
      } catch (parseError) {
        console.error("❌ [STEP 2] JSON parse error:", parseError.message);
        console.error("❌ [STEP 2] Body preview:", bodyText.substring(0, 200));
        return Response.json(
          { success: false, error: "Invalid JSON in request body" },
          { status: 400 }
        );
      }

      clinicId = body.clinicId;
      fileName = body.fileName;
      fileContent = body.fileContent;
      console.log(`📄 [STEP 2] Received file: ${fileName} for clinic: ${clinicId}`);
      console.log(`📏 [STEP 2] Content size: ${fileContent?.length || 0} characters`);
    }

    if (!clinicId || !fileName || !fileContent) {
      console.error("❌ [STEP 3] Missing required fields");
      console.error(`   clinicId: ${clinicId ? "✅" : "❌"}`);
      console.error(`   fileName: ${fileName ? "✅" : "❌"}`);
      console.error(`   fileContent: ${fileContent ? "✅ (" + fileContent.length + " chars)" : "❌"}`);
      return Response.json(
        { success: false, error: "Missing required fields: clinicId, fileName, fileContent" },
        { status: 400 }
      );
    }

    console.log(`✂️ [STEP 3] Sanitizing text content...`);
    const sanitizedContent = sanitizeText(fileContent);
    console.log(`✂️ [STEP 3] Sanitized content: ${sanitizedContent.length} chars (was ${fileContent.length})`);

    console.log(`✂️ [STEP 3] Chunking text with max size ${MAX_CHUNK_SIZE}...`);
    const chunks = chunkText(sanitizedContent);
    console.log(`✂️ [STEP 3] Text split into ${chunks.length} chunks`);

    const embeddings = [];
    for (let i = 0; i < chunks.length; i++) {
      console.log(`🔄 [STEP 4.${i + 1}] Generating embedding for chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars)...`);

      try {
        const embedding = await generateEmbedding(chunks[i]);
        console.log(`✅ [STEP 4.${i + 1}] Embedding generated (${embedding.length} dimensions)`);

        embeddings.push({
          clinic_id: clinicId,
          file_name: fileName,
          chunk_text: chunks[i],
          embedding: embedding,
          created_at: new Date(),
        });
      } catch (embeddingError) {
        console.error(`❌ [STEP 4.${i + 1}] Failed to generate embedding:`, embeddingError.message);
        throw new Error(`Failed to embed chunk ${i + 1}: ${embeddingError.message}`);
      }
    }

    console.log(`💾 [STEP 5] Preparing to insert ${embeddings.length} embeddings into Supabase...`);

    try {
      // Transform embeddings to match clinic_knowledge table schema
      const dbRecords = embeddings.map((emb) => ({
        chunk_text: sanitizeText(emb.chunk_text),
        embedding: emb.embedding,
        clinic_id: emb.clinic_id,
      }));

      // Insert into clinic_knowledge
      const { data, error } = await supabase
        .from("clinic_knowledge")
        .insert(dbRecords);

      if (error) {
        console.error(`❌ [STEP 5] Supabase insert error:`, error);
        console.error(`   Error code: ${error.code}`);
        console.error(`   Error message: ${error.message}`);
        console.error(`   Error details: ${JSON.stringify(error.details)}`);
        throw new Error(`Database error: ${error.message}`);
      }

      console.log(`✅ [STEP 5] Successfully inserted ${embeddings.length} embeddings into clinic_knowledge`);

      // Also insert document metadata into clinic_documents
      console.log(`💾 [STEP 5b] Inserting document metadata into clinic_documents...`);
      const docMetadata = {
        clinic_id: clinicId,
        file_name: fileName,
        file_size: fileContent.length,
        file_type: "text/plain",
        num_chunks: embeddings.length,
        created_at: new Date(),
      };

      const { error: docError } = await supabase
        .from("clinic_documents")
        .insert([docMetadata]);

      if (docError) {
        console.warn(`⚠️ [STEP 5b] Document metadata insert warning:`, docError.message);
      } else {
        console.log(`✅ [STEP 5b] Document metadata saved to clinic_documents`);
      }

      // Update clinics table documents column
      console.log(`💾 [STEP 5c] Updating clinics.documents column...`);
      const docInfo = {
        file_name: fileName,
        file_size: fileContent.length,
        num_chunks: embeddings.length,
        created_at: new Date().toISOString(),
      };

      // Get current documents array
      const { data: clinicData, error: fetchError } = await supabase
        .from("clinics")
        .select("documents")
        .eq("id", clinicId)
        .single();

      if (fetchError) {
        console.warn(`⚠️ [STEP 5c] Could not fetch clinic documents:`, fetchError.message);
      } else {
        const currentDocs = Array.isArray(clinicData?.documents) ? clinicData.documents : [];
        const updatedDocs = [...currentDocs, docInfo];

        const { error: updateError } = await supabase
          .from("clinics")
          .update({ documents: updatedDocs })
          .eq("id", clinicId);

        if (updateError) {
          console.warn(`⚠️ [STEP 5c] Could not update clinic documents:`, updateError.message);
        } else {
          console.log(`✅ [STEP 5c] Updated clinics.documents column`);
        }
      }
    } catch (dbError) {
      console.error(`❌ [STEP 5] Database operation failed:`, dbError.message);
      throw new Error(`Database operation failed: ${dbError.message}`);
    }

    console.log(`🎉 [COMPLETE] Embedding process finished for file: ${fileName}`);

    return Response.json({
      success: true,
      message: `Embedded and saved ${embeddings.length} chunks`,
      chunks: embeddings.length,
    });
  } catch (error) {
    console.error("❌ [ERROR] Embedding error:", error.message);
    console.error("❌ [ERROR] Stack trace:", error.stack);

    return Response.json(
      {
        success: false,
        error: error.message || "Failed to embed documents",
        details: error.stack
      },
      { status: 500 }
    );
  }
}
