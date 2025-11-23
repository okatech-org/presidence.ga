-- Add missing columns to knowledge_base for document indexing
ALTER TABLE public.knowledge_base
  ADD COLUMN IF NOT EXISTS file_path TEXT,
  ADD COLUMN IF NOT EXISTS file_type TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ready',
  ADD COLUMN IF NOT EXISTS access_level TEXT[] DEFAULT ARRAY['admin']::TEXT[];

-- Add index for status and access_level lookups
CREATE INDEX IF NOT EXISTS idx_knowledge_base_status ON public.knowledge_base(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_access_level ON public.knowledge_base USING GIN(access_level);