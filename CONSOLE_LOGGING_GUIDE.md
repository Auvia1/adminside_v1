# Console Logging Guide - Document Embedding Flow

## Complete Flow with Console Output

When a user uploads documents, you'll see console logs in this order:

### **CLIENT SIDE** (Browser DevTools)
```
📤 [CLIENT] uploadDocuments called
📤 [CLIENT] Files count: X
📁 [CLIENT] Adding file to FormData: filename.pdf (application/pdf, XXXX bytes)
📤 [CLIENT] Sending files to /api/upload-documents...
📥 [CLIENT] Response from upload endpoint: {success: true, files: [...]}
✅ [CLIENT] Files saved: X files
🔄 [CLIENT] Starting embedding process for clinic: clinic@email.com
📖 [CLIENT] Reading file content: filename.pdf
📖 [CLIENT] File content size: XXXX characters
🔗 [CLIENT] Calling embedAndSaveDocument for filename.pdf...
📨 [CLIENT] Sending embed request for filename.pdf...
📨 [CLIENT] Payload size: XXXX bytes
📥 [CLIENT] Response from embed endpoint: {success: true, chunks: X, message: "..."}
✅ [CLIENT] Embed successful - X chunks saved
✅ [CLIENT] Successfully embedded filename.pdf
🎉 [CLIENT] All embedding tasks completed
```

### **SERVER SIDE - STEP 1: File Upload** (`/api/upload-documents`)
```
🚀 [UPLOAD] Upload documents API called
📦 [UPLOAD] Files received: X
📁 [UPLOAD] Creating upload directory...
📁 [UPLOAD] Upload directory ready: C:\path\to\uploaded_docs

💾 [UPLOAD] Processing file 1/X: filename.pdf
💾 [UPLOAD] File type: application/pdf, Size: XXXX bytes
💾 [UPLOAD] Reading file buffer...
💾 [UPLOAD] Buffer size: XXXX bytes
💾 [UPLOAD] Sanitized name: filename_pdf
💾 [UPLOAD] Unique name: 1234567890-abc123-filename_pdf
💾 [UPLOAD] File path: C:\path\to\uploaded_docs\1234567890-abc123-filename_pdf
💾 [UPLOAD] Writing file to disk...
✅ [UPLOAD] File written successfully
✅ [UPLOAD] File object created: {name, savedAs, path, type, size}

🎉 [UPLOAD] All X files saved successfully
```

### **SERVER SIDE - STEP 2: Embedding** (`/api/embed-documents`)

#### Step 2a: Initialization
```
🚀 [STEP 1] Embedding API called
📄 [STEP 2] Received file: filename.pdf for clinic: clinic@email.com
📏 [STEP 2] Content size: XXXX characters
```

#### Step 2b: Text Chunking
```
✂️ [STEP 3] Chunking text with max size 1000...
✂️ [CHUNK] Starting text chunking...
✂️ [CHUNK] Max chunk size: 1000, Overlap: 100
✂️ [CHUNK] Total text length: XXXX characters
✂️ [CHUNK] Chunk 1: start=0, end=1000, size=1000
✂️ [CHUNK] Chunk 2: start=900, end=1900, size=1000
✂️ [CHUNK] Chunk 3: start=1800, end=2800, size=1000
...
✂️ [CHUNK] Chunking complete: X total chunks
✂️ [STEP 3] Text split into X chunks
```

#### Step 2c: Embedding Generation
```
🔄 [STEP 4.1] Generating embedding for chunk 1/X (1000 chars)...
🔧 [GEMINI] Creating embedding model...
🔧 [GEMINI] Model created: embedding-001
🔧 [GEMINI] Sending text to Gemini API (1000 chars)...
✅ [GEMINI] Embedding received with 768 dimensions
✅ [STEP 4.1] Embedding generated (768 dimensions)

🔄 [STEP 4.2] Generating embedding for chunk 2/X (1000 chars)...
🔧 [GEMINI] Creating embedding model...
🔧 [GEMINI] Model created: embedding-001
🔧 [GEMINI] Sending text to Gemini API (1000 chars)...
✅ [GEMINI] Embedding received with 768 dimensions
✅ [STEP 4.2] Embedding generated (768 dimensions)
...
```

#### Step 2d: Database Storage
```
💾 [STEP 5] Preparing to insert X embeddings into Supabase...
✅ [STEP 5] Successfully inserted X embeddings into Supabase
🎉 [COMPLETE] Embedding process finished for file: filename.pdf
```

---

## Example Complete Flow for Single PDF

```
===== CLIENT UPLOAD STARTS =====
📤 [CLIENT] uploadDocuments called
📤 [CLIENT] Files count: 1
📁 [CLIENT] Adding file to FormData: document.pdf (application/pdf, 5432 bytes)
📤 [CLIENT] Sending files to /api/upload-documents...

===== SERVER FILE UPLOAD =====
🚀 [UPLOAD] Upload documents API called
📦 [UPLOAD] Files received: 1
📁 [UPLOAD] Creating upload directory...
📁 [UPLOAD] Upload directory ready: C:\project\uploaded_docs
💾 [UPLOAD] Processing file 1/1: document.pdf
💾 [UPLOAD] File type: application/pdf, Size: 5432 bytes
💾 [UPLOAD] Reading file buffer...
💾 [UPLOAD] Buffer size: 5432 bytes
💾 [UPLOAD] Sanitized name: document_pdf
💾 [UPLOAD] Unique name: 1716902400000-xyz789-document_pdf
💾 [UPLOAD] File path: C:\project\uploaded_docs\1716902400000-xyz789-document_pdf
💾 [UPLOAD] Writing file to disk...
✅ [UPLOAD] File written successfully
✅ [UPLOAD] File object created: {name: "document.pdf", savedAs: "1716902400000-xyz789-document_pdf", ...}
🎉 [UPLOAD] All 1 files saved successfully

📥 [CLIENT] Response from upload endpoint: {success: true, files: [{...}]}
✅ [CLIENT] Files saved: 1 files
🔄 [CLIENT] Starting embedding process for clinic: clinic@email.com
📖 [CLIENT] Reading file content: document.pdf
📖 [CLIENT] File content size: 4567 characters
🔗 [CLIENT] Calling embedAndSaveDocument for document.pdf...

===== SERVER EMBEDDING STARTS =====
📨 [CLIENT] Sending embed request for document.pdf...
📨 [CLIENT] Payload size: 12345 bytes
🚀 [STEP 1] Embedding API called
📄 [STEP 2] Received file: document.pdf for clinic: clinic@email.com
📏 [STEP 2] Content size: 4567 characters

===== CHUNKING PHASE =====
✂️ [STEP 3] Chunking text with max size 1000...
✂️ [CHUNK] Starting text chunking...
✂️ [CHUNK] Max chunk size: 1000, Overlap: 100
✂️ [CHUNK] Total text length: 4567 characters
✂️ [CHUNK] Chunk 1: start=0, end=1000, size=1000
✂️ [CHUNK] Chunk 2: start=900, end=1900, size=1000
✂️ [CHUNK] Chunk 3: start=1800, end=2800, size=1000
✂️ [CHUNK] Chunk 4: start=2700, end=3700, size=1000
✂️ [CHUNK] Chunk 5: start=3600, end=4567, size=967
✂️ [CHUNK] Chunking complete: 5 total chunks
✂️ [STEP 3] Text split into 5 chunks

===== EMBEDDING GENERATION PHASE =====
🔄 [STEP 4.1] Generating embedding for chunk 1/5 (1000 chars)...
🔧 [GEMINI] Creating embedding model...
🔧 [GEMINI] Model created: embedding-001
🔧 [GEMINI] Sending text to Gemini API (1000 chars)...
✅ [GEMINI] Embedding received with 768 dimensions
✅ [STEP 4.1] Embedding generated (768 dimensions)
🔄 [STEP 4.2] Generating embedding for chunk 2/5 (1000 chars)...
🔧 [GEMINI] Creating embedding model...
🔧 [GEMINI] Model created: embedding-001
🔧 [GEMINI] Sending text to Gemini API (1000 chars)...
✅ [GEMINI] Embedding received with 768 dimensions
✅ [STEP 4.2] Embedding generated (768 dimensions)
🔄 [STEP 4.3] Generating embedding for chunk 3/5 (1000 chars)...
🔧 [GEMINI] Creating embedding model...
🔧 [GEMINI] Model created: embedding-001
🔧 [GEMINI] Sending text to Gemini API (1000 chars)...
✅ [GEMINI] Embedding received with 768 dimensions
✅ [STEP 4.3] Embedding generated (768 dimensions)
🔄 [STEP 4.4] Generating embedding for chunk 4/5 (1000 chars)...
🔧 [GEMINI] Creating embedding model...
🔧 [GEMINI] Model created: embedding-001
🔧 [GEMINI] Sending text to Gemini API (1000 chars)...
✅ [GEMINI] Embedding received with 768 dimensions
✅ [STEP 4.4] Embedding generated (768 dimensions)
🔄 [STEP 4.5] Generating embedding for chunk 5/5 (967 chars)...
🔧 [GEMINI] Creating embedding model...
🔧 [GEMINI] Model created: embedding-001
🔧 [GEMINI] Sending text to Gemini API (967 chars)...
✅ [GEMINI] Embedding received with 768 dimensions
✅ [STEP 4.5] Embedding generated (768 dimensions)

===== DATABASE STORAGE PHASE =====
💾 [STEP 5] Preparing to insert 5 embeddings into Supabase...
✅ [STEP 5] Successfully inserted 5 embeddings into Supabase
🎉 [COMPLETE] Embedding process finished for file: document.pdf

📥 [CLIENT] Response from embed endpoint: {success: true, chunks: 5, message: "Embedded and saved 5 chunks"}
✅ [CLIENT] Embed successful - 5 chunks saved
✅ [CLIENT] Successfully embedded document.pdf
🎉 [CLIENT] All embedding tasks completed
```

---

## Debug Tips

- **Check browser DevTools** (F12 → Console) for CLIENT logs
- **Check server logs** (terminal/output) for SERVER logs
- **If embeddings not saving**: Look for errors in [STEP 5] and [GEMINI] logs
- **If wrong chunk sizes**: Check [CHUNK] logs for chunking calculations
- **If API calls failing**: Check network tab in DevTools + server logs together
