# Troubleshooting: 500 Error on Document Embedding

## Quick Diagnosis

Run this in your browser console:
```javascript
fetch('/api/diagnostic').then(r => r.json()).then(d => console.table(d.checks))
```

This will show you which environment variables are missing.

---

## Error: "<!DOCTYPE ... is not valid JSON"

**Cause:** Missing or invalid environment variables

**Solution:**

### Step 1: Create `.env.local`
In your project root, create `.env.local`:
```
GEMINI_API_KEY=your_key_here
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_key_here
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Step 2: Restart Dev Server
```bash
# Kill current server
Ctrl + C

# Start again
npm run dev
```

### Step 3: Verify Setup
Visit: `http://localhost:3000/api/diagnostic`

Should show:
```
✅ All environment variables are set
```

### Step 4: Try Upload Again
Upload a document in clinic management

---

## Server Console Should Show:

✅ After restart:
```
🔍 [ENV CHECK] Checking environment variables...
🔍 [ENV CHECK] GEMINI_API_KEY: ✅ SET
🔍 [ENV CHECK] SUPABASE_URL: ✅ SET
🔍 [ENV CHECK] SUPABASE_SERVICE_ROLE_KEY: ✅ SET
```

✅ After upload:
```
🚀 [STEP 1] Embedding API called
📄 [STEP 2] Received file: filename.pdf for clinic: clinic-id
✂️ [CHUNK] Chunking complete: 5 total chunks
🔄 [STEP 4.1] Generating embedding for chunk 1/5...
✅ [GEMINI] Embedding received with 768 dimensions
💾 [STEP 5] Successfully inserted 5 embeddings into Supabase
```

❌ If still getting error:
```
❌ [ERROR] Embedding error: [specific error message]
```

Copy the specific error and share it.

---

## Common Causes & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `GEMINI_API_KEY not set` | Missing API key | Get from https://aistudio.google.com/apikey |
| `SUPABASE_URL not set` | Missing Supabase URL | Get from Supabase dashboard → Settings → API |
| `clinic_documents table not found` | Table not created | Run SQL from `migrations/001_create_clinic_documents.sql` |
| `pgvector extension not enabled` | Vector support not enabled | Run `CREATE EXTENSION IF NOT EXISTS vector;` in Supabase |
| `403 Unauthorized` | Wrong service role key | Double-check the key in Supabase settings |
| `429 Too Many Requests` | Gemini API rate limit | Wait or check API quota |

---

## Need Help?

1. Check browser console for client errors
2. Check terminal for server errors
3. Visit `/api/diagnostic` to see what's configured
4. Share the full error message from terminal
