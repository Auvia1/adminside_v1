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

// DELETE - Delete all documents for a clinic
export async function DELETE(request, { params }) {
  try {
    const { clinic_id } = params;

    console.log(`🗑️ [DELETE /documents/clinic/:clinic_id] Deleting all documents for clinic: ${clinic_id}`);

    // First get count of documents to be deleted
    const { count } = await supabase
      .from("clinic_documents")
      .select("*", { count: "exact" })
      .eq("clinic_id", clinic_id);

    console.log(`📊 [DELETE /documents/clinic/:clinic_id] Found ${count} documents to delete`);

    const { error } = await supabase
      .from("clinic_documents")
      .delete()
      .eq("clinic_id", clinic_id);

    if (error) {
      console.error("❌ [DELETE /documents/clinic/:clinic_id] Error:", error.message);
      return Response.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log(`✅ [DELETE /documents/clinic/:clinic_id] ${count} documents deleted`);
    console.warn(`⚠️ [DELETE /documents/clinic/:clinic_id] Files remain in cloud storage - must be deleted separately`);

    return Response.json({
      success: true,
      message: `${count} documents deleted successfully`,
    });
  } catch (error) {
    console.error("❌ [DELETE /documents/clinic/:clinic_id] Error:", error.message);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
