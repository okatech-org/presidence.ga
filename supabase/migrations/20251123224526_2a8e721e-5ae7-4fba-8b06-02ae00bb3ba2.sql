-- Create remaining missing tables for all services

-- Table: Protocol Procedures
CREATE TABLE IF NOT EXISTS public.protocol_procedures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'ceremonial' CHECK (category IN ('ceremonial', 'diplomatic', 'security', 'logistics')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: Official Decrees (Secretariat General)
CREATE TABLE IF NOT EXISTS public.official_decrees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    reference_number TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_signature', 'signed', 'published')),
    signature_date TIMESTAMP WITH TIME ZONE,
    publication_date TIMESTAMP WITH TIME ZONE,
    type TEXT NOT NULL DEFAULT 'decree' CHECK (type IN ('decree', 'order', 'decision', 'circular')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: Legal Reviews (Secretariat General)
CREATE TABLE IF NOT EXISTS public.legal_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_title TEXT NOT NULL,
    requestor TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'completed')),
    assigned_to TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: Administrative Archives (Secretariat General)
CREATE TABLE IF NOT EXISTS public.administrative_archives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    reference_code TEXT NOT NULL UNIQUE,
    archiving_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    access_level TEXT NOT NULL DEFAULT 'public' CHECK (access_level IN ('public', 'restricted', 'confidential', 'secret')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.protocol_procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.official_decrees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.administrative_archives ENABLE ROW LEVEL SECURITY;

-- RLS Policies for protocol_procedures
CREATE POLICY "Protocol can manage procedures"
    ON public.protocol_procedures FOR ALL
    USING (
        has_role(auth.uid(), 'protocol'::app_role) OR 
        has_role(auth.uid(), 'admin'::app_role)
    );

CREATE POLICY "All authenticated can view procedures"
    ON public.protocol_procedures FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- RLS Policies for official_decrees
CREATE POLICY "Secretariat can manage decrees"
    ON public.official_decrees FOR ALL
    USING (
        has_role(auth.uid(), 'sec_gen'::app_role) OR 
        has_role(auth.uid(), 'admin'::app_role)
    );

CREATE POLICY "All authenticated can view decrees"
    ON public.official_decrees FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- RLS Policies for legal_reviews
CREATE POLICY "Secretariat can manage reviews"
    ON public.legal_reviews FOR ALL
    USING (
        has_role(auth.uid(), 'sec_gen'::app_role) OR 
        has_role(auth.uid(), 'admin'::app_role)
    );

CREATE POLICY "All authenticated can view reviews"
    ON public.legal_reviews FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- RLS Policies for administrative_archives
CREATE POLICY "Secretariat can manage archives"
    ON public.administrative_archives FOR ALL
    USING (
        has_role(auth.uid(), 'sec_gen'::app_role) OR 
        has_role(auth.uid(), 'admin'::app_role)
    );

CREATE POLICY "Users can view archives based on access level"
    ON public.administrative_archives FOR SELECT
    USING (
        access_level = 'public' OR
        (access_level = 'restricted' AND auth.uid() IS NOT NULL) OR
        (access_level IN ('confidential', 'secret') AND (
            has_role(auth.uid(), 'admin'::app_role) OR 
            has_role(auth.uid(), 'sec_gen'::app_role) OR
            is_president(auth.uid())
        ))
    );

-- Create indexes
CREATE INDEX idx_protocol_procedures_category ON public.protocol_procedures(category);
CREATE INDEX idx_official_decrees_status ON public.official_decrees(status);
CREATE INDEX idx_official_decrees_type ON public.official_decrees(type);
CREATE INDEX idx_official_decrees_reference ON public.official_decrees(reference_number);
CREATE INDEX idx_legal_reviews_status ON public.legal_reviews(status);
CREATE INDEX idx_legal_reviews_priority ON public.legal_reviews(priority);
CREATE INDEX idx_administrative_archives_category ON public.administrative_archives(category);
CREATE INDEX idx_administrative_archives_access_level ON public.administrative_archives(access_level);
CREATE INDEX idx_administrative_archives_reference ON public.administrative_archives(reference_code);