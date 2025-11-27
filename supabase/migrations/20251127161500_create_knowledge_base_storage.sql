-- Create storage bucket for knowledge base documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'knowledge-base',
    'knowledge-base',
    false,
    52428800, -- 50MB limit
    ARRAY['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for knowledge-base bucket
CREATE POLICY "Admins can upload knowledge base documents"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'knowledge-base' AND
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'president')
        )
    );

CREATE POLICY "Admins can read knowledge base documents"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'knowledge-base' AND
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'president')
        )
    );

CREATE POLICY "Admins can delete knowledge base documents"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'knowledge-base' AND
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'president')
        )
    );

-- Create knowledge_base_chunks table for RAG
CREATE TABLE IF NOT EXISTS public.knowledge_base_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES public.knowledge_base(id) ON DELETE CASCADE,
    content TEXT,
    embedding vector(1536),
    chunk_index INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for similarity search
CREATE INDEX IF NOT EXISTS knowledge_base_chunks_embedding_idx ON public.knowledge_base_chunks 
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Enable RLS
ALTER TABLE public.knowledge_base_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view chunks"
    ON public.knowledge_base_chunks FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'president')
        )
    );

-- Function to match knowledge base chunks
CREATE OR REPLACE FUNCTION match_knowledge_base(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  content text,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kbc.id,
    kbc.document_id,
    kbc.content,
    1 - (kbc.embedding <=> query_embedding) as similarity
  FROM knowledge_base_chunks kbc
  WHERE 1 - (kbc.embedding <=> query_embedding) > match_threshold
  ORDER BY kbc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
