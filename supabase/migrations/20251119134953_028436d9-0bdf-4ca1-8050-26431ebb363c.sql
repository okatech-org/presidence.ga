-- Add explicit write protection to read-only governmental data tables
-- These tables should only be modified by backend systems, not by users

-- institution_performance: Ministry performance data
CREATE POLICY "No user modifications on institution_performance" ON public.institution_performance
FOR ALL
USING (false)
WITH CHECK (false);

CREATE POLICY "Service role can manage institution_performance" ON public.institution_performance
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- national_kpis: National key performance indicators
CREATE POLICY "No user modifications on national_kpis" ON public.national_kpis
FOR ALL
USING (false)
WITH CHECK (false);

CREATE POLICY "Service role can manage national_kpis" ON public.national_kpis
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- opinion_publique: Public opinion polling data
CREATE POLICY "No user modifications on opinion_publique" ON public.opinion_publique
FOR ALL
USING (false)
WITH CHECK (false);

CREATE POLICY "Service role can manage opinion_publique" ON public.opinion_publique
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);