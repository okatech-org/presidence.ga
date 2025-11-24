-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Update intelligence_sources table (add missing columns if needed)
ALTER TABLE intelligence_sources 
  ADD COLUMN IF NOT EXISTS last_crawled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'error'));

-- Update intelligence_items table structure
ALTER TABLE intelligence_items
  ADD COLUMN IF NOT EXISTS category TEXT CHECK (category IN ('securite', 'economie', 'social', 'politique', 'rumeur', 'autre')),
  ADD COLUMN IF NOT EXISTS sentiment TEXT CHECK (sentiment IN ('positif', 'negatif', 'neutre', 'colere', 'peur', 'joie')),
  ADD COLUMN IF NOT EXISTS summary TEXT,
  ADD COLUMN IF NOT EXISTS entities JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS external_id TEXT UNIQUE; -- For deduplication

-- Create index on embedding for faster similarity search
CREATE INDEX IF NOT EXISTS intelligence_items_embedding_idx ON intelligence_items 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create index on category and sentiment for filtering
CREATE INDEX IF NOT EXISTS intelligence_items_category_idx ON intelligence_items(category);
CREATE INDEX IF NOT EXISTS intelligence_items_sentiment_idx ON intelligence_items(sentiment);
CREATE INDEX IF NOT EXISTS intelligence_items_published_at_idx ON intelligence_items(published_at DESC);

-- Function for vector similarity search
CREATE OR REPLACE FUNCTION query_intelligence(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  content text,
  summary text,
  category text,
  sentiment text,
  entities jsonb,
  author text,
  published_at timestamptz,
  similarity float
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
    1 - (intelligence_items.embedding <=> query_embedding) as similarity
  FROM intelligence_items
  WHERE intelligence_items.embedding IS NOT NULL
    AND 1 - (intelligence_items.embedding <=> query_embedding) > match_threshold
  ORDER BY intelligence_items.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_intelligence_updated_at()
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

DROP TRIGGER IF EXISTS update_intelligence_items_updated_at ON intelligence_items;
CREATE TRIGGER update_intelligence_items_updated_at
  BEFORE UPDATE ON intelligence_items
  FOR EACH ROW
  EXECUTE FUNCTION update_intelligence_updated_at();

-- RLS policies remain as configured