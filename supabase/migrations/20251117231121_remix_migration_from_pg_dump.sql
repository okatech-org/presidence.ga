--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'president',
    'dgss',
    'dgr',
    'minister',
    'user'
);


--
-- Name: handle_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: is_president(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_president(user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT public.has_role(user_id, 'president'::app_role)
$$;


--
-- Name: update_iasted_config_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_iasted_config_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: analytics_voice_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analytics_voice_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid,
    user_id uuid NOT NULL,
    event_type text NOT NULL,
    data jsonb DEFAULT '{}'::jsonb,
    at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: conversation_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversation_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    role text NOT NULL,
    content text NOT NULL,
    audio_url text,
    tokens integer,
    latency_ms integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT conversation_messages_role_check CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text, 'router'::text, 'tool'::text])))
);


--
-- Name: conversation_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversation_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb,
    memory_summary text,
    focus_mode text,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    ended_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: iasted_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.iasted_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    agent_id text,
    agent_name text DEFAULT 'iAsted'::text,
    president_voice_id text DEFAULT '9BWtsMINqrJLrRacOk9x'::text,
    minister_voice_id text DEFAULT 'EXAVITQu4vr4xnSDxMaL'::text,
    default_voice_id text DEFAULT 'Xb7hH8MSUJpSbSDYk0k2'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: institution_performance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.institution_performance (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    institution_name text NOT NULL,
    ministere text,
    taux_resolution numeric(5,2),
    cas_traites integer DEFAULT 0,
    score_performance integer,
    periode_debut date,
    periode_fin date,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT institution_performance_score_performance_check CHECK (((score_performance >= 0) AND (score_performance <= 100)))
);


--
-- Name: national_kpis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.national_kpis (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    date date DEFAULT CURRENT_DATE NOT NULL,
    signalements_totaux integer DEFAULT 0,
    cas_critiques integer DEFAULT 0,
    taux_resolution numeric(5,2) DEFAULT 0,
    fonds_recuperes_fcfa bigint DEFAULT 0,
    indice_transparence integer,
    satisfaction_publique numeric(5,2),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT national_kpis_indice_transparence_check CHECK (((indice_transparence >= 0) AND (indice_transparence <= 100)))
);


--
-- Name: opinion_publique; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.opinion_publique (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    date date DEFAULT CURRENT_DATE NOT NULL,
    satisfaction_globale numeric(5,2),
    sentiment_satisfaits numeric(5,2),
    sentiment_neutres numeric(5,2),
    sentiment_insatisfaits numeric(5,2),
    preoccupations jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: presidential_decisions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.presidential_decisions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    signalement_id uuid,
    decision_type text NOT NULL,
    motif text,
    decision_data jsonb DEFAULT '{}'::jsonb,
    president_user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT presidential_decisions_decision_type_check CHECK ((decision_type = ANY (ARRAY['approuver_enquete'::text, 'ordonner_investigation'::text, 'protocole_xr7'::text, 'consulter_dossier'::text]))),
    CONSTRAINT presidential_decisions_president_user_id_check CHECK (public.is_president(president_user_id))
);


--
-- Name: role_feedback; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_feedback (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_email text NOT NULL,
    role_name text NOT NULL,
    role_description text NOT NULL,
    work_description text NOT NULL,
    implementation_suggestions text,
    created_at timestamp with time zone DEFAULT now(),
    status text DEFAULT 'pending'::text,
    document_paths text[] DEFAULT ARRAY[]::text[],
    CONSTRAINT role_feedback_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'reviewed'::text, 'implemented'::text])))
);


--
-- Name: signalements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.signalements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    titre text NOT NULL,
    description text,
    categorie text NOT NULL,
    montant_fcfa bigint,
    province text,
    secteur text,
    implique_haut_fonctionnaire boolean DEFAULT false,
    grade_fonctionnaire text,
    score_priorite_ia integer,
    statut text DEFAULT 'nouveau'::text,
    preuves jsonb DEFAULT '[]'::jsonb,
    temoins jsonb DEFAULT '[]'::jsonb,
    analyse_ia text,
    recommandation_ia text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT signalements_score_priorite_ia_check CHECK (((score_priorite_ia >= 0) AND (score_priorite_ia <= 100))),
    CONSTRAINT signalements_statut_check CHECK ((statut = ANY (ARRAY['nouveau'::text, 'en_enquete'::text, 'resolu'::text, 'classe'::text, 'priorite_zero'::text])))
);


--
-- Name: user_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_preferences (
    user_id uuid NOT NULL,
    voice_id text DEFAULT 'EXAVITQu4vr4xnSDxMaL'::text,
    voice_silence_duration integer DEFAULT 2000,
    voice_silence_threshold integer DEFAULT 10,
    voice_continuous_mode boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    voice_push_to_talk boolean DEFAULT false
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: voice_presets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.voice_presets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    voice_id text NOT NULL,
    voice_silence_duration integer DEFAULT 2000,
    voice_silence_threshold integer DEFAULT 10,
    voice_continuous_mode boolean DEFAULT false,
    is_default boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: analytics_voice_events analytics_voice_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics_voice_events
    ADD CONSTRAINT analytics_voice_events_pkey PRIMARY KEY (id);


--
-- Name: conversation_messages conversation_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_messages
    ADD CONSTRAINT conversation_messages_pkey PRIMARY KEY (id);


--
-- Name: conversation_sessions conversation_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_sessions
    ADD CONSTRAINT conversation_sessions_pkey PRIMARY KEY (id);


--
-- Name: iasted_config iasted_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iasted_config
    ADD CONSTRAINT iasted_config_pkey PRIMARY KEY (id);


--
-- Name: institution_performance institution_performance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.institution_performance
    ADD CONSTRAINT institution_performance_pkey PRIMARY KEY (id);


--
-- Name: national_kpis national_kpis_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.national_kpis
    ADD CONSTRAINT national_kpis_date_key UNIQUE (date);


--
-- Name: national_kpis national_kpis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.national_kpis
    ADD CONSTRAINT national_kpis_pkey PRIMARY KEY (id);


--
-- Name: opinion_publique opinion_publique_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opinion_publique
    ADD CONSTRAINT opinion_publique_date_key UNIQUE (date);


--
-- Name: opinion_publique opinion_publique_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opinion_publique
    ADD CONSTRAINT opinion_publique_pkey PRIMARY KEY (id);


--
-- Name: presidential_decisions presidential_decisions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presidential_decisions
    ADD CONSTRAINT presidential_decisions_pkey PRIMARY KEY (id);


--
-- Name: role_feedback role_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_feedback
    ADD CONSTRAINT role_feedback_pkey PRIMARY KEY (id);


--
-- Name: signalements signalements_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signalements
    ADD CONSTRAINT signalements_code_key UNIQUE (code);


--
-- Name: signalements signalements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signalements
    ADD CONSTRAINT signalements_pkey PRIMARY KEY (id);


--
-- Name: user_preferences user_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_pkey PRIMARY KEY (user_id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: voice_presets voice_presets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.voice_presets
    ADD CONSTRAINT voice_presets_pkey PRIMARY KEY (id);


--
-- Name: voice_presets voice_presets_user_id_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.voice_presets
    ADD CONSTRAINT voice_presets_user_id_name_key UNIQUE (user_id, name);


--
-- Name: idx_analytics_voice_events_session_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analytics_voice_events_session_id ON public.analytics_voice_events USING btree (session_id);


--
-- Name: idx_analytics_voice_events_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analytics_voice_events_user_id ON public.analytics_voice_events USING btree (user_id);


--
-- Name: idx_conversation_messages_session_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversation_messages_session_id ON public.conversation_messages USING btree (session_id);


--
-- Name: idx_conversation_sessions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversation_sessions_user_id ON public.conversation_sessions USING btree (user_id);


--
-- Name: idx_voice_presets_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_voice_presets_user_id ON public.voice_presets USING btree (user_id);


--
-- Name: conversation_sessions conversation_sessions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER conversation_sessions_updated_at BEFORE UPDATE ON public.conversation_sessions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: iasted_config update_iasted_config_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_iasted_config_updated_at BEFORE UPDATE ON public.iasted_config FOR EACH ROW EXECUTE FUNCTION public.update_iasted_config_updated_at();


--
-- Name: signalements update_signalements_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_signalements_updated_at BEFORE UPDATE ON public.signalements FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: user_preferences user_preferences_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER user_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: voice_presets voice_presets_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER voice_presets_updated_at BEFORE UPDATE ON public.voice_presets FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: analytics_voice_events analytics_voice_events_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics_voice_events
    ADD CONSTRAINT analytics_voice_events_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.conversation_sessions(id) ON DELETE CASCADE;


--
-- Name: conversation_messages conversation_messages_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_messages
    ADD CONSTRAINT conversation_messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.conversation_sessions(id) ON DELETE CASCADE;


--
-- Name: presidential_decisions presidential_decisions_president_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presidential_decisions
    ADD CONSTRAINT presidential_decisions_president_user_id_fkey FOREIGN KEY (president_user_id) REFERENCES auth.users(id);


--
-- Name: presidential_decisions presidential_decisions_signalement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presidential_decisions
    ADD CONSTRAINT presidential_decisions_signalement_id_fkey FOREIGN KEY (signalement_id) REFERENCES public.signalements(id) ON DELETE CASCADE;


--
-- Name: signalements signalements_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signalements
    ADD CONSTRAINT signalements_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles Admins can manage roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage roles" ON public.user_roles USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: signalements Admins can manage signalements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage signalements" ON public.signalements USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: iasted_config Admins can update iasted config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update iasted config" ON public.iasted_config FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::public.app_role, 'president'::public.app_role]))))));


--
-- Name: iasted_config Anyone can read iasted config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read iasted config" ON public.iasted_config FOR SELECT USING (true);


--
-- Name: role_feedback Anyone can submit role feedback; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can submit role feedback" ON public.role_feedback FOR INSERT WITH CHECK (true);


--
-- Name: role_feedback Authenticated users can view all feedback; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view all feedback" ON public.role_feedback FOR SELECT TO authenticated USING (true);


--
-- Name: presidential_decisions Only president can create decisions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only president can create decisions" ON public.presidential_decisions FOR INSERT WITH CHECK (public.is_president(auth.uid()));


--
-- Name: user_roles President can view all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "President can view all roles" ON public.user_roles FOR SELECT USING (public.is_president(auth.uid()));


--
-- Name: presidential_decisions President sees all decisions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "President sees all decisions" ON public.presidential_decisions FOR SELECT USING (public.is_president(auth.uid()));


--
-- Name: national_kpis President sees all kpis; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "President sees all kpis" ON public.national_kpis FOR SELECT USING (public.is_president(auth.uid()));


--
-- Name: signalements President sees all signalements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "President sees all signalements" ON public.signalements FOR SELECT USING (public.is_president(auth.uid()));


--
-- Name: institution_performance President sees institution performance; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "President sees institution performance" ON public.institution_performance FOR SELECT USING (public.is_president(auth.uid()));


--
-- Name: opinion_publique President sees opinion; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "President sees opinion" ON public.opinion_publique FOR SELECT USING (public.is_president(auth.uid()));


--
-- Name: conversation_messages Users can create messages in own sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create messages in own sessions" ON public.conversation_messages FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.conversation_sessions
  WHERE ((conversation_sessions.id = conversation_messages.session_id) AND (conversation_sessions.user_id = (((current_setting('request.jwt.claims'::text, true))::json ->> 'sub'::text))::uuid)))));


--
-- Name: analytics_voice_events Users can create own analytics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own analytics" ON public.analytics_voice_events FOR INSERT WITH CHECK ((user_id = (((current_setting('request.jwt.claims'::text, true))::json ->> 'sub'::text))::uuid));


--
-- Name: voice_presets Users can create own presets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own presets" ON public.voice_presets FOR INSERT WITH CHECK ((user_id = (((current_setting('request.jwt.claims'::text, true))::json ->> 'sub'::text))::uuid));


--
-- Name: conversation_sessions Users can create own sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own sessions" ON public.conversation_sessions FOR INSERT WITH CHECK ((user_id = (((current_setting('request.jwt.claims'::text, true))::json ->> 'sub'::text))::uuid));


--
-- Name: signalements Users can create signalements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create signalements" ON public.signalements FOR INSERT WITH CHECK ((auth.uid() = created_by));


--
-- Name: voice_presets Users can delete own presets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own presets" ON public.voice_presets FOR DELETE USING ((user_id = (((current_setting('request.jwt.claims'::text, true))::json ->> 'sub'::text))::uuid));


--
-- Name: user_preferences Users can insert own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own preferences" ON public.user_preferences FOR INSERT WITH CHECK ((user_id = (((current_setting('request.jwt.claims'::text, true))::json ->> 'sub'::text))::uuid));


--
-- Name: user_preferences Users can update own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own preferences" ON public.user_preferences FOR UPDATE USING ((user_id = (((current_setting('request.jwt.claims'::text, true))::json ->> 'sub'::text))::uuid));


--
-- Name: voice_presets Users can update own presets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own presets" ON public.voice_presets FOR UPDATE USING ((user_id = (((current_setting('request.jwt.claims'::text, true))::json ->> 'sub'::text))::uuid));


--
-- Name: conversation_sessions Users can update own sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own sessions" ON public.conversation_sessions FOR UPDATE USING ((user_id = (((current_setting('request.jwt.claims'::text, true))::json ->> 'sub'::text))::uuid));


--
-- Name: conversation_messages Users can view messages from own sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view messages from own sessions" ON public.conversation_messages FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.conversation_sessions
  WHERE ((conversation_sessions.id = conversation_messages.session_id) AND (conversation_sessions.user_id = (((current_setting('request.jwt.claims'::text, true))::json ->> 'sub'::text))::uuid)))));


--
-- Name: analytics_voice_events Users can view own analytics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own analytics" ON public.analytics_voice_events FOR SELECT USING ((user_id = (((current_setting('request.jwt.claims'::text, true))::json ->> 'sub'::text))::uuid));


--
-- Name: user_preferences Users can view own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own preferences" ON public.user_preferences FOR SELECT USING ((user_id = (((current_setting('request.jwt.claims'::text, true))::json ->> 'sub'::text))::uuid));


--
-- Name: voice_presets Users can view own presets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own presets" ON public.voice_presets FOR SELECT USING ((user_id = (((current_setting('request.jwt.claims'::text, true))::json ->> 'sub'::text))::uuid));


--
-- Name: user_roles Users can view own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: conversation_sessions Users can view own sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own sessions" ON public.conversation_sessions FOR SELECT USING ((user_id = (((current_setting('request.jwt.claims'::text, true))::json ->> 'sub'::text))::uuid));


--
-- Name: role_feedback Users can view their own feedback; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own feedback" ON public.role_feedback FOR SELECT USING ((user_email = ((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)));


--
-- Name: analytics_voice_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.analytics_voice_events ENABLE ROW LEVEL SECURITY;

--
-- Name: conversation_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: conversation_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.conversation_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: iasted_config; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.iasted_config ENABLE ROW LEVEL SECURITY;

--
-- Name: institution_performance; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.institution_performance ENABLE ROW LEVEL SECURITY;

--
-- Name: national_kpis; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.national_kpis ENABLE ROW LEVEL SECURITY;

--
-- Name: opinion_publique; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.opinion_publique ENABLE ROW LEVEL SECURITY;

--
-- Name: presidential_decisions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.presidential_decisions ENABLE ROW LEVEL SECURITY;

--
-- Name: role_feedback; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.role_feedback ENABLE ROW LEVEL SECURITY;

--
-- Name: signalements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.signalements ENABLE ROW LEVEL SECURITY;

--
-- Name: user_preferences; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: voice_presets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.voice_presets ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


