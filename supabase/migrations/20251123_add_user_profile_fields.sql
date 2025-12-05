-- Add missing fields to user_profiles table for Settings Modal
-- This migration adds phone, title, and preferences fields

-- Add new columns
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.user_profiles.phone IS 'User phone number for contact and SMS notifications';
COMMENT ON COLUMN public.user_profiles.title IS 'User official title/position';
COMMENT ON COLUMN public.user_profiles.preferences IS 'JSON object storing user preferences for notifications, display, export, etc.';
