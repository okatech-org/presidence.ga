-- Permettre l'insertion dans iasted_config via l'edge function
CREATE POLICY "Allow edge function to insert config"
ON public.iasted_config
FOR INSERT
WITH CHECK (true);