# Environment Variables Checklist

You need these in your `.env.local` (frontend root) or `.env` (backend):

```
# Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## Where to Get These:

### 1. GEMINI_API_KEY
- Go to https://aistudio.google.com/apikey
- Create a new API key
- Copy the key

### 2. SUPABASE_URL & Keys
- Go to https://app.supabase.com
- Select your project
- Settings → API
- Copy `URL` and keys:
  - `anon key` → NEXT_PUBLIC_SUPABASE_ANON_KEY
  - `service_role key` → SUPABASE_SERVICE_ROLE_KEY

## Common Issues:

❌ **"<!DOCTYPE" error** = Environment variables not set
❌ **500 error on embed** = Missing GEMINI_API_KEY or Supabase credentials
❌ **"table not found"** = clinic_documents table not created in Supabase

## Steps to Fix:

1. Add all variables to `.env.local`
2. Restart dev server: `npm run dev`
3. Check server logs for: "✅ [ENV CHECK]" messages
4. Try uploading a document again
