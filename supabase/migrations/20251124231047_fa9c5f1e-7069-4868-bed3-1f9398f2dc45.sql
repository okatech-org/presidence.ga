-- Créer table de configuration pour le scraping automatique
CREATE TABLE IF NOT EXISTS public.intelligence_scraping_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled BOOLEAN DEFAULT true,
  frequency_hours INTEGER DEFAULT 72, -- 3 jours par défaut
  next_run_at TIMESTAMPTZ DEFAULT now(),
  last_run_at TIMESTAMPTZ,
  social_networks JSONB DEFAULT '{"facebook": true, "tiktok": true, "youtube": true, "x": true}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insérer configuration par défaut
INSERT INTO public.intelligence_scraping_config (id, enabled, frequency_hours, next_run_at)
SELECT '00000000-0000-0000-0000-000000000001', true, 72, now()
WHERE NOT EXISTS (SELECT 1 FROM public.intelligence_scraping_config WHERE id = '00000000-0000-0000-0000-000000000001');

-- Enable RLS
ALTER TABLE public.intelligence_scraping_config ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admin can view scraping config"
  ON public.intelligence_scraping_config
  FOR SELECT
  USING (true);

CREATE POLICY "Admin can update scraping config"
  ON public.intelligence_scraping_config
  FOR UPDATE
  USING (true);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_intelligence_scraping_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER intelligence_scraping_config_updated_at
  BEFORE UPDATE ON public.intelligence_scraping_config
  FOR EACH ROW
  EXECUTE FUNCTION update_intelligence_scraping_config_updated_at();

-- Supprimer l'ancienne contrainte de type et en créer une nouvelle
ALTER TABLE public.intelligence_sources DROP CONSTRAINT IF EXISTS intelligence_sources_type_check;
ALTER TABLE public.intelligence_sources ADD CONSTRAINT intelligence_sources_type_check 
  CHECK (type IN ('rss', 'web', 'social', 'api'));

-- Ajouter contrainte unique sur URL
ALTER TABLE public.intelligence_sources ADD CONSTRAINT intelligence_sources_url_unique UNIQUE (url);

-- Ajouter les nouvelles sources de réseaux sociaux
INSERT INTO public.intelligence_sources (name, type, url, status) VALUES
  ('Facebook Gabon', 'social', 'https://facebook.com/search/top/?q=gabon', 'active'),
  ('TikTok Gabon', 'social', 'https://tiktok.com/search?q=gabon', 'active'),
  ('YouTube Gabon', 'social', 'https://youtube.com/results?search_query=gabon', 'active'),
  ('X (Twitter) Gabon', 'social', 'https://x.com/search?q=gabon', 'active')
ON CONFLICT (url) DO NOTHING;