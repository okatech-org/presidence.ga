-- Create Document Management System (GED) Schema
-- Phase 1: Core Tables for Mail Lifecycle and Document Organization

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE document_type AS ENUM ('courrier', 'file', 'note');
CREATE TYPE document_status AS ENUM ('deposited', 'scanned_envelope', 'opened', 'confidential_routed', 'read', 'archived');
CREATE TYPE folder_type AS ENUM ('system', 'custom');
CREATE TYPE document_action AS ENUM ('deposited', 'scanned', 'opened', 'transferred', 'read', 'classified', 'archived', 'confidential_marked');

-- ============================================
-- 1. DOCUMENTS TABLE (Main registry)
-- ============================================
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_number TEXT UNIQUE NOT NULL, -- DOC-2025-00001
    title TEXT,
    document_type document_type DEFAULT 'courrier',
    status document_status DEFAULT 'deposited',
    is_confidential BOOLEAN DEFAULT false,
    
    -- Sender information
    sender_name TEXT,
    sender_organization TEXT,
    
    -- Workflow tracking
    deposited_at TIMESTAMPTZ DEFAULT now(),
    deposited_by UUID REFERENCES auth.users(id),
    current_holder_service TEXT, -- 'reception', 'courriers', 'president', etc.
    assigned_to_user UUID REFERENCES auth.users(id),
    
    -- File storage
    envelope_scan_urls JSONB DEFAULT '[]'::jsonb, -- Array of storage URLs
    content_scan_urls JSONB DEFAULT '[]'::jsonb,
    
    -- AI and metadata
    metadata JSONB DEFAULT '{}'::jsonb, -- OCR text, AI classification, etc.
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_documents_status ON public.documents(status);
CREATE INDEX idx_documents_current_holder ON public.documents(current_holder_service);
CREATE INDEX idx_documents_assigned_to ON public.documents(assigned_to_user);
CREATE INDEX idx_documents_is_confidential ON public.documents(is_confidential);
CREATE INDEX idx_documents_created_at ON public.documents(created_at DESC);

-- ============================================
-- 2. DOCUMENT FOLDERS (Thematic organization)
-- ============================================
CREATE TABLE IF NOT EXISTS public.document_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    icon TEXT, -- Emoji or icon name
    folder_type folder_type DEFAULT 'custom',
    service_role TEXT, -- 'president', 'dgr', 'sec_gen', etc.
    created_by UUID REFERENCES auth.users(id),
    description TEXT,
    color TEXT, -- Hex color for UI (#3B82F6)
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_folders_service_role ON public.document_folders(service_role);
CREATE INDEX idx_folders_folder_type ON public.document_folders(folder_type);

-- ============================================
-- 3. DOCUMENT FOLDER ITEMS (M2M relationship)
-- ============================================
CREATE TABLE IF NOT EXISTS public.document_folder_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folder_id UUID NOT NULL REFERENCES public.document_folders(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    added_by UUID REFERENCES auth.users(id),
    added_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(folder_id, document_id)
);

CREATE INDEX idx_folder_items_folder ON public.document_folder_items(folder_id);
CREATE INDEX idx_folder_items_document ON public.document_folder_items(document_id);

-- ============================================
-- 4. DOCUMENT HISTORY (Audit trail)
-- ============================================
CREATE TABLE IF NOT EXISTS public.document_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    action document_action NOT NULL,
    performed_by UUID REFERENCES auth.users(id),
    from_status TEXT,
    to_status TEXT,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_history_document ON public.document_history(document_id);
CREATE INDEX idx_history_created_at ON public.document_history(created_at DESC);

-- ============================================
-- 5. RECEIPTS (Récépissés)
-- ============================================
CREATE TABLE IF NOT EXISTS public.receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number TEXT UNIQUE NOT NULL, -- REC-2025-00001
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    pdf_url TEXT,
    qr_code_data TEXT, -- Tracking URL or data
    issued_at TIMESTAMPTZ DEFAULT now(),
    issued_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_receipts_document ON public.receipts(document_id);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_folder_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- Documents: Users can see documents assigned to their service or user
CREATE POLICY "Users can view documents for their service"
ON public.documents FOR SELECT
TO authenticated
USING (
    -- User is assigned to this document
    assigned_to_user = auth.uid()
    OR
    -- User belongs to the service holding the document
    current_holder_service IN (
        SELECT role::text FROM public.user_roles WHERE user_id = auth.uid()
    )
    OR
    -- Admins can see all
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Documents: Service users can insert/update documents
CREATE POLICY "Service users can manage documents"
ON public.documents FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role IN ('reception', 'courrier', 'admin', 'president', 'dgr', 'sec_gen', 'dgss', 'protocol', 'minister')
    )
);

-- Folders: Users can see folders for their role or custom ones they created
CREATE POLICY "Users can view relevant folders"
ON public.document_folders FOR SELECT
TO authenticated
USING (
    -- Folders for user's role
    service_role IN (
        SELECT role::text FROM public.user_roles WHERE user_id = auth.uid()
    )
    OR
    -- Custom folders created by user
    (folder_type = 'custom' AND created_by = auth.uid())
    OR
    -- System folders (available to all)
    folder_type = 'system'
);

-- Folders: Users can create custom folders
CREATE POLICY "Users can create custom folders"
ON public.document_folders FOR INSERT
TO authenticated
WITH CHECK (
    folder_type = 'custom' AND created_by = auth.uid()
);

-- Folders: Users can update/delete their own custom folders
CREATE POLICY "Users can manage own custom folders"
ON public.document_folders FOR ALL
TO authenticated
USING (folder_type = 'custom' AND created_by = auth.uid());

-- Folder Items: Users can manage items in folders they have access to
CREATE POLICY "Users can manage folder items"
ON public.document_folder_items FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.document_folders
        WHERE id = folder_id
        AND (
            service_role IN (SELECT role::text FROM public.user_roles WHERE user_id = auth.uid())
            OR (folder_type = 'custom' AND created_by = auth.uid())
        )
    )
);

-- History: Read-only for users who can see the document
CREATE POLICY "Users can view document history"
ON public.document_history FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.documents d
        WHERE d.id = document_id
        AND (
            d.assigned_to_user = auth.uid()
            OR d.current_holder_service IN (
                SELECT role::text FROM public.user_roles WHERE user_id = auth.uid()
            )
        )
    )
);

-- Receipts: Users can view receipts they issued or for documents they have access to
CREATE POLICY "Users can view receipts"
ON public.receipts FOR SELECT
TO authenticated
USING (
    issued_by = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.documents d
        WHERE d.id = document_id
        AND (
            d.assigned_to_user = auth.uid()
            OR d.current_holder_service IN (
                SELECT role::text FROM public.user_roles WHERE user_id = auth.uid()
            )
        )
    )
);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to auto-generate document number
CREATE OR REPLACE FUNCTION generate_document_number()
RETURNS TEXT AS $$
DECLARE
    year TEXT;
    next_num INTEGER;
    doc_number TEXT;
BEGIN
    year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    
    -- Get the next sequence number for this year
    SELECT COALESCE(MAX(CAST(SUBSTRING(document_number FROM 10) AS INTEGER)), 0) + 1
    INTO next_num
    FROM public.documents
    WHERE document_number LIKE 'DOC-' || year || '-%';
    
    -- Format: DOC-2025-00001
    doc_number := 'DOC-' || year || '-' || LPAD(next_num::TEXT, 5, '0');
    
    RETURN doc_number;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-generate receipt number
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TEXT AS $$
DECLARE
    year TEXT;
    next_num INTEGER;
    receipt_number TEXT;
BEGIN
    year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(receipt_number FROM 10) AS INTEGER)), 0) + 1
    INTO next_num
    FROM public.receipts
    WHERE receipt_number LIKE 'REC-' || year || '-%';
    
    receipt_number := 'REC-' || year || '-' || LPAD(next_num::TEXT, 5, '0');
    
    RETURN receipt_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate document number
CREATE OR REPLACE FUNCTION set_document_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.document_number IS NULL OR NEW.document_number = '' THEN
        NEW.document_number := generate_document_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_document_number
    BEFORE INSERT ON public.documents
    FOR EACH ROW
    EXECUTE FUNCTION set_document_number();

-- Trigger to log document actions to history
CREATE OR REPLACE FUNCTION log_document_action()
RETURNS TRIGGER AS $$
BEGIN
    -- On INSERT, log 'deposited'
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.document_history (document_id, action, performed_by, to_status)
        VALUES (NEW.id, 'deposited', NEW.deposited_by, NEW.status::text);
    END IF;
    
    -- On UPDATE of status, log the transition
    IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.document_history (document_id, action, performed_by, from_status, to_status)
        VALUES (NEW.id, 'transferred', auth.uid(), OLD.status::text, NEW.status::text);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_document_action
    AFTER INSERT OR UPDATE ON public.documents
    FOR EACH ROW
    EXECUTE FUNCTION log_document_action();

-- Updated_at trigger for documents
CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON public.documents
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Updated_at trigger for folders
CREATE TRIGGER update_folders_updated_at
    BEFORE UPDATE ON public.document_folders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
