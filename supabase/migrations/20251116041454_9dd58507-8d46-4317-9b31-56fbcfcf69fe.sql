-- Création de l'enum pour les rôles
CREATE TYPE public.app_role AS ENUM ('admin', 'president', 'dgss', 'dgr', 'minister', 'user');

-- Table des rôles utilisateurs
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Fonction de sécurité pour vérifier les rôles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Fonction spécifique pour le Président
CREATE OR REPLACE FUNCTION public.is_president(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(user_id, 'president'::app_role)
$$;

-- Table des signalements anti-corruption
CREATE TABLE public.signalements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  titre TEXT NOT NULL,
  description TEXT,
  categorie TEXT NOT NULL,
  montant_fcfa BIGINT,
  province TEXT,
  secteur TEXT,
  implique_haut_fonctionnaire BOOLEAN DEFAULT false,
  grade_fonctionnaire TEXT,
  score_priorite_ia INTEGER CHECK (score_priorite_ia >= 0 AND score_priorite_ia <= 100),
  statut TEXT DEFAULT 'nouveau' CHECK (statut IN ('nouveau', 'en_enquete', 'resolu', 'classe', 'priorite_zero')),
  preuves JSONB DEFAULT '[]'::jsonb,
  temoins JSONB DEFAULT '[]'::jsonb,
  analyse_ia TEXT,
  recommandation_ia TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.signalements ENABLE ROW LEVEL SECURITY;

-- Policies pour signalements
CREATE POLICY "President sees all signalements" ON public.signalements
  FOR SELECT USING (public.is_president(auth.uid()));

CREATE POLICY "Admins can manage signalements" ON public.signalements
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create signalements" ON public.signalements
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Table des décisions présidentielles
CREATE TABLE public.presidential_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signalement_id UUID REFERENCES public.signalements(id) ON DELETE CASCADE,
  decision_type TEXT NOT NULL CHECK (decision_type IN ('approuver_enquete', 'ordonner_investigation', 'protocole_xr7', 'consulter_dossier')),
  motif TEXT,
  decision_data JSONB DEFAULT '{}'::jsonb,
  president_user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CHECK (public.is_president(president_user_id))
);

ALTER TABLE public.presidential_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only president can create decisions" ON public.presidential_decisions
  FOR INSERT WITH CHECK (public.is_president(auth.uid()));

CREATE POLICY "President sees all decisions" ON public.presidential_decisions
  FOR SELECT USING (public.is_president(auth.uid()));

-- Table des KPIs nationaux
CREATE TABLE public.national_kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  signalements_totaux INTEGER DEFAULT 0,
  cas_critiques INTEGER DEFAULT 0,
  taux_resolution DECIMAL(5,2) DEFAULT 0,
  fonds_recuperes_fcfa BIGINT DEFAULT 0,
  indice_transparence INTEGER CHECK (indice_transparence >= 0 AND indice_transparence <= 100),
  satisfaction_publique DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (date)
);

ALTER TABLE public.national_kpis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "President sees all kpis" ON public.national_kpis
  FOR SELECT USING (public.is_president(auth.uid()));

-- Table de l'opinion publique
CREATE TABLE public.opinion_publique (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  satisfaction_globale DECIMAL(5,2),
  sentiment_satisfaits DECIMAL(5,2),
  sentiment_neutres DECIMAL(5,2),
  sentiment_insatisfaits DECIMAL(5,2),
  preoccupations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (date)
);

ALTER TABLE public.opinion_publique ENABLE ROW LEVEL SECURITY;

CREATE POLICY "President sees opinion" ON public.opinion_publique
  FOR SELECT USING (public.is_president(auth.uid()));

-- Table performance des institutions
CREATE TABLE public.institution_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_name TEXT NOT NULL,
  ministere TEXT,
  taux_resolution DECIMAL(5,2),
  cas_traites INTEGER DEFAULT 0,
  score_performance INTEGER CHECK (score_performance >= 0 AND score_performance <= 100),
  periode_debut DATE,
  periode_fin DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.institution_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "President sees institution performance" ON public.institution_performance
  FOR SELECT USING (public.is_president(auth.uid()));

-- Trigger pour updated_at sur signalements
CREATE TRIGGER update_signalements_updated_at
  BEFORE UPDATE ON public.signalements
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Policies pour user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "President can view all roles" ON public.user_roles
  FOR SELECT USING (public.is_president(auth.uid()));

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));