-- Ajouter une colonne pour le mode push-to-talk dans user_preferences
ALTER TABLE user_preferences 
ADD COLUMN voice_push_to_talk BOOLEAN DEFAULT false;

-- Commenter la colonne
COMMENT ON COLUMN user_preferences.voice_push_to_talk IS 'Mode push-to-talk activé (true) ou mode continu (false)';
