export const runtime = "nodejs";

export async function GET() {
  console.log("🔍 [DIAGNOSTIC] Running environment check...");

  const checks = {
    gemini_api_key: {
      status: process.env.GEMINI_API_KEY ? "✅ SET" : "❌ MISSING",
      value: process.env.GEMINI_API_KEY ? `${process.env.GEMINI_API_KEY.slice(0, 10)}...` : "NOT SET",
    },
    supabase_url: {
      status: process.env.SUPABASE_URL ? "✅ SET" : "❌ MISSING",
      value: process.env.SUPABASE_URL || "NOT SET",
    },
    supabase_service_role_key: {
      status: process.env.SUPABASE_SERVICE_ROLE_KEY ? "✅ SET" : "❌ MISSING",
      value: process.env.SUPABASE_SERVICE_ROLE_KEY
        ? `${process.env.SUPABASE_SERVICE_ROLE_KEY.slice(0, 10)}...`
        : "NOT SET",
    },
    node_env: {
      status: "✅ INFO",
      value: process.env.NODE_ENV || "development",
    },
  };

  const allSet =
    process.env.GEMINI_API_KEY &&
    process.env.SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log("📋 [DIAGNOSTIC] Results:", checks);

  return Response.json({
    success: true,
    all_configured: allSet,
    checks,
    message: allSet ? "✅ All environment variables are set" : "❌ Some environment variables are missing",
    next_steps: allSet
      ? "Environment is ready. Try uploading a document."
      : "Add missing environment variables to .env.local and restart the server.",
  });
}
