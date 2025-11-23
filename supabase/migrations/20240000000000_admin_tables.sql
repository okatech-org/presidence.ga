-- Create system_config table
CREATE TABLE IF NOT EXISTS public.system_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_by UUID REFERENCES auth.users(id)
);

-- Create knowledge_base table
CREATE TABLE IF NOT EXISTS public.knowledge_base (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'indexing', -- 'indexing', 'ready', 'error'
    access_level TEXT[] DEFAULT '{admin,president}', -- Roles that can access
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for system_config
CREATE POLICY "Admins can do everything on system_config"
    ON public.system_config
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'president')
        )
    );

CREATE POLICY "Everyone can read system_config"
    ON public.system_config
    FOR SELECT
    USING (true);

-- RLS Policies for knowledge_base
CREATE POLICY "Admins can do everything on knowledge_base"
    ON public.knowledge_base
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'president')
        )
    );

CREATE POLICY "Users can read accessible knowledge_base items"
    ON public.knowledge_base
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = ANY(access_level)
        )
    );

-- RLS Policies for audit_logs
CREATE POLICY "Admins can read audit_logs"
    ON public.audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'president')
        )
    );

CREATE POLICY "System can insert audit_logs"
    ON public.audit_logs
    FOR INSERT
    WITH CHECK (true); -- Ideally restricted to service role, but for now allow authenticated users to log their actions via API if needed, or rely on backend triggers.

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_config;
ALTER PUBLICATION supabase_realtime ADD TABLE public.knowledge_base;
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
