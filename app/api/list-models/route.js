export const runtime = "nodejs";

export async function GET() {
  try {
    console.log("🔍 [MODELS] Listing available models...");

    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    console.log("📡 [MODELS] Calling listModels()...");
    const response = await genai.listModels();

    const models = [];
    for await (const model of response) {
      console.log(`✅ [MODELS] Found: ${model.name}`);
      models.push({
        name: model.name,
        displayName: model.displayName,
        description: model.description,
        supportedMethods: model.supportedMethods || [],
      });
    }

    console.log(`\n🎉 [MODELS] Total models: ${models.length}`);

    const embeddingModels = models.filter((m) =>
      m.supportedMethods?.some((method) =>
        method.toLowerCase().includes("embed")
      )
    );

    return Response.json({
      success: true,
      total_models: models.length,
      embedding_models: embeddingModels,
      all_models: models,
      recommendation: embeddingModels.length > 0
        ? `Use: ${embeddingModels[0].name}`
        : "No embedding models found",
    });
  } catch (error) {
    console.error("❌ [MODELS] Error:", error.message);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
