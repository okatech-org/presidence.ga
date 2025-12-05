-- Fix previous migration - correct GET DIAGNOSTICS syntax
-- Enhanced conversation_sessions for multiple sessions and history management

-- Add columns for session management (if not exists from previous attempt)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'conversation_sessions' 
        AND column_name = 'session_name'
    ) THEN
        ALTER TABLE public.conversation_sessions ADD COLUMN session_name TEXT DEFAULT 'Nouvelle conversation';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'conversation_sessions' 
        AND column_name = 'is_archived'
    ) THEN
        ALTER TABLE public.conversation_sessions ADD COLUMN is_archived BOOLEAN DEFAULT false;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'conversation_sessions' 
        AND column_name = 'last_message_at'
    ) THEN
        ALTER TABLE public.conversation_sessions ADD COLUMN last_message_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'conversation_sessions' 
        AND column_name = 'message_count'
    ) THEN
        ALTER TABLE public.conversation_sessions ADD COLUMN message_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add columns to conversation_messages
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'conversation_messages' 
        AND column_name = 'is_deleted'
    ) THEN
        ALTER TABLE public.conversation_messages ADD COLUMN is_deleted BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Create or replace cleanup function with correct syntax
CREATE OR REPLACE FUNCTION public.cleanup_old_messages()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_deleted_count INTEGER := 0;
    v_settings JSONB;
    v_max_messages INTEGER;
    v_cleanup_enabled BOOLEAN;
    v_older_than_days INTEGER;
    v_temp_count INTEGER;
BEGIN
    -- Get cleanup settings
    SELECT setting_value INTO v_settings
    FROM system_settings
    WHERE setting_key = 'storage_limits';
    
    IF v_settings IS NULL THEN
        RETURN 0;
    END IF;
    
    v_cleanup_enabled := (v_settings->>'auto_cleanup_enabled')::boolean;
    
    IF NOT v_cleanup_enabled THEN
        RETURN 0;
    END IF;
    
    v_max_messages := (v_settings->>'max_conversation_messages')::integer;
    v_older_than_days := (v_settings->>'cleanup_older_than_days')::integer;
    
    -- Mark messages as deleted if they exceed the limit per session
    WITH ranked_messages AS (
        SELECT 
            id,
            ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY created_at DESC) as rn
        FROM conversation_messages
        WHERE is_deleted = false
    )
    UPDATE conversation_messages cm
    SET is_deleted = true
    FROM ranked_messages rm
    WHERE cm.id = rm.id
      AND rm.rn > v_max_messages;
    
    GET DIAGNOSTICS v_temp_count = ROW_COUNT;
    v_deleted_count := v_temp_count;
    
    -- Also delete messages older than configured days
    UPDATE conversation_messages
    SET is_deleted = true
    WHERE created_at < NOW() - make_interval(days => v_older_than_days)
      AND is_deleted = false;
    
    GET DIAGNOSTICS v_temp_count = ROW_COUNT;
    v_deleted_count := v_deleted_count + v_temp_count;
    
    RETURN v_deleted_count;
END;
$$;

-- Create indexes (if not exists)
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_user_archived 
    ON public.conversation_sessions(user_id, is_archived);
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_last_message 
    ON public.conversation_sessions(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_deleted 
    ON public.conversation_messages(is_deleted);

COMMENT ON FUNCTION public.cleanup_old_messages IS 'Automatically cleans up old messages based on system settings';