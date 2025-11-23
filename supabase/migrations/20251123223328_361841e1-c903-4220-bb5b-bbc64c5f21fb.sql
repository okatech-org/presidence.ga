-- Create system_settings table for global application configuration
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT NOT NULL UNIQUE,
    setting_value JSONB NOT NULL DEFAULT '{}'::jsonb,
    setting_type TEXT NOT NULL DEFAULT 'general',
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Admin can manage all settings
CREATE POLICY "Admins can manage system settings"
    ON public.system_settings FOR ALL
    USING (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can read public settings
CREATE POLICY "Users can read public settings"
    ON public.system_settings FOR SELECT
    USING (is_public = true OR has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_system_settings_updated_at
    BEFORE UPDATE ON public.system_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Insert default system settings
INSERT INTO public.system_settings (setting_key, setting_value, setting_type, description, is_public)
VALUES 
(
    'storage_limits',
    '{"max_conversation_messages": 50, "auto_cleanup_enabled": true, "cleanup_older_than_days": 30}'::jsonb,
    'conversations',
    'Limites de stockage et nettoyage automatique des conversations',
    false
),
(
    'pdf_generation',
    '{"default_template": "Le Républicain Moderne", "enable_watermark": true, "max_file_size_mb": 10}'::jsonb,
    'documents',
    'Paramètres de génération de documents PDF',
    false
),
(
    'audit_logging',
    '{"enabled": true, "retention_days": 90, "log_levels": ["info", "warning", "error"]}'::jsonb,
    'security',
    'Configuration des logs d''audit système',
    false
),
(
    'application_info',
    '{"app_name": "Présidence Digital", "version": "1.0.0", "maintenance_mode": false}'::jsonb,
    'general',
    'Informations générales de l''application',
    true
);

-- Create indexes
CREATE INDEX idx_system_settings_key ON public.system_settings(setting_key);
CREATE INDEX idx_system_settings_type ON public.system_settings(setting_type);

COMMENT ON TABLE public.system_settings IS 'Global system configuration settings';