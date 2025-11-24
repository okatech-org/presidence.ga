-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create intelligence_sources table
CREATE TABLE IF NOT EXISTS public.intelligence_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('whatsapp_group', 'web_search', 'youtube_channel')),
    url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
    last_crawled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create intelligence_items table with vector embedding
CREATE TABLE IF NOT EXISTS public.intelligence_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES public.intelligence_sources(id) ON DELETE SET NULL,
    external_id TEXT UNIQUE,
    content TEXT NOT NULL,
    summary TEXT,
    category TEXT CHECK (category IN ('securite', 'economie', 'social', 'politique', 'rumeur', 'autre')),
    sentiment TEXT CHECK (sentiment IN ('positif', 'negatif', 'neutre', 'colere', 'peur', 'joie')),
    entities JSONB DEFAULT '[]'::jsonb,
    author TEXT,
    published_at TIMESTAMPTZ DEFAULT now(),
    embedding vector(1536),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_intelligence_items_category ON public.intelligence_items(category);
CREATE INDEX IF NOT EXISTS idx_intelligence_items_sentiment ON public.intelligence_items(sentiment);
CREATE INDEX IF NOT EXISTS idx_intelligence_items_published_at ON public.intelligence_items(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_intelligence_items_source_id ON public.intelligence_items(source_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_sources_status ON public.intelligence_sources(status);

-- Create vector similarity search index (using ivfflat for better performance)
CREATE INDEX IF NOT EXISTS idx_intelligence_items_embedding ON public.intelligence_items 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Enable Row Level Security
ALTER TABLE public.intelligence_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intelligence_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for intelligence_sources
CREATE POLICY "Admins can manage intelligence sources" ON public.intelligence_sources
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = ANY(ARRAY['admin'::app_role, 'dgss'::app_role])
        )
    );

CREATE POLICY "Service role can manage sources" ON public.intelligence_sources
    FOR ALL USING (true);

-- RLS Policies for intelligence_items
CREATE POLICY "Admins can view intelligence items" ON public.intelligence_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = ANY(ARRAY['admin'::app_role, 'dgss'::app_role, 'president'::app_role])
        )
    );

CREATE POLICY "Service role can manage items" ON public.intelligence_items
    FOR ALL USING (true);

-- Create function for vector similarity search
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

-- Enable realtime for intelligence_items
ALTER PUBLICATION supabase_realtime ADD TABLE public.intelligence_items;

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_intelligence_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_intelligence_sources_updated_at
    BEFORE UPDATE ON public.intelligence_sources
    FOR EACH ROW
    EXECUTE FUNCTION public.update_intelligence_updated_at();

CREATE TRIGGER update_intelligence_items_updated_at
    BEFORE UPDATE ON public.intelligence_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_intelligence_updated_at();