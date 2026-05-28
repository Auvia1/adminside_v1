import { mkdir, writeFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

function sanitizeFileName(name) {
  return String(name || "document")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_");
}

export async function POST(request) {
  try {
    console.log("🚀 [UPLOAD] Upload documents API called");
    const formData = await request.formData();
    const files = formData.getAll("files").filter((file) => typeof file?.arrayBuffer === "function");
    console.log(`📦 [UPLOAD] Files received: ${files.length}`);

    if (files.length === 0) {
      console.error("❌ [UPLOAD] No valid files provided");
      return Response.json({ success: false, error: "No files were provided" }, { status: 400 });
    }

    console.log(`📁 [UPLOAD] Creating upload directory...`);
    const uploadDir = path.join(process.cwd(), "uploaded_docs");
    await mkdir(uploadDir, { recursive: true });
    console.log(`📁 [UPLOAD] Upload directory ready: ${uploadDir}`);

    const savedFiles = [];

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

      const filePath = path.join(uploadDir, uniqueName);
      console.log(`💾 [UPLOAD] File path: ${filePath}`);

      console.log(`💾 [UPLOAD] Writing file to disk...`);
      await writeFile(filePath, buffer);
      console.log(`✅ [UPLOAD] File written successfully`);

      const fileObj = {
        name: files[i].name,
        savedAs: uniqueName,
        path: `/uploaded_docs/${uniqueName}`,
        type: files[i].type,
        size: files[i].size,
      };
      savedFiles.push(fileObj);
      console.log(`✅ [UPLOAD] File object created:`, fileObj);
    }

    console.log(`\n🎉 [UPLOAD] All ${savedFiles.length} files saved successfully`);
    return Response.json({ success: true, files: savedFiles });
  } catch (error) {
    console.error("❌ [UPLOAD] Error:", error);
    console.error("❌ [UPLOAD] Stack trace:", error.stack);
    return Response.json(
      { success: false, error: error.message || "Failed to save uploaded documents" },
      { status: 500 }
    );
  }
}