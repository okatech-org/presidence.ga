-- Create document_templates table
CREATE TABLE IF NOT EXISTS public.document_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    structure JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create service_document_settings table
CREATE TABLE IF NOT EXISTS public.service_document_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_role TEXT NOT NULL UNIQUE,
    header_text TEXT,
    sub_header_text TEXT,
    footer_text TEXT,
    logo_url TEXT,
    margins JSONB DEFAULT '{"top": 20, "bottom": 20, "left": 20, "right": 20}'::jsonb,
    primary_color TEXT DEFAULT '#000000',
    secondary_color TEXT DEFAULT '#666666',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_document_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_templates
CREATE POLICY "Admins can do everything on document_templates"
    ON public.document_templates
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'president')
        )
    );

CREATE POLICY "Everyone can read document_templates"
    ON public.document_templates
    FOR SELECT
    USING (true);

-- RLS Policies for service_document_settings
CREATE POLICY "Admins can do everything on service_document_settings"
    ON public.service_document_settings
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'president')
        )
    );

CREATE POLICY "Everyone can read service_document_settings"
    ON public.service_document_settings
    FOR SELECT
    USING (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.document_templates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_document_settings;

-- Insert default templates
INSERT INTO public.document_templates (name, description, structure) VALUES
('Lettre Officielle', 'Modèle standard pour la correspondance officielle', '{"sections": ["header", "recipient", "subject", "body", "signature", "footer"]}'),
('Note de Service', 'Communication interne', '{"sections": ["header", "title", "from", "to", "date", "body", "footer"]}'),
('Décret', 'Acte officiel du Président', '{"sections": ["header", "title", "preamble", "articles", "signature", "footer"]}'),
('Communiqué', 'Annonce publique', '{"sections": ["header", "title", "date", "body", "footer"]}');

-- Insert default settings for key services
INSERT INTO public.service_document_settings (service_role, header_text, sub_header_text, footer_text, primary_color) VALUES
('president', 'PRÉSIDENCE DE LA RÉPUBLIQUE', 'Cabinet du Président', 'Palais du Bord de Mer - Libreville, Gabon', '#003366'),
('admin', 'ADMINISTRATION SYSTÈME', 'Direction des Services Informatiques', 'Support Technique - support@presidence.ga', '#333333'),
('courrier', 'SERVICE COURRIERS', 'Bureau d''Ordre Central', 'Gestion des Flux Documentaires', '#006633'),
('reception', 'SERVICE RÉCEPTION', 'Accueil et Orientation', 'Service d''Accueil', '#663300');