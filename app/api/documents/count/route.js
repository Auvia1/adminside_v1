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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get("clinic_id");

    console.log(`📊 [DOCUMENTS COUNT] Getting documents count for clinic: ${clinicId}`);

    if (!clinicId) {
      return Response.json(
        { success: false, error: "clinic_id is required" },
        { status: 400 }
      );
    }

    const { count, error } = await supabase
      .from("clinic_documents")
      .select("*", { count: "exact" })
      .eq("clinic_id", clinicId);

    if (error) {
      console.error(`❌ [DOCUMENTS COUNT] Error:`, error.message);
      return Response.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log(`✅ [DOCUMENTS COUNT] Total files: ${count}`);

    return Response.json({
      success: true,
      data: {
        clinic_id: clinicId,
        total_files: count || 0,
      },
    });
  } catch (error) {
    console.error("❌ [DOCUMENTS COUNT] Error:", error.message);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

