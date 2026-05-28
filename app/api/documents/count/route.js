import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

