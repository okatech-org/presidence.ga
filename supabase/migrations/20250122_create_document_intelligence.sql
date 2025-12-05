-- Migration: Document Intelligence System
-- Description: Tables pour l'upload, analyse OCR et intelligence documentaire

-- 1. Table principale des documents uploadés
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  filename text NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL,
  file_size bigint NOT NULL,
  upload_source text DEFAULT 'manual', -- 'manual', 'email', 'auto'
  status text DEFAULT 'uploaded', -- 'uploaded', 'processing', 'analyzed', 'error'
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index pour recherche rapide par utilisateur et statut
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);

-- 2. Table d'analyse des documents
CREATE TABLE IF NOT EXISTS document_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
  extracted_text text,
  key_points jsonb, -- [{topic: string, importance: number, summary: string}]
  entities jsonb,   -- {persons: [], places: [], dates: [], organizations: []}
  sentiment text,   -- 'positive' | 'neutral' | 'negative'
  urgency_score int CHECK (urgency_score >= 0 AND urgency_score <= 10),
  suggested_action text,
  action_items jsonb, -- [{action: string, priority: number, deadline: string}]
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_document_analysis_document_id ON document_analysis(document_id);
CREATE INDEX IF NOT EXISTS idx_document_analysis_urgency ON document_analysis(urgency_score DESC);

-- 3. Table des actions à prendre
CREATE TABLE IF NOT EXISTS action_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL, -- 'document', 'conversation', 'auto'
  source_id uuid,
  action_type text NOT NULL, -- 'respond', 'delegate', 'review', 'urgent', 'archive'
  priority int CHECK (priority >= 1 AND priority <= 5),
  assigned_to uuid REFERENCES auth.users(id),
  description text NOT NULL,
  due_date timestamptz,
  status text DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
  ai_suggested boolean DEFAULT true,
  metadata jsonb, -- Données additionnelles flexibles
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_action_items_assigned_to ON action_items(assigned_to);
CREATE INDEX IF NOT EXISTS idx_action_items_status ON action_items(status);
CREATE INDEX IF NOT EXISTS idx_action_items_priority ON action_items(priority DESC);
CREATE INDEX IF NOT EXISTS idx_action_items_due_date ON action_items(due_date);

-- 4. Table des embeddings pour recherche sémantique
-- Requires pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS document_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index int NOT NULL, -- Pour les documents découpés en chunks
  chunk_text text NOT NULL,
  embedding vector(1536), -- OpenAI ada-002 embeddings (1536 dimensions)
  created_at timestamptz DEFAULT now()
);

-- Index IVFFlat pour recherche vectorielle rapide
CREATE INDEX IF NOT EXISTS idx_document_embeddings_vector 
  ON document_embeddings USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_document_embeddings_document_id ON document_embeddings(document_id);

-- 5. Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_analysis_updated_at BEFORE UPDATE ON document_analysis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_action_items_updated_at BEFORE UPDATE ON action_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Row Level Security (RLS)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_embeddings ENABLE ROW LEVEL SECURITY;

-- Policies pour documents
CREATE POLICY "Users can view their own documents"
  ON documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents"
  ON documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
  ON documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
  ON documents FOR DELETE
  USING (auth.uid() = user_id);

-- Policies pour document_analysis
CREATE POLICY "Users can view analysis of their documents"
  ON document_analysis FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM documents
    WHERE documents.id = document_analysis.document_id
    AND documents.user_id = auth.uid()
  ));

CREATE POLICY "Service role can insert document analysis"
  ON document_analysis FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update document analysis"
  ON document_analysis FOR UPDATE
  USING (true);

-- Policies pour action_items
CREATE POLICY "Users can view their assigned action items"
  ON action_items FOR SELECT
  USING (assigned_to = auth.uid());

CREATE POLICY "Service role can manage action items"
  ON action_items FOR ALL
  USING (true);

-- Policies pour document_embeddings
CREATE POLICY "Users can view embeddings of their documents"
  ON document_embeddings FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM documents
    WHERE documents.id = document_embeddings.document_id
    AND documents.user_id = auth.uid()
  ));

CREATE POLICY "Service role can manage embeddings"
  ON document_embeddings FOR ALL
  USING (true);

-- 7. Fonction de recherche sémantique
CREATE OR REPLACE FUNCTION search_documents_semantic(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  document_id uuid,
  chunk_text text,
  similarity float
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    de.document_id,
    de.chunk_text,
    1 - (de.embedding <=> query_embedding) AS similarity
  FROM document_embeddings de
  WHERE 1 - (de.embedding <=> query_embedding) > match_threshold
  ORDER BY de.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- 8. Fonction pour obtenir les documents urgents
CREATE OR REPLACE FUNCTION get_urgent_documents(user_uuid uuid)
RETURNS TABLE (
  document_id uuid,
  filename text,
  urgency_score int,
  suggested_action text,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.filename,
    da.urgency_score,
    da.suggested_action,
    d.created_at
  FROM documents d
  INNER JOIN document_analysis da ON d.id = da.document_id
  WHERE d.user_id = user_uuid
    AND da.urgency_score >= 7
    AND d.status = 'analyzed'
  ORDER BY da.urgency_score DESC, d.created_at DESC;
END;
$$ LANGUAGE plpgsql;
