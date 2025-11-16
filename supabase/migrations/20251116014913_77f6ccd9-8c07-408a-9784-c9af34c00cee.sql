-- Tables pour iAsted

-- 1. Sessions de conversation
CREATE TABLE IF NOT EXISTS public.conversation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  settings JSONB DEFAULT '{}',
  memory_summary TEXT,
  focus_mode TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Messages de conversation
CREATE TABLE IF NOT EXISTS public.conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.conversation_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'router', 'tool')),
  content TEXT NOT NULL,
  audio_url TEXT,
  tokens INTEGER,
  latency_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Analytics événements vocaux
CREATE TABLE IF NOT EXISTS public.analytics_voice_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.conversation_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Préférences vocales utilisateur (ajouter colonnes à user_preferences si existe, sinon créer)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_preferences') THEN
    CREATE TABLE public.user_preferences (
      user_id UUID PRIMARY KEY,
      voice_id TEXT DEFAULT 'EXAVITQu4vr4xnSDxMaL',
      voice_silence_duration INTEGER DEFAULT 2000,
      voice_silence_threshold INTEGER DEFAULT 10,
      voice_continuous_mode BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  ELSE
    ALTER TABLE public.user_preferences
      ADD COLUMN IF NOT EXISTS voice_id TEXT DEFAULT 'EXAVITQu4vr4xnSDxMaL',
      ADD COLUMN IF NOT EXISTS voice_silence_duration INTEGER DEFAULT 2000,
      ADD COLUMN IF NOT EXISTS voice_silence_threshold INTEGER DEFAULT 10,
      ADD COLUMN IF NOT EXISTS voice_continuous_mode BOOLEAN DEFAULT false;
  END IF;
END $$;

-- 5. Favoris de configuration vocale
CREATE TABLE IF NOT EXISTS public.voice_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  voice_id TEXT NOT NULL,
  voice_silence_duration INTEGER DEFAULT 2000,
  voice_silence_threshold INTEGER DEFAULT 10,
  voice_continuous_mode BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS conversation_sessions_updated_at ON public.conversation_sessions;
CREATE TRIGGER conversation_sessions_updated_at
  BEFORE UPDATE ON public.conversation_sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS voice_presets_updated_at ON public.voice_presets;
CREATE TRIGGER voice_presets_updated_at
  BEFORE UPDATE ON public.voice_presets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS Policies
ALTER TABLE public.conversation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_voice_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_presets ENABLE ROW LEVEL SECURITY;

-- Policies pour conversation_sessions
CREATE POLICY "Users can view own sessions"
  ON public.conversation_sessions FOR SELECT
  USING (user_id = (current_setting('request.jwt.claims'::text, true)::json->>'sub')::uuid);

CREATE POLICY "Users can create own sessions"
  ON public.conversation_sessions FOR INSERT
  WITH CHECK (user_id = (current_setting('request.jwt.claims'::text, true)::json->>'sub')::uuid);

CREATE POLICY "Users can update own sessions"
  ON public.conversation_sessions FOR UPDATE
  USING (user_id = (current_setting('request.jwt.claims'::text, true)::json->>'sub')::uuid);

-- Policies pour conversation_messages
CREATE POLICY "Users can view messages from own sessions"
  ON public.conversation_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.conversation_sessions
    WHERE id = session_id AND user_id = (current_setting('request.jwt.claims'::text, true)::json->>'sub')::uuid
  ));

CREATE POLICY "Users can create messages in own sessions"
  ON public.conversation_messages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.conversation_sessions
    WHERE id = session_id AND user_id = (current_setting('request.jwt.claims'::text, true)::json->>'sub')::uuid
  ));

-- Policies pour analytics_voice_events
CREATE POLICY "Users can view own analytics"
  ON public.analytics_voice_events FOR SELECT
  USING (user_id = (current_setting('request.jwt.claims'::text, true)::json->>'sub')::uuid);

CREATE POLICY "Users can create own analytics"
  ON public.analytics_voice_events FOR INSERT
  WITH CHECK (user_id = (current_setting('request.jwt.claims'::text, true)::json->>'sub')::uuid);

-- Policies pour user_preferences
CREATE POLICY "Users can view own preferences"
  ON public.user_preferences FOR SELECT
  USING (user_id = (current_setting('request.jwt.claims'::text, true)::json->>'sub')::uuid);

CREATE POLICY "Users can insert own preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK (user_id = (current_setting('request.jwt.claims'::text, true)::json->>'sub')::uuid);

CREATE POLICY "Users can update own preferences"
  ON public.user_preferences FOR UPDATE
  USING (user_id = (current_setting('request.jwt.claims'::text, true)::json->>'sub')::uuid);

-- Policies pour voice_presets
CREATE POLICY "Users can view own presets"
  ON public.voice_presets FOR SELECT
  USING (user_id = (current_setting('request.jwt.claims'::text, true)::json->>'sub')::uuid);

CREATE POLICY "Users can create own presets"
  ON public.voice_presets FOR INSERT
  WITH CHECK (user_id = (current_setting('request.jwt.claims'::text, true)::json->>'sub')::uuid);

CREATE POLICY "Users can update own presets"
  ON public.voice_presets FOR UPDATE
  USING (user_id = (current_setting('request.jwt.claims'::text, true)::json->>'sub')::uuid);

CREATE POLICY "Users can delete own presets"
  ON public.voice_presets FOR DELETE
  USING (user_id = (current_setting('request.jwt.claims'::text, true)::json->>'sub')::uuid);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_conversation_messages_session_id ON public.conversation_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_user_id ON public.conversation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_voice_events_user_id ON public.analytics_voice_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_voice_events_session_id ON public.analytics_voice_events(session_id);
CREATE INDEX IF NOT EXISTS idx_voice_presets_user_id ON public.voice_presets(user_id);