import { Storage } from "@google-cloud/storage";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

let supabase = null;
function getSupabase() {
  if (supabase) return supabase;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase credentials not configured in environment variables");
  }
  supabase = createClient(url, key);
  return supabase;
}

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

  const storage = new Storage({
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    credentials: {
      type: "service_account",
      project_id: process.env.GOOGLE_CLOUD_PROJECT_ID,
      private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, "\n"),
      client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
    },
  });

  return storage;
}

function sanitizeFileName(name) {
  return String(name || "document")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_");
}

export async function POST(request) {
  try {
    console.log("🚀 [UPLOAD] Upload documents API called");
    const formData = await request.formData();
    const clinicId = formData.get("clinic_id");
    const docType = formData.get("doc_type") || "misc";
    const files = formData.getAll("files").filter((file) => typeof file?.arrayBuffer === "function");
    console.log(`📦 [UPLOAD] Files received: ${files.length}, clinic_id: ${clinicId}, doc_type: ${docType}`);

    if (files.length === 0) {
      console.error("❌ [UPLOAD] No valid files provided");
      return Response.json({ success: false, error: "No files were provided" }, { status: 400 });
    }

    if (!clinicId) {
      console.error("❌ [UPLOAD] clinic_id is required");
      return Response.json({ success: false, error: "clinic_id is required" }, { status: 400 });
    }

    console.log(`🔑 [UPLOAD] Initializing Google Cloud Storage...`);
    const storage = initializeStorageClient();
    const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME || "auvia-clinic-documents";
    const bucket = storage.bucket(bucketName);
    console.log(`📦 [UPLOAD] Bucket: ${bucketName}`);

    const savedFiles = [];
    const documentsToCreate = [];

    for (let i = 0; i < files.length; i++) {
      console.log(`\n💾 [UPLOAD] Processing file ${i + 1}/${files.length}: ${files[i].name}`);
      console.log(`💾 [UPLOAD] File type: ${files[i].type}, Size: ${files[i].size} bytes`);

      console.log(`💾 [UPLOAD] Reading file buffer...`);
      const buffer = Buffer.from(await files[i].arrayBuffer());
      console.log(`💾 [UPLOAD] Buffer size: ${buffer.length} bytes`);

      const safeName = sanitizeFileName(files[i].name);
      console.log(`💾 [UPLOAD] Sanitized name: ${safeName}`);

      const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
      console.log(`💾 [UPLOAD] Unique name: ${uniqueName}`);

      const filePath = `clinics/${uniqueName}`;
      console.log(`💾 [UPLOAD] Cloud path: gs://${bucketName}/${filePath}`);

      const file = bucket.file(filePath);

      console.log(`💾 [UPLOAD] Uploading to Google Cloud Storage...`);
      await file.save(buffer, {
        metadata: {
          contentType: files[i].type,
          metadata: {
            originalName: files[i].name,
            uploadedAt: new Date().toISOString(),
          },
        },
      });
      console.log(`✅ [UPLOAD] File uploaded successfully`);

      // Generate signed URL (valid for 7 days)
      console.log(`🔗 [UPLOAD] Generating signed URL...`);
      const [signedUrl] = await file.getSignedUrl({
        version: "v4",
        action: "read",
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      });
      console.log(`🔗 [UPLOAD] Signed URL generated`);

      const fileObj = {
        name: files[i].name,
        savedAs: uniqueName,
        path: filePath,
        url: signedUrl,
        type: files[i].type,
        size: files[i].size,
        cloudPath: `gs://${bucketName}/${filePath}`,
      };
      savedFiles.push(fileObj);

      // Prepare document metadata for database
      documentsToCreate.push({
        file_name: files[i].name,
        file_url: signedUrl,
        file_type: files[i].type,
        file_size: files[i].size,
        doc_type: docType,
      });

      console.log(`✅ [UPLOAD] File object created:`, {
        name: fileObj.name,
        size: fileObj.size,
        cloudPath: fileObj.cloudPath,
      });
    }

    // Save metadata to database directly
    console.log(`\n💾 [UPLOAD] Saving ${documentsToCreate.length} document metadata to database...`);
    try {
      const supabaseClient = getSupabase();
      const docsToInsert = documentsToCreate.map(doc => ({
        clinic_id: clinicId,
        file_name: doc.file_name,
        file_url: doc.file_url,
        file_type: doc.file_type || null,
        file_size: doc.file_size || null,
        doc_type: doc.doc_type || null,
        created_at: new Date().toISOString(),
      }));

      const { data: dbData, error: dbError } = await supabaseClient
        .from("clinic_documents")
        .insert(docsToInsert)
        .select();

      if (dbError) {
        console.warn(`⚠️ [UPLOAD] Failed to save metadata to database: ${dbError.message}`);
      } else {
        console.log(`✅ [UPLOAD] ${dbData.length} documents saved to database directly`);
      }
    } catch (dbError) {
      console.warn(`⚠️ [UPLOAD] Error saving metadata to database:`, dbError.message);
      // Don't fail the upload if metadata save fails - files are already in GCS
    }

    console.log(`\n🎉 [UPLOAD] All ${savedFiles.length} files uploaded successfully to Google Cloud Storage`);
    return Response.json({ success: true, files: savedFiles });
  } catch (error) {
    console.error("❌ [UPLOAD] Error:", error.message);
    console.error("❌ [UPLOAD] Stack trace:", error.stack);
    return Response.json(
      { success: false, error: error.message || "Failed to upload documents to Google Cloud Storage" },
      { status: 500 }
    );
  }
}
