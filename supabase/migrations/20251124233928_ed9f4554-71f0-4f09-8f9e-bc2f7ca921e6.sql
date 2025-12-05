-- Secure opinion_publique table - only president and admin can access
-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view opinion publique" ON public.opinion_publique;
DROP POLICY IF EXISTS "Service role can manage opinion_publique" ON public.opinion_publique;

-- Enable RLS
ALTER TABLE public.opinion_publique ENABLE ROW LEVEL SECURITY;

-- Only president and admin can view opinion publique
CREATE POLICY "President and admin can view opinion publique"
ON public.opinion_publique
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'president'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Only admin can manage (insert, update, delete) opinion publique data
CREATE POLICY "Admin can manage opinion publique"
ON public.opinion_publique
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Service role can do everything (for cron jobs and edge functions)
CREATE POLICY "Service role can manage opinion publique"
ON public.opinion_publique
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);