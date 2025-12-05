-- Add missing columns to mails table for complete mail system

-- Add envelope_scan_urls if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'mails' 
        AND column_name = 'envelope_scan_urls'
    ) THEN
        ALTER TABLE public.mails ADD COLUMN envelope_scan_urls TEXT[];
    END IF;
END $$;

-- Add content_scan_urls if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'mails' 
        AND column_name = 'content_scan_urls'
    ) THEN
        ALTER TABLE public.mails ADD COLUMN content_scan_urls TEXT[];
    END IF;
END $$;

-- Add deposited_at if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'mails' 
        AND column_name = 'deposited_at'
    ) THEN
        ALTER TABLE public.mails ADD COLUMN deposited_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add current_holder_service if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'mails' 
        AND column_name = 'current_holder_service'
    ) THEN
        ALTER TABLE public.mails ADD COLUMN current_holder_service TEXT;
    END IF;
END $$;

-- Add user_id if not exists (for linking to the user who deposited)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'mails' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.mails ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Update RLS policies for mails to include service-based access
DROP POLICY IF EXISTS "Service users can view mails for their service" ON public.mails;
CREATE POLICY "Service users can view mails for their service"
    ON public.mails FOR SELECT
    USING (
        current_holder_service IN (
            SELECT role::text FROM public.user_roles WHERE user_id = auth.uid()
        ) OR 
        user_id = auth.uid()
    );

-- Allow users to update mails they have access to
DROP POLICY IF EXISTS "Service users can update mails" ON public.mails;
CREATE POLICY "Service users can update mails"
    ON public.mails FOR UPDATE
    USING (
        current_holder_service IN (
            SELECT role::text FROM public.user_roles WHERE user_id = auth.uid()
        ) OR 
        user_id = auth.uid()
    );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_mails_current_holder_service ON public.mails(current_holder_service);
CREATE INDEX IF NOT EXISTS idx_mails_user_id ON public.mails(user_id);
CREATE INDEX IF NOT EXISTS idx_mails_deposited_at ON public.mails(deposited_at);

-- Ensure mail_routing has proper indexes
CREATE INDEX IF NOT EXISTS idx_mail_routing_mail_id ON public.mail_routing(mail_id);
CREATE INDEX IF NOT EXISTS idx_mail_routing_to_service ON public.mail_routing(to_service);
CREATE INDEX IF NOT EXISTS idx_mail_routing_from_service ON public.mail_routing(from_service);

-- Ensure mail_attachments has proper index
CREATE INDEX IF NOT EXISTS idx_mail_attachments_mail_id ON public.mail_attachments(mail_id);

-- Ensure mail_ai_analysis has proper index
CREATE INDEX IF NOT EXISTS idx_mail_ai_analysis_mail_id ON public.mail_ai_analysis(mail_id);

COMMENT ON COLUMN public.mails.envelope_scan_urls IS 'Array of URLs to scanned envelope images';
COMMENT ON COLUMN public.mails.content_scan_urls IS 'Array of URLs to scanned content/document images';
COMMENT ON COLUMN public.mails.deposited_at IS 'Timestamp when mail was physically deposited at reception';
COMMENT ON COLUMN public.mails.current_holder_service IS 'Current service holding this mail for processing';
COMMENT ON COLUMN public.mails.user_id IS 'User who deposited/registered the mail';