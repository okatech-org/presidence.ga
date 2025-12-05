-- ================================================
-- ÉTAPE 1: Trigger Automatique d'Analyse IA
-- Projet Oeil de Lynx - Présidence du Gabon
-- ================================================

-- 1. Activer pg_net pour les requêtes HTTP
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 2. Table de logs pour le monitoring
CREATE TABLE IF NOT EXISTS public.intelligence_processing_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES intelligence_items(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    processing_time_ms INTEGER
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_intelligence_processing_logs_item_id 
    ON intelligence_processing_logs(item_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_processing_logs_status 
    ON intelligence_processing_logs(status);

-- RLS pour les logs
ALTER TABLE intelligence_processing_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view processing logs" ON intelligence_processing_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role IN ('admin', 'dgss', 'president')
        )
    );

CREATE POLICY "Service role can manage logs" ON intelligence_processing_logs
    FOR ALL USING (true);

-- 3. Fonction trigger qui appelle l'Edge Function
CREATE OR REPLACE FUNCTION public.trigger_process_intelligence()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    edge_function_url TEXT;
    payload JSONB;
    request_id BIGINT;
BEGIN
    -- URL de l'Edge Function
    edge_function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/process-intelligence';
    
    -- Si pas de setting, utiliser l'URL par défaut
    IF edge_function_url IS NULL OR edge_function_url = '/functions/v1/process-intelligence' THEN
        edge_function_url := 'https://sfsoqoeunivgorrgioap.supabase.co/functions/v1/process-intelligence';
    END IF;
    
    -- Construire le payload avec le record inséré
    payload := jsonb_build_object(
        'record', jsonb_build_object(
            'id', NEW.id,
            'content', NEW.content,
            'author', NEW.author,
            'source_id', NEW.source_id,
            'published_at', NEW.published_at
        )
    );
    
    -- Créer un log d'entrée
    INSERT INTO intelligence_processing_logs (item_id, status)
    VALUES (NEW.id, 'pending');
    
    -- Appeler l'Edge Function de manière asynchrone via pg_net
    SELECT INTO request_id extensions.http_post(
        url := edge_function_url,
        body := payload::text,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || coalesce(
                current_setting('app.settings.service_role_key', true),
                current_setting('request.jwt.claim.sub', true)
            )
        )::jsonb
    );
    
    -- Log pour debugging
    RAISE LOG 'Intelligence item % sent for processing (request_id: %)', NEW.id, request_id;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Logger l'erreur mais ne pas bloquer l'insertion
        RAISE WARNING 'Failed to trigger intelligence processing for %: %', NEW.id, SQLERRM;
        
        -- Mettre à jour le log avec l'erreur
        UPDATE intelligence_processing_logs 
        SET status = 'error', 
            error_message = SQLERRM,
            completed_at = NOW()
        WHERE item_id = NEW.id;
        
        RETURN NEW;
END;
$$;

-- 4. Créer le trigger sur la table
DROP TRIGGER IF EXISTS on_intelligence_item_insert ON intelligence_items;

CREATE TRIGGER on_intelligence_item_insert
    AFTER INSERT ON intelligence_items
    FOR EACH ROW
    EXECUTE FUNCTION trigger_process_intelligence();

-- 5. Ajouter des commentaires explicatifs
COMMENT ON FUNCTION public.trigger_process_intelligence() IS 
'Trigger qui appelle automatiquement l''Edge Function process-intelligence 
après chaque insertion dans intelligence_items pour analyser le contenu 
avec Gemini et générer les embeddings avec OpenAI.';

COMMENT ON TABLE public.intelligence_processing_logs IS
'Logs de traitement des items d''intelligence pour monitoring et debugging.';

-- 6. Grant permissions
GRANT SELECT ON intelligence_processing_logs TO authenticated;
GRANT ALL ON intelligence_processing_logs TO service_role;