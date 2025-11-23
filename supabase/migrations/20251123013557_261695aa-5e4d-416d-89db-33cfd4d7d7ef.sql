-- Create missing tables for document and mail management - CORRECTED

-- Create ENUM types if they don't exist
DO $$ BEGIN
    CREATE TYPE document_type AS ENUM ('courrier', 'file', 'note');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE document_status AS ENUM ('deposited', 'scanned_envelope', 'opened', 'confidential_routed', 'read', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE folder_type AS ENUM ('system', 'custom');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE document_action AS ENUM ('deposited', 'scanned', 'opened', 'transferred', 'read', 'classified', 'archived', 'confidential_marked');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE mail_status AS ENUM ('received', 'scanning', 'analyzing', 'pending_validation', 'validated', 'distributed', 'processed', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create sequences FIRST
CREATE SEQUENCE IF NOT EXISTS doc_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS mail_tracking_seq START 1;

-- Create documents table
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_number TEXT UNIQUE NOT NULL DEFAULT 'DOC-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('doc_number_seq')::TEXT, 5, '0'),
    title TEXT,
    document_type document_type DEFAULT 'courrier',
    status document_status DEFAULT 'deposited',
    is_confidential BOOLEAN DEFAULT false,
    sender_name TEXT,
    sender_organization TEXT,
    current_holder_service TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    filename TEXT,
    file_path TEXT,
    file_type TEXT,
    file_size BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create mails table
CREATE TABLE IF NOT EXISTS public.mails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_number TEXT UNIQUE NOT NULL DEFAULT 'GA-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('mail_tracking_seq')::TEXT, 5, '0'),
    sender_name TEXT,
    sender_organization TEXT,
    reception_date TIMESTAMPTZ DEFAULT NOW(),
    status mail_status DEFAULT 'received',
    subject TEXT,
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create document_folders table
CREATE TABLE IF NOT EXISTS public.document_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    folder_type folder_type DEFAULT 'custom',
    service_role TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create document_folder_items table (junction table)
CREATE TABLE IF NOT EXISTS public.document_folder_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folder_id UUID REFERENCES public.document_folders(id) ON DELETE CASCADE NOT NULL,
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(folder_id, document_id)
);

-- Create document_history table
CREATE TABLE IF NOT EXISTS public.document_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
    action document_action NOT NULL,
    performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_folder_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for documents
CREATE POLICY "Users can view documents they created or are assigned to" 
ON public.documents FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR current_holder_service IN (
    SELECT role::text FROM user_roles WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create documents" 
ON public.documents FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their documents" 
ON public.documents FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- RLS Policies for mails
CREATE POLICY "Authenticated users can view mails" 
ON public.mails FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create mails" 
ON public.mails FOR INSERT
TO authenticated
WITH CHECK (true);

-- RLS Policies for document_folders
CREATE POLICY "Users can view their folders or role folders" 
ON public.document_folders FOR SELECT
TO authenticated
USING (created_by = auth.uid() OR service_role IN (
    SELECT role::text FROM user_roles WHERE user_id = auth.uid()
) OR service_role IS NULL);

CREATE POLICY "Users can create folders" 
ON public.document_folders FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- RLS Policies for document_folder_items
CREATE POLICY "Users can view folder items for accessible folders" 
ON public.document_folder_items FOR SELECT
TO authenticated
USING (EXISTS (
    SELECT 1 FROM document_folders 
    WHERE id = folder_id 
    AND (created_by = auth.uid() OR service_role IN (
        SELECT role::text FROM user_roles WHERE user_id = auth.uid()
    ))
));

CREATE POLICY "Users can add items to their folders" 
ON public.document_folder_items FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
    SELECT 1 FROM document_folders 
    WHERE id = folder_id AND created_by = auth.uid()
));

-- RLS Policies for document_history
CREATE POLICY "Users can view history of accessible documents" 
ON public.document_history FOR SELECT
TO authenticated
USING (EXISTS (
    SELECT 1 FROM documents 
    WHERE id = document_id 
    AND (user_id = auth.uid() OR current_holder_service IN (
        SELECT role::text FROM user_roles WHERE user_id = auth.uid()
    ))
));

CREATE POLICY "Users can create history entries" 
ON public.document_history FOR INSERT
TO authenticated
WITH CHECK (performed_by = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_holder_service ON public.documents(current_holder_service);
CREATE INDEX IF NOT EXISTS idx_mails_status ON public.mails(status);
CREATE INDEX IF NOT EXISTS idx_document_folders_service_role ON public.document_folders(service_role);
CREATE INDEX IF NOT EXISTS idx_document_folder_items_folder_id ON public.document_folder_items(folder_id);
CREATE INDEX IF NOT EXISTS idx_document_folder_items_document_id ON public.document_folder_items(document_id);
CREATE INDEX IF NOT EXISTS idx_document_history_document_id ON public.document_history(document_id);