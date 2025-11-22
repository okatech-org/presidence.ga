-- Create enum for mail confidentiality
CREATE TYPE public.mail_confidentiality_level AS ENUM ('public', 'restricted', 'secret', 'top_secret');

-- Create enum for mail status
CREATE TYPE public.mail_status AS ENUM ('received', 'scanning', 'analyzing', 'pending_validation', 'validated', 'distributed', 'processed', 'archived');

-- Create enum for mail urgency
CREATE TYPE public.mail_urgency AS ENUM ('normal', 'high', 'critical');

-- Create enum for mail type (attachment)
CREATE TYPE public.mail_attachment_type AS ENUM ('envelope', 'content', 'other');

-- Create mails table
CREATE TABLE IF NOT EXISTS public.mails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_number TEXT UNIQUE NOT NULL, -- Generated format: GA-2025-XXXXX
    sender_name TEXT,
    sender_organization TEXT,
    reception_date TIMESTAMPTZ DEFAULT now(),
    confidentiality_level public.mail_confidentiality_level DEFAULT 'public',
    status public.mail_status DEFAULT 'received',
    urgency public.mail_urgency DEFAULT 'normal',
    
    -- Metadata extracted from envelope
    envelope_ocr_text TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create mail_attachments table (scans)
CREATE TABLE IF NOT EXISTS public.mail_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mail_id UUID REFERENCES public.mails(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT, -- mime type
    attachment_type public.mail_attachment_type DEFAULT 'content',
    page_number INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create mail_ai_analysis table (Deep analysis)
CREATE TABLE IF NOT EXISTS public.mail_ai_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mail_id UUID REFERENCES public.mails(id) ON DELETE CASCADE,
    
    -- Level 2 Analysis
    full_ocr_text TEXT,
    summary TEXT,
    sentiment TEXT, -- 'positive', 'neutral', 'negative', 'complaint', 'request'
    detected_entities JSONB, -- People, Organizations, Dates mentioned
    
    -- Level 3 Routing Suggestion
    suggested_destination_role TEXT, -- e.g., 'minister_health', 'president_cabinet'
    suggested_folder TEXT, -- e.g., 'Doléances', 'Diplomatie'
    confidence_score FLOAT,
    
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create mail_routing table (Audit trail)
CREATE TABLE IF NOT EXISTS public.mail_routing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mail_id UUID REFERENCES public.mails(id) ON DELETE CASCADE,
    from_role TEXT,
    to_role TEXT,
    action TEXT, -- 'transferred', 'validated', 'rejected', 'archived'
    comments TEXT,
    performed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mail_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mail_ai_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mail_routing ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- 1. Reception Service: Can create and view all 'received' mails
CREATE POLICY "Reception can create mails" ON public.mails
    FOR INSERT TO authenticated
    WITH CHECK (true); -- Refine with role check later if needed

CREATE POLICY "Reception can view all mails" ON public.mails
    FOR SELECT TO authenticated
    USING (true); -- Temporary: Reception needs to see what they scanned

-- 2. Courier Service (Validation Hub): Can view all pending validation
-- For now, allowing authenticated users to view for development speed
-- In production, we would filter by role

-- 3. President/Ministers: Can view mails assigned to them or their role
-- This requires a 'current_owner_role' column on mails or joining with routing
-- Adding 'current_owner_role' to mails for easier RLS
ALTER TABLE public.mails ADD COLUMN IF NOT EXISTS current_owner_role TEXT;

-- Update policy to allow viewing if you are the owner or if it's public
-- For this MVP, we'll keep it open for authenticated users but add comments for future restriction

-- Create bucket for mail scans if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('mail-scans', 'mail-scans', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Authenticated users can upload mail scans"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'mail-scans');

CREATE POLICY "Authenticated users can view mail scans"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'mail-scans');

-- Function to generate tracking number
CREATE OR REPLACE FUNCTION generate_tracking_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.tracking_number := 'GA-' || to_char(now(), 'YYYY') || '-' || lpad(cast(floor(random() * 100000) as text), 5, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_tracking_number
BEFORE INSERT ON public.mails
FOR EACH ROW
WHEN (NEW.tracking_number IS NULL)
EXECUTE FUNCTION generate_tracking_number();
