-- Add cost limit and AI providers to scraping config
ALTER TABLE public.intelligence_scraping_config 
ADD COLUMN IF NOT EXISTS max_cost_limit DECIMAL(10, 2) DEFAULT 10.00,
ADD COLUMN IF NOT EXISTS ai_providers TEXT[] DEFAULT ARRAY['gpt']::TEXT[];

-- Update default enabled status to false for new rows (and existing if needed, but usually we keep existing as is unless specified)
-- User asked for "disabled by default", which implies the column default should be false.
ALTER TABLE public.intelligence_scraping_config 
ALTER COLUMN enabled SET DEFAULT false;

-- Update existing default record to have these new values if they are null
UPDATE public.intelligence_scraping_config
SET 
  max_cost_limit = 10.00,
  ai_providers = ARRAY['gpt']
WHERE max_cost_limit IS NULL;
