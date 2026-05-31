export async function uploadDocuments(files, clinicId) {
  console.log("📤 [CLIENT] uploadDocuments called");
  const selectedFiles = Array.from(files || []);
  console.log(`📤 [CLIENT] Files count: ${selectedFiles.length}`);

  if (selectedFiles.length === 0) {
    console.log("⚠️ [CLIENT] No files provided");
    return [];
  }

  const formData = new FormData();
  formData.append("clinic_id", clinicId);
  formData.append("doc_type", "misc");

  selectedFiles.forEach((file) => {
    console.log(`📁 [CLIENT] Adding file to FormData: ${file.name} (${file.type}, ${file.size} bytes)`);
    formData.append("files", file);
  });

  console.log(`📤 [CLIENT] Sending files to /api/upload-documents... (clinic_id: ${clinicId})`);
  const response = await fetch("/api/upload-documents", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  console.log(`📥 [CLIENT] Response from upload endpoint:`, data);

  if (!response.ok || !data.success) {
    console.error("❌ [CLIENT] Upload failed:", data.error);
    throw new Error(data.error || "Failed to upload documents");
  }

  const savedFiles = Array.isArray(data.files) ? data.files : [];
  console.log(`✅ [CLIENT] Files saved: ${savedFiles.length} files`);

  if (clinicId && savedFiles.length > 0) {
    console.log(`🔄 [CLIENT] Starting embedding process for clinic: ${clinicId}`);
    for (const file of selectedFiles) {
      try {
        console.log(`🔗 [CLIENT] Calling embedAndSaveDocument for ${file.name}...`);
        await embedAndSaveDocument(clinicId, file.name, file);
        console.log(`✅ [CLIENT] Successfully embedded ${file.name}`);
      } catch (error) {
        console.error(`❌ [CLIENT] Failed to embed ${file.name}:`, error);
      }
    }
    console.log("🎉 [CLIENT] All embedding tasks completed");
  } else {
    console.log("⚠️ [CLIENT] Skipping embedding - missing clinicId or files");
  }

  return savedFiles;
}

async function embedAndSaveDocument(clinicId, fileName, file) {
  console.log(`📨 [CLIENT] Sending embed request for ${fileName}...`);
  const formData = new FormData();
  formData.append("clinicId", clinicId);
  formData.append("fileName", fileName);
  formData.append("file", file);

  const response = await fetch("/api/embed-documents", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  console.log(`📥 [CLIENT] Response from embed endpoint:`, data);

  if (!response.ok || !data.success) {
    console.error("❌ [CLIENT] Embed failed:", data.error);
    throw new Error(data.error || "Failed to embed document");
  }

  console.log(`✅ [CLIENT] Embed successful - ${data.chunks} chunks saved`);
  return data;
}