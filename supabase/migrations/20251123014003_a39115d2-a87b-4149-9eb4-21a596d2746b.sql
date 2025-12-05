-- Add missing columns to documents table
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS deposited_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS envelope_scan_urls text[],
ADD COLUMN IF NOT EXISTS content_scan_urls text[];

-- Add missing column to document_folders table
ALTER TABLE document_folders
ADD COLUMN IF NOT EXISTS icon text;

-- Create mail_ai_analysis table
CREATE TABLE IF NOT EXISTS mail_ai_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mail_id uuid NOT NULL REFERENCES mails(id) ON DELETE CASCADE,
  summary text,
  urgency text,
  confidentiality_level text,
  suggested_routing text,
  key_points jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE mail_ai_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view mail analysis"
  ON mail_ai_analysis FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create mail analysis"
  ON mail_ai_analysis FOR INSERT
  WITH CHECK (true);

-- Create mail_attachments table
CREATE TABLE IF NOT EXISTS mail_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mail_id uuid NOT NULL REFERENCES mails(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text,
  file_size bigint,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE mail_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view attachments"
  ON mail_attachments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create attachments"
  ON mail_attachments FOR INSERT
  WITH CHECK (true);

-- Create mail_routing table
CREATE TABLE IF NOT EXISTS mail_routing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mail_id uuid NOT NULL REFERENCES mails(id) ON DELETE CASCADE,
  from_service text,
  to_service text NOT NULL,
  routed_by uuid,
  routed_at timestamp with time zone DEFAULT now(),
  notes text
);

ALTER TABLE mail_routing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view routing"
  ON mail_routing FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create routing"
  ON mail_routing FOR INSERT
  WITH CHECK (true);