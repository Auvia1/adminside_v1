import { createClient } from "@supabase/supabase-js";

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

// DELETE - Delete single document
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    console.log(`🗑️ [DELETE /documents/:id] Deleting document: ${id}`);

    const { error } = await supabase
      .from("clinic_documents")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("❌ [DELETE /documents/:id] Error:", error.message);
      return Response.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log(`✅ [DELETE /documents/:id] Document deleted: ${id}`);
    console.warn(`⚠️ [DELETE /documents/:id] Note: File remains in cloud storage - must be deleted separately`);

    return Response.json({
      success: true,
      message: "Document deleted successfully",
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
