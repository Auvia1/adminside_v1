-- Create clinic_knowledge table for storing embedded documents
CREATE TABLE IF NOT EXISTS clinic_knowledge (
  id BIGSERIAL PRIMARY KEY,
  clinic_id TEXT,
  file_name TEXT,
  chunk_text TEXT NOT NULL,
  embedding VECTOR(768),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS clinic_knowledge_clinic_id_idx ON clinic_knowledge(clinic_id);
CREATE INDEX IF NOT EXISTS clinic_knowledge_file_name_idx ON clinic_knowledge(file_name);

-- Enable pgvector extension (run this first if not already enabled)
-- CREATE EXTENSION IF NOT EXISTS vector;
