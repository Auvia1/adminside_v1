# Document Embedding & Storage Setup Guide

## Overview
This system automatically converts uploaded documents into embeddings and stores them in Supabase PostgreSQL with vector search capabilities.

## Prerequisites

1. **Supabase Project** with pgvector extension enabled
2. **Google Gemini API Key** for embeddings
3. **Environment Variables Set**:
   ```
   # Frontend (.env.local)
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key

   # Backend (.env or backend/.env)
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

## Setup Steps

### 1. Enable pgvector in Supabase
Go to Supabase Dashboard → SQL Editor and run:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 2. Create clinic_documents Table
Run the migration: `migrations/001_create_clinic_documents.sql` in Supabase SQL Editor

### 3. Install Dependencies
```bash
npm install @google/generative-ai @supabase/supabase-js
```

## How It Works

### Document Upload Flow:
1. User uploads documents in NewClinicDialog (step 5)
2. `uploadDocuments()` sends files to `/api/upload-documents`
3. Files are saved locally (existing functionality)
4. For each file, `embedAndSaveDocument()` is called
5. Document text is extracted and split into chunks (max 1000 chars, 100 char overlap)
6. Each chunk is embedded using Google Gemini API
7. Embeddings are stored in Supabase `clinic_documents` table

### File Structure:
```
app/
├── api/
│   ├── upload-documents/      (existing - saves files)
│   └── embed-documents/route.js (new - creates embeddings)
├── lib/
│   ├── documentUpload.js       (updated - calls embedding API)
│   ├── embeddings.js           (new - utility functions)
│   └── supabaseClient.js       (new - Supabase client)
├── components/
│   └── NewClinicDialog.jsx     (updated - passes clinicId)
└── uploaded_docs/             (existing - document storage)
```

## Usage in Components

### NewClinicDialog
```jsx
// Pass clinicId (using email as identifier)
const savedFiles = await uploadDocuments(files, form.email);
```

### clinic-management Page
If you want to embed documents here too:
```jsx
import { uploadDocuments } from '@/app/lib/documentUpload';

const handleFileChange = async (event) => {
  const files = Array.from(event.target.files || []);
  const savedFiles = await uploadDocuments(files, clinicId);
};
```

## Querying Embeddings (Future - Vector Search)

Once documents are embedded, you can perform semantic search:

```javascript
// Generate query embedding
const queryEmbedding = await generateEmbedding(userQuery);

// Search similar documents
const { data } = await supabase.rpc('match_documents', {
  query_embedding: queryEmbedding,
  match_threshold: 0.3,
  match_count: 5
});
```

## Error Handling

- Invalid files: Returns error in UI
- Embedding failures: Logged but don't block file upload
- Supabase connection issues: Proper error messages returned

## Security Considerations

- Use SERVICE_ROLE_KEY only in backend API routes
- Frontend uses ANON_KEY (with RLS policies enforced)
- Document chunks are linked to clinic_id for isolation
- API routes validate clinicId before processing
