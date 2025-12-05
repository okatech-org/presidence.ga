-- Enhance audit_logs table for comprehensive system action tracking
-- Add columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'audit_logs' 
        AND column_name = 'severity'
    ) THEN
        ALTER TABLE public.audit_logs ADD COLUMN severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical'));
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'audit_logs' 
        AND column_name = 'success'
    ) THEN
        ALTER TABLE public.audit_logs ADD COLUMN success BOOLEAN DEFAULT true;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'audit_logs' 
        AND column_name = 'duration_ms'
    ) THEN
        ALTER TABLE public.audit_logs ADD COLUMN duration_ms INTEGER;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'audit_logs' 
        AND column_name = 'user_agent'
    ) THEN
        ALTER TABLE public.audit_logs ADD COLUMN user_agent TEXT;
    END IF;
END $$;

-- Create helper function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event(
    p_user_id UUID,
    p_action TEXT,
    p_resource TEXT,
    p_details JSONB DEFAULT '{}'::jsonb,
    p_ip_address TEXT DEFAULT NULL,
    p_severity TEXT DEFAULT 'info',
    p_success BOOLEAN DEFAULT true
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO public.audit_logs (
        user_id,
        action,
        resource,
        details,
        ip_address,
        severity,
        success
    ) VALUES (
        p_user_id,
        p_action,
        p_resource,
        p_details,
        p_ip_address,
        p_severity,
        p_success
    ) RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$;

-- Create indexes for audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON public.audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_success ON public.audit_logs(success);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs(resource);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

-- Update RLS to allow president to view audit logs
DROP POLICY IF EXISTS "President can view audit logs" ON public.audit_logs;
CREATE POLICY "President can view audit logs"
    ON public.audit_logs FOR SELECT
    USING (
        has_role(auth.uid(), 'admin'::app_role) OR 
        is_president(auth.uid())
    );

COMMENT ON FUNCTION public.log_audit_event IS 'Helper function to create audit log entries with standardized format';