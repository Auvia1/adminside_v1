import { createClient } from "@supabase/supabase-js";
import { Storage } from "@google-cloud/storage";

export const runtime = "nodejs";

let _supabase = null;
function getSupabaseClient() {
  if (_supabase) return _supabase;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase credentials (NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY) are not set.");
  }
  _supabase = createClient(url, key);
  return _supabase;
}

const supabase = new Proxy({}, {
  get(target, prop) {
    return getSupabaseClient()[prop];
  }
});

// Initialize Google Cloud Storage
function initializeStorageClient() {
  if (!process.env.GOOGLE_CLOUD_PROJECT_ID) {
    throw new Error("GOOGLE_CLOUD_PROJECT_ID not set");
  }
  if (!process.env.GOOGLE_CLOUD_PRIVATE_KEY) {
    throw new Error("GOOGLE_CLOUD_PRIVATE_KEY not set");
  }
  if (!process.env.GOOGLE_CLOUD_CLIENT_EMAIL) {
    throw new Error("GOOGLE_CLOUD_CLIENT_EMAIL not set");
  }

  return new Storage({
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    credentials: {
      type: "service_account",
      project_id: process.env.GOOGLE_CLOUD_PROJECT_ID,
      private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, "\n"),
      client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
    },
  });
}

/**
 * Extract GCS file path from a signed URL.
 * Signed URL format: https://storage.googleapis.com/{bucket}/{file_path}?X-Goog-...
 */
function extractGcsFilePath(signedUrl, bucketName) {
  try {
    const url = new URL(signedUrl);
    // pathname looks like /{bucketName}/{file_path}
    const pathname = url.pathname; // e.g. /auvia-clinic-documents/clinics/12345-abc-file.pdf
    const prefix = `/${bucketName}/`;
    if (pathname.startsWith(prefix)) {
      return decodeURIComponent(pathname.slice(prefix.length));
    }
    // Fallback: try stripping just leading slash and bucket
    const parts = pathname.split("/").filter(Boolean);
    if (parts[0] === bucketName) {
      return parts.slice(1).join("/");
    }
    return null;
  } catch {
    return null;
  }
}

// GET - Get single document
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    console.log(`📄 [GET /documents/:id] Fetching document: ${id}`);

    const { data, error } = await supabase
      .from("clinic_documents")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("❌ [GET /documents/:id] Error:", error.message);
      return Response.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    if (!data) {
      return Response.json(
        { success: false, error: "Document not found" },
        { status: 404 }
      );
    }

    console.log(`✅ [GET /documents/:id] Document retrieved: ${id}`);

    return Response.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("❌ [GET /documents/:id] Error:", error.message);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete single document (removes from GCS, vector embeddings, and DB)
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    console.log(`🗑️ [DELETE /documents/:id] Starting full deletion for document: ${id}`);

    // ── Step 1: Fetch document record to get file_url, file_name, clinic_id ──
    const { data: doc, error: fetchError } = await supabase
      .from("clinic_documents")
      .select("id, file_name, file_url, clinic_id")
      .eq("id", id)
      .single();

    if (fetchError || !doc) {
      console.error("❌ [DELETE /documents/:id] Document not found:", fetchError?.message);
      return Response.json(
        { success: false, error: "Document not found" },
        { status: 404 }
      );
    }

    console.log(`📄 [DELETE] Found document: "${doc.file_name}" for clinic: ${doc.clinic_id}`);

    const results = {
      vectorsDeleted: false,
      gcsDeleted: false,
      dbDeleted: false,
      warnings: [],
    };

    // ── Step 2: Delete vector embeddings from clinic_knowledge ──────────────
    console.log(`🧠 [DELETE] Deleting vector embeddings for file: "${doc.file_name}"...`);
    try {
      const { error: vectorError, count } = await supabase
        .from("clinic_knowledge")
        .delete({ count: "exact" })
        .eq("clinic_id", doc.clinic_id)
        .eq("file_name", doc.file_name);

      if (vectorError) {
        console.warn(`⚠️ [DELETE] Vector deletion warning:`, vectorError.message);
        results.warnings.push(`Vector embeddings: ${vectorError.message}`);
      } else {
        console.log(`✅ [DELETE] Deleted ${count ?? "?"} vector embedding(s) from clinic_knowledge`);
        results.vectorsDeleted = true;
      }
    } catch (vectorErr) {
      console.warn(`⚠️ [DELETE] Vector deletion failed:`, vectorErr.message);
      results.warnings.push(`Vector embeddings: ${vectorErr.message}`);
    }

    // ── Step 3: Delete file from Google Cloud Storage ────────────────────────
    if (doc.file_url) {
      console.log(`☁️ [DELETE] Attempting to delete file from Google Cloud Storage...`);
      try {
        const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME || "auvia-clinic-documents";
        const filePath = extractGcsFilePath(doc.file_url, bucketName);

        if (filePath) {
          console.log(`☁️ [DELETE] GCS file path extracted: ${filePath}`);
          const storage = initializeStorageClient();
          const bucket = storage.bucket(bucketName);
          const file = bucket.file(filePath);

          const [exists] = await file.exists();
          if (exists) {
            await file.delete();
            console.log(`✅ [DELETE] File deleted from GCS: gs://${bucketName}/${filePath}`);
            results.gcsDeleted = true;
          } else {
            console.warn(`⚠️ [DELETE] File not found in GCS (may have already been deleted): ${filePath}`);
            results.warnings.push("GCS file was already absent or not found");
            results.gcsDeleted = true; // treat as success — file is gone
          }
        } else {
          console.warn(`⚠️ [DELETE] Could not extract GCS path from URL: ${doc.file_url}`);
          results.warnings.push("Could not determine GCS file path from stored URL");
        }
      } catch (gcsErr) {
        console.warn(`⚠️ [DELETE] GCS deletion failed:`, gcsErr.message);
        results.warnings.push(`GCS: ${gcsErr.message}`);
      }
    } else {
      console.log(`ℹ️ [DELETE] No file_url stored — skipping GCS deletion`);
      results.gcsDeleted = true;
    }

    // ── Step 4: Delete document record from clinic_documents ─────────────────
    console.log(`🗄️ [DELETE] Deleting document record from clinic_documents...`);
    const { error: dbError } = await supabase
      .from("clinic_documents")
      .delete()
      .eq("id", id);

    if (dbError) {
      console.error("❌ [DELETE] DB deletion error:", dbError.message);
      return Response.json(
        { success: false, error: `Failed to delete document record: ${dbError.message}` },
        { status: 500 }
      );
    }

    console.log(`✅ [DELETE] Document record deleted from DB`);
    results.dbDeleted = true;

    console.log(`🎉 [DELETE] Full deletion complete for document: ${id}`, results);

    return Response.json({
      success: true,
      message: "Document, embeddings, and cloud file deleted successfully",
      details: results,
    });
  } catch (error) {
    console.error("❌ [DELETE /documents/:id] Unexpected error:", error.message);
    console.error("❌ [DELETE /documents/:id] Stack:", error.stack);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Update document metadata
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { file_name, file_type, file_size, doc_type } = body;

    console.log(`🔄 [PATCH /documents/:id] Updating document: ${id}`);

    const updateData = {};
    if (file_name !== undefined) updateData.file_name = file_name;
    if (file_type !== undefined) updateData.file_type = file_type;
    if (file_size !== undefined) updateData.file_size = file_size;
    if (doc_type !== undefined) updateData.doc_type = doc_type;

    const { data, error } = await supabase
      .from("clinic_documents")
      .update(updateData)
      .eq("id", id)
      .select();

    if (error) {
      console.error("❌ [PATCH /documents/:id] Error:", error.message);
      return Response.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return Response.json(
        { success: false, error: "Document not found" },
        { status: 404 }
      );
    }

    console.log(`✅ [PATCH /documents/:id] Document updated: ${id}`);

    return Response.json({
      success: true,
      data: data[0],
    });
  } catch (error) {
    console.error("❌ [PATCH /documents/:id] Error:", error.message);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
