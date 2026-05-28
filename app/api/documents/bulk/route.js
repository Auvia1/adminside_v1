import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// POST - Bulk create documents
export async function POST(request) {
  try {
    const body = await request.json();
    const { clinic_id, documents } = body;

    console.log(`📦 [POST /documents/bulk] Creating ${documents.length} documents for clinic: ${clinic_id}`);

    if (!clinic_id || !documents || !Array.isArray(documents) || documents.length === 0) {
      console.error("❌ [POST /documents/bulk] Invalid input");
      return Response.json(
        { success: false, error: "clinic_id and non-empty documents array are required" },
        { status: 400 }
      );
    }

    // Validate all documents have required fields
    const invalidDocs = documents.filter(doc => !doc.file_name || !doc.file_url);
    if (invalidDocs.length > 0) {
      console.error("❌ [POST /documents/bulk] Invalid documents");
      return Response.json(
        { success: false, error: "Each document must have file_name and file_url" },
        { status: 400 }
      );
    }

    // Transform documents for insertion
    const docsToInsert = documents.map(doc => ({
      clinic_id,
      file_name: doc.file_name,
      file_url: doc.file_url,
      file_type: doc.file_type || null,
      file_size: doc.file_size || null,
      doc_type: doc.doc_type || null,
      created_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from("clinic_documents")
      .insert(docsToInsert)
      .select();

    if (error) {
      console.error("❌ [POST /documents/bulk] Insert error:", error.message);
      return Response.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log(`✅ [POST /documents/bulk] Successfully created ${data.length} documents`);

    return Response.json(
      {
        success: true,
        message: `${data.length} documents created successfully`,
        data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ [POST /documents/bulk] Error:", error.message);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
