-- Fix security warnings for intelligence functions
-- Set search_path to prevent search_path-based attacks

-- Update query_intelligence function with security definer
DROP FUNCTION IF EXISTS public.query_intelligence(vector, double precision, integer);

CREATE OR REPLACE FUNCTION public.query_intelligence(
    query_embedding vector(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    summary TEXT,
    category TEXT,
    sentiment TEXT,
    entities JSONB,
    author TEXT,
    published_at TIMESTAMPTZ,
    similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        intelligence_items.id,
        intelligence_items.content,
        intelligence_items.summary,
        intelligence_items.category,
        intelligence_items.sentiment,
        intelligence_items.entities,
        intelligence_items.author,
        intelligence_items.published_at,
        1 - (intelligence_items.embedding <=> query_embedding) AS similarity
    FROM public.intelligence_items
    WHERE intelligence_items.embedding IS NOT NULL
        AND 1 - (intelligence_items.embedding <=> query_embedding) > match_threshold
    ORDER BY intelligence_items.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Update update_intelligence_updated_at trigger function with security definer
DROP FUNCTION IF EXISTS public.update_intelligence_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION public.update_intelligence_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Recreate triggers since we dropped the function with CASCADE
CREATE TRIGGER update_intelligence_sources_updated_at
    BEFORE UPDATE ON public.intelligence_sources
    FOR EACH ROW
    EXECUTE FUNCTION public.update_intelligence_updated_at();

CREATE TRIGGER update_intelligence_items_updated_at
    BEFORE UPDATE ON public.intelligence_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_intelligence_updated_at();