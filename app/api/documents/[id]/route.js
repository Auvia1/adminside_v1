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

// GET - Get single document
export async function GET(request, { params }) {
  try {
    const { id } = params;

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

function getStorageClient() {
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

function getGcsFilePath(fileUrl) {
  try {
    const urlObj = new URL(fileUrl);
    const decodedPath = decodeURIComponent(urlObj.pathname);
    const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME || "auvia-clinic-documents";
    const prefix = `/${bucketName}/`;
    
    if (decodedPath.includes(prefix)) {
      return decodedPath.split(prefix)[1];
    }
    if (decodedPath.startsWith("/clinics/")) {
      return decodedPath.substring(1);
    }
    return decodedPath.replace(/^\//, "");
  } catch (e) {
    console.error("❌ Failed to parse GCS file path from URL:", fileUrl, e);
    return null;
  }
}

// DELETE - Delete single document
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    console.log(`🗑️ [DELETE /documents/:id] Deleting document: ${id}`);

    // 1. Fetch document metadata first to get clinic_id, file_name, and file_url
    const { data: doc, error: fetchError } = await supabase
      .from("clinic_documents")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !doc) {
      console.error(`❌ [DELETE /documents/:id] Document not found: ${id}`);
      return Response.json(
        { success: false, error: fetchError?.message || "Document not found" },
        { status: 404 }
      );
    }

    const { clinic_id: clinicId, file_name: fileName, file_url: fileUrl } = doc;

    // 2. Delete from Google Cloud Storage
    if (fileUrl) {
      const gcsFilePath = getGcsFilePath(fileUrl);
      if (gcsFilePath) {
        try {
          const storage = getStorageClient();
          const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME || "auvia-clinic-documents";
          const bucket = storage.bucket(bucketName);
          const file = bucket.file(gcsFilePath);

          console.log(`🗑️ [DELETE /documents/:id] Deleting file from GCS: gs://${bucketName}/${gcsFilePath}`);

          const [exists] = await file.exists();
          if (exists) {
            await file.delete();
            console.log(`✅ [DELETE /documents/:id] Deleted file from GCS successfully`);
          } else {
            console.warn(`⚠️ [DELETE /documents/:id] File not found in GCS: ${gcsFilePath}`);
          }
        } catch (gcsError) {
          console.error(`❌ [DELETE /documents/:id] Failed to delete GCS file:`, gcsError.message);
          // Proceed with database deletion so we don't end up with orphaned database records
        }
      }
    }

    // 3. Delete matching embeddings from clinic_knowledge
    if (clinicId && fileName) {
      console.log(`🗑️ [DELETE /documents/:id] Deleting embeddings from clinic_knowledge for clinic_id=${clinicId}, file_name=${fileName}`);
      const { error: knowledgeError } = await supabase
        .from("clinic_knowledge")
        .delete()
        .eq("clinic_id", clinicId)
        .eq("file_name", fileName);

      if (knowledgeError) {
        console.warn(`⚠️ [DELETE /documents/:id] Failed to delete embeddings:`, knowledgeError.message);
      } else {
        console.log(`✅ [DELETE /documents/:id] Embeddings deleted successfully`);
      }
    }

    // 4. Update the clinics documents column list
    if (clinicId && fileName) {
      console.log(`🗑️ [DELETE /documents/:id] Updating clinics.documents list for clinic_id=${clinicId}`);
      const { data: clinicData, error: clinicFetchError } = await supabase
        .from("clinics")
        .select("documents")
        .eq("id", clinicId)
        .single();

      if (!clinicFetchError && clinicData) {
        const currentDocs = Array.isArray(clinicData.documents) ? clinicData.documents : [];
        const updatedDocs = currentDocs.filter((d) => d.file_name !== fileName);

        const { error: clinicUpdateError } = await supabase
          .from("clinics")
          .update({ documents: updatedDocs })
          .eq("id", clinicId);

        if (clinicUpdateError) {
          console.warn(`⚠️ [DELETE /documents/:id] Failed to update clinics.documents:`, clinicUpdateError.message);
        } else {
          console.log(`✅ [DELETE /documents/:id] Updated clinics.documents list`);
        }
      }
    }

    // 5. Delete metadata record from clinic_documents
    const { error: deleteError } = await supabase
      .from("clinic_documents")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("❌ [DELETE /documents/:id] Error deleting document metadata:", deleteError.message);
      return Response.json(
        { success: false, error: deleteError.message },
        { status: 500 }
      );
    }

    console.log(`✅ [DELETE /documents/:id] Document and embeddings fully deleted`);

    return Response.json({
      success: true,
      message: "Document, GCS file, and vector embeddings deleted successfully",
    });
  } catch (error) {
    console.error("❌ [DELETE /documents/:id] Error:", error.message);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Update document metadata
export async function PATCH(request, { params }) {
  try {
    const { id } = params;
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
