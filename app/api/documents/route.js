import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET - List documents with filtering and pagination
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get("clinic_id");
    const docType = searchParams.get("doc_type");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    console.log(`📋 [GET /documents] clinic_id=${clinicId}, doc_type=${docType}, limit=${limit}, offset=${offset}`);

    if (!clinicId) {
      return Response.json(
        { success: false, error: "clinic_id is required" },
        { status: 400 }
      );
    }

    let query = supabase
      .from("clinic_documents")
      .select("*", { count: "exact" })
      .eq("clinic_id", clinicId);

    if (docType) {
      query = query.eq("doc_type", docType);
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ [GET /documents] Error:", error.message);
      return Response.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log(`✅ [GET /documents] Retrieved ${data.length} documents, total: ${count}`);

    return Response.json({
      success: true,
      data: data || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error("❌ [GET /documents] Error:", error.message);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create single document
export async function POST(request) {
  try {
    const body = await request.json();
    const { clinic_id, file_name, file_url, file_type, file_size, doc_type } = body;

    console.log(`📝 [POST /documents] Creating document: ${file_name} for clinic: ${clinic_id}`);

    if (!clinic_id || !file_name || !file_url) {
      console.error("❌ [POST /documents] Missing required fields");
      return Response.json(
        { success: false, error: "clinic_id, file_name, and file_url are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("clinic_documents")
      .insert([
        {
          clinic_id,
          file_name,
          file_url,
          file_type: file_type || null,
          file_size: file_size || null,
          doc_type: doc_type || null,
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error("❌ [POST /documents] Insert error:", error.message);
      return Response.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log(`✅ [POST /documents] Document created: ${data[0].id}`);

    return Response.json(
      {
        success: true,
        data: data[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ [POST /documents] Error:", error.message);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Update document metadata
export async function PATCH(request) {
  try {
    const url = new URL(request.url);
    const docId = url.pathname.split("/").pop();

    if (docId === "documents" || !docId || docId === "bulk") {
      return Response.json(
        { success: false, error: "Document ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { file_name, file_type, file_size, doc_type } = body;

    console.log(`🔄 [PATCH /documents/${docId}] Updating document metadata`);

    const updateData = {};
    if (file_name !== undefined) updateData.file_name = file_name;
    if (file_type !== undefined) updateData.file_type = file_type;
    if (file_size !== undefined) updateData.file_size = file_size;
    if (doc_type !== undefined) updateData.doc_type = doc_type;

    const { data, error } = await supabase
      .from("clinic_documents")
      .update(updateData)
      .eq("id", docId)
      .select();

    if (error) {
      console.error("❌ [PATCH /documents] Update error:", error.message);
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

    console.log(`✅ [PATCH /documents] Document updated: ${docId}`);

    return Response.json({
      success: true,
      data: data[0],
    });
  } catch (error) {
    console.error("❌ [PATCH /documents] Error:", error.message);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
