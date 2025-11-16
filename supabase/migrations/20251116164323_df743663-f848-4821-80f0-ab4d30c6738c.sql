-- Table pour stocker la configuration de l'agent iAsted
CREATE TABLE IF NOT EXISTS public.iasted_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id TEXT,
  agent_name TEXT DEFAULT 'iAsted',
  president_voice_id TEXT DEFAULT '9BWtsMINqrJLrRacOk9x',
  minister_voice_id TEXT DEFAULT 'EXAVITQu4vr4xnSDxMaL',
  default_voice_id TEXT DEFAULT 'Xb7hH8MSUJpSbSDYk0k2',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE public.iasted_config ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire la config
CREATE POLICY "Anyone can read iasted config"
  ON public.iasted_config
  FOR SELECT
  USING (true);

-- Seuls les admins/présidents peuvent modifier
CREATE POLICY "Admins can update iasted config"
  ON public.iasted_config
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'president')
    )
  );

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION public.update_iasted_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_iasted_config_updated_at
  BEFORE UPDATE ON public.iasted_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_iasted_config_updated_at();

-- Insérer une config par défaut
INSERT INTO public.iasted_config (agent_name)
VALUES ('iAsted')
ON CONFLICT DO NOTHING;