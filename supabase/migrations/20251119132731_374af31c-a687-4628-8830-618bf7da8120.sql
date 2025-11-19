-- Activer Realtime pour les tables principales
-- Cela permet la synchronisation temps réel avec React Query

-- Tables KPIs et données nationales
ALTER PUBLICATION supabase_realtime ADD TABLE public.national_kpis;
ALTER PUBLICATION supabase_realtime ADD TABLE public.opinion_publique;

-- Tables de signalements et décisions
ALTER PUBLICATION supabase_realtime ADD TABLE public.signalements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.presidential_decisions;

-- Tables de gestion
ALTER PUBLICATION supabase_realtime ADD TABLE public.role_feedback;
ALTER PUBLICATION supabase_realtime ADD TABLE public.iasted_config;

-- Tables de conversation et préférences
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_preferences;

-- Tables d'analytics et performance
ALTER PUBLICATION supabase_realtime ADD TABLE public.institution_performance;
ALTER PUBLICATION supabase_realtime ADD TABLE public.analytics_voice_events;