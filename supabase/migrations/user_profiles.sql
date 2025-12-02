-- Add new columns to user_profiles table
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT '{"theme": "system", "language": "fr", "notifications": true}'::jsonb;

-- Comment on columns
COMMENT ON COLUMN public.user_profiles.avatar_url IS 'URL to the user''s avatar image';
COMMENT ON COLUMN public.user_profiles.bio IS 'User biography or description';
COMMENT ON COLUMN public.user_profiles.preferences IS 'User preferences (theme, language, etc.)';
