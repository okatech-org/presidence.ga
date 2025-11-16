-- Fix search_path for existing functions
DROP FUNCTION IF EXISTS public.update_iasted_config_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION public.update_iasted_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- Recreate trigger
CREATE TRIGGER update_iasted_config_updated_at
  BEFORE UPDATE ON public.iasted_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_iasted_config_updated_at();