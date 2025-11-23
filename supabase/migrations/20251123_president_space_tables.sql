-- Migration for President Space Dashboard Tables
-- Created: 2025-11-23
-- Purpose: Add tables for Conseil des Ministres, Décrets & Ordonnances, Nominations, 
--          Budget, Indicators, Projects, and Chantiers management

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- CONSEIL DES MINISTRES (Council of Ministers)
-- ============================================================

CREATE TABLE IF NOT EXISTS conseil_ministres_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  time TIME NOT NULL,
  location TEXT NOT NULL,
  status TEXT CHECK (status IN ('scheduled', 'completed', 'cancelled')) DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS ordre_du_jour (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES conseil_ministres_sessions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  item_order INTEGER NOT NULL,
  type TEXT CHECK (type IN ('decree', 'ordinance', 'communication', 'other')) DEFAULT 'other',
  presenter TEXT,
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DÉCRETS & ORDONNANCES (Decrees & Ordinances)
-- ============================================================

CREATE TABLE IF NOT EXISTS decrets_ordonnances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference TEXT UNIQUE NOT NULL,
  type TEXT CHECK (type IN ('decree', 'ordinance')) NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  document_url TEXT,
  status TEXT CHECK (status IN ('draft', 'pending', 'signed', 'revision_needed', 'rejected')) DEFAULT 'draft',
  requires_signature BOOLEAN DEFAULT true,
  submitted_by UUID REFERENCES auth.users(id),
  submitted_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  signed_by UUID REFERENCES auth.users(id),
  revision_notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS decret_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  decret_id UUID REFERENCES decrets_ordonnances(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  comment TEXT NOT NULL,
  comment_type TEXT CHECK (comment_type IN ('review', 'annotation', 'general')) DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS decret_signatures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  decret_id UUID REFERENCES decrets_ordonnances(id) ON DELETE CASCADE,
  signed_by UUID REFERENCES auth.users(id),
  signature_data TEXT, -- Base64 encoded signature image
  ip_address INET,
  user_agent TEXT,
  signed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOMINATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS nominations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poste TEXT NOT NULL,
  ministere TEXT NOT NULL,
  candidate_name TEXT NOT NULL,
  candidate_info JSONB DEFAULT '{}'::jsonb, -- Bio, qualifications, etc.
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')) DEFAULT 'pending',
  submitted_by UUID REFERENCES auth.users(id),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  decided_at TIMESTAMPTZ,
  decided_by UUID REFERENCES auth.users(id),
  decision_notes TEXT,
  decree_reference TEXT, -- Reference to generated decree
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BUDGET NATIONAL (National Budget)
-- ============================================================

CREATE TABLE IF NOT EXISTS budget_national (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fiscal_year INTEGER NOT NULL,
  ministry_name TEXT NOT NULL,
  ministry_code TEXT,
  category TEXT, -- Infrastructure, Salaries, Operations, etc.
  allocated_amount NUMERIC(15, 2) NOT NULL,
  spent_amount NUMERIC(15, 2) DEFAULT 0,
  execution_rate NUMERIC(5, 2) GENERATED ALWAYS AS (
    CASE 
      WHEN allocated_amount > 0 THEN (spent_amount / allocated_amount) * 100
      ELSE 0
    END
  ) STORED,
  notes TEXT,
  last_updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(fiscal_year, ministry_name, category)
);

CREATE TABLE IF NOT EXISTS budget_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  budget_id UUID REFERENCES budget_national(id) ON DELETE CASCADE,
  transaction_type TEXT CHECK (transaction_type IN ('allocation', 'expenditure', 'adjustment', 'transfer')),
  amount NUMERIC(15, 2) NOT NULL,
  description TEXT,
  reference_number TEXT,
  transaction_date DATE DEFAULT CURRENT_DATE,
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDICATEURS ÉCONOMIQUES (Economic Indicators)
-- ============================================================

CREATE TABLE IF NOT EXISTS indicateurs_economiques (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  indicator_type TEXT NOT NULL, -- GDP_growth, inflation, employment, etc.
  indicator_name TEXT NOT NULL,
  value NUMERIC(10, 2) NOT NULL,
  unit TEXT, -- %, FCFA, etc.
  period TEXT NOT NULL, -- Q1-2025, 2025, Jan-2025
  period_start_date DATE,
  period_end_date DATE,
  source TEXT, -- IMF, World Bank, National Statistics, etc.
  notes TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(indicator_type, period)
);

-- ============================================================
-- CHANTIERS (Construction Sites / Projects)
-- ============================================================

CREATE TABLE IF NOT EXISTS chantiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  contractor TEXT,
  contract_amount NUMERIC(15, 2),
  budget NUMERIC(15, 2),
  spent_amount NUMERIC(15, 2) DEFAULT 0,
  progress INTEGER CHECK (progress >= 0 AND progress <= 100) DEFAULT 0,
  start_date DATE,
  expected_end_date DATE,
  actual_end_date DATE,
  status TEXT CHECK (status IN ('planned', 'ongoing', 'delayed', 'completed', 'suspended', 'cancelled')) DEFAULT 'planned',
  delay_reason TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chantier_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chantier_id UUID REFERENCES chantiers(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  photo_date DATE,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chantier_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chantier_id UUID REFERENCES chantiers(id) ON DELETE CASCADE,
  update_type TEXT CHECK (update_type IN ('progress', 'issue', 'milestone', 'budget', 'other')) DEFAULT 'progress',
  title TEXT NOT NULL,
  description TEXT,
  previous_progress INTEGER,
  new_progress INTEGER,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROJETS PRÉSIDENTIELS (Presidential Projects)
-- ============================================================

CREATE TABLE IF NOT EXISTS projets_presidentiels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  priority INTEGER NOT NULL DEFAULT 999, -- Lower number = higher priority
  status TEXT CHECK (status IN ('proposed', 'approved', 'in_progress', 'completed', 'suspended', 'cancelled')) DEFAULT 'proposed',
  budget_allocated NUMERIC(15, 2),
  budget_spent NUMERIC(15, 2) DEFAULT 0,
  progress INTEGER CHECK (progress >= 0 AND progress <= 100) DEFAULT 0,
  start_date DATE,
  expected_end_date DATE,
  actual_end_date DATE,
  milestones JSONB DEFAULT '[]'::jsonb, -- Array of milestone objects
  responsible_ministry TEXT,
  project_manager TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projet_presidentiel_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projets_presidentiels(id) ON DELETE CASCADE,
  update_type TEXT CHECK (update_type IN ('progress', 'milestone', 'budget', 'status', 'other')) DEFAULT 'progress',
  title TEXT NOT NULL,
  description TEXT,
  previous_value TEXT,
  new_value TEXT,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROJETS D'ÉTAT (State Projects)
-- ============================================================

CREATE TABLE IF NOT EXISTS projets_etat (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  ministry_name TEXT,
  ministry_code TEXT,
  priority INTEGER DEFAULT 999,
  status TEXT CHECK (status IN ('proposed', 'approved', 'in_progress', 'completed', 'suspended', 'cancelled')) DEFAULT 'proposed',
  budget_allocated NUMERIC(15, 2),
  budget_spent NUMERIC(15, 2) DEFAULT 0,
  progress INTEGER CHECK (progress >= 0 AND progress <= 100) DEFAULT 0,
  start_date DATE,
  expected_end_date DATE,
  sector TEXT, -- Health, Education, Infrastructure, etc.
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES for Performance
-- ============================================================

-- Conseil des Ministres
CREATE INDEX idx_conseil_sessions_date ON conseil_ministres_sessions(date);
CREATE INDEX idx_conseil_sessions_status ON conseil_ministres_sessions(status);
CREATE INDEX idx_ordre_session_id ON ordre_du_jour(session_id);

-- Décrets & Ordonnances
CREATE INDEX idx_decrets_status ON decrets_ordonnances(status);
CREATE INDEX idx_decrets_type ON decrets_ordonnances(type);
CREATE INDEX idx_decrets_signed_at ON decrets_ordonnances(signed_at);
CREATE INDEX idx_decret_comments_decret_id ON decret_comments(decret_id);

-- Nominations
CREATE INDEX idx_nominations_status ON nominations(status);
CREATE INDEX idx_nominations_submitted_at ON nominations(submitted_at);
CREATE INDEX idx_nominations_ministere ON nominations(ministere);

-- Budget
CREATE INDEX idx_budget_fiscal_year ON budget_national(fiscal_year);
CREATE INDEX idx_budget_ministry ON budget_national(ministry_name);
CREATE INDEX idx_budget_transactions_budget_id ON budget_transactions(budget_id);

-- Indicators
CREATE INDEX idx_indicators_type ON indicateurs_economiques(indicator_type);
CREATE INDEX idx_indicators_period ON indicateurs_economiques(period);

-- Chantiers
CREATE INDEX idx_chantiers_status ON chantiers(status);
CREATE INDEX idx_chantiers_progress ON chantiers(progress);
CREATE INDEX idx_chantier_photos_chantier_id ON chantier_photos(chantier_id);

-- Projets
CREATE INDEX idx_projets_presidentiels_status ON projets_presidentiels(status);
CREATE INDEX idx_projets_presidentiels_priority ON projets_presidentiels(priority);
CREATE INDEX idx_projets_etat_status ON projets_etat(status);
CREATE INDEX idx_projets_etat_ministry ON projets_etat(ministry_name);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE conseil_ministres_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordre_du_jour ENABLE ROW LEVEL SECURITY;
ALTER TABLE decrets_ordonnances ENABLE ROW LEVEL SECURITY;
ALTER TABLE decret_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE decret_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE nominations ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_national ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicateurs_economiques ENABLE ROW LEVEL SECURITY;
ALTER TABLE chantiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE chantier_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE chantier_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE projets_presidentiels ENABLE ROW LEVEL SECURITY;
ALTER TABLE projet_presidentiel_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE projets_etat ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user has required role
CREATE OR REPLACE FUNCTION has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = required_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- President and Cabinet Director have full access to all tables
-- Other roles have limited access based on their function

-- Conseil des Ministres - President and Cabinet Director can manage
CREATE POLICY "conseil_select_policy" ON conseil_ministres_sessions
  FOR SELECT USING (has_role('president') OR has_role('cabinet_director') OR has_role('secretariat_general'));

CREATE POLICY "conseil_insert_policy" ON conseil_ministres_sessions
  FOR INSERT WITH CHECK (has_role('president') OR has_role('cabinet_director'));

CREATE POLICY "conseil_update_policy" ON conseil_ministres_sessions
  FOR UPDATE USING (has_role('president') OR has_role('cabinet_director'));

CREATE POLICY "ordre_select_policy" ON ordre_du_jour
  FOR SELECT USING (has_role('president') OR has_role('cabinet_director') OR has_role('secretariat_general'));

CREATE POLICY "ordre_all_policy" ON ordre_du_jour
  FOR ALL USING (has_role('president') OR has_role('cabinet_director'));

-- Décrets & Ordonnances - President signs, others can view/comment
CREATE POLICY "decrets_select_policy" ON decrets_ordonnances
  FOR SELECT USING (true); -- All authenticated users can view

CREATE POLICY "decrets_insert_policy" ON decrets_ordonnances
  FOR INSERT WITH CHECK (has_role('president') OR has_role('cabinet_director') OR has_role('secretariat_general'));

CREATE POLICY "decrets_update_policy" ON decrets_ordonnances
  FOR UPDATE USING (
    has_role('president') OR 
    has_role('cabinet_director') OR 
    (has_role('secretariat_general') AND status != 'signed')
  );

CREATE POLICY "decret_comments_all_policy" ON decret_comments
  FOR ALL USING (true); -- All can comment

CREATE POLICY "decret_signatures_select" ON decret_signatures
  FOR SELECT USING (true);

CREATE POLICY "decret_signatures_insert" ON decret_signatures
  FOR INSERT WITH CHECK (has_role('president'));

-- Nominations - President approves
CREATE POLICY "nominations_select_policy" ON nominations
  FOR SELECT USING (true);

CREATE POLICY "nominations_insert_policy" ON nominations
  FOR INSERT WITH CHECK (has_role('cabinet_director') OR has_role('secretariat_general'));

CREATE POLICY "nominations_update_policy" ON nominations
  FOR UPDATE USING (has_role('president') OR has_role('cabinet_director'));

-- Budget - Read access for all, write for authorized roles
CREATE POLICY "budget_select_policy" ON budget_national
  FOR SELECT USING (true);

CREATE POLICY "budget_write_policy" ON budget_national
  FOR ALL USING (has_role('president') OR has_role('cabinet_director') OR has_role('dgss'));

CREATE POLICY "budget_transactions_all" ON budget_transactions
  FOR ALL USING (has_role('president') OR has_role('cabinet_director') OR has_role('dgss'));

-- Indicators - Read for all, write for authorized
CREATE POLICY "indicators_select_policy" ON indicateurs_economiques
  FOR SELECT USING (true);

CREATE POLICY "indicators_write_policy" ON indicateurs_economiques
  FOR ALL USING (has_role('president') OR has_role('cabinet_director') OR has_role('dgss'));

-- Chantiers - President and Cabinet can manage
CREATE POLICY "chantiers_select_policy" ON chantiers
  FOR SELECT USING (true);

CREATE POLICY "chantiers_write_policy" ON chantiers
  FOR ALL USING (has_role('president') OR has_role('cabinet_director'));

CREATE POLICY "chantier_photos_all" ON chantier_photos
  FOR ALL USING (has_role('president') OR has_role('cabinet_director'));

CREATE POLICY "chantier_updates_all" ON chantier_updates
  FOR ALL USING (has_role('president') OR has_role('cabinet_director'));

-- Presidential Projects - President has full control
CREATE POLICY "projets_presidentiels_select" ON projets_presidentiels
  FOR SELECT USING (true);

CREATE POLICY "projets_presidentiels_write" ON projets_presidentiels
  FOR ALL USING (has_role('president') OR has_role('cabinet_director'));

CREATE POLICY "projet_presidentiel_updates_all" ON projet_presidentiel_updates
  FOR ALL USING (has_role('president') OR has_role('cabinet_director'));

-- State Projects
CREATE POLICY "projets_etat_select" ON projets_etat
  FOR SELECT USING (true);

CREATE POLICY "projets_etat_write" ON projets_etat
  FOR ALL USING (has_role('president') OR has_role('cabinet_director'));

-- ============================================================
-- TRIGGERS for updated_at timestamps
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conseil_ministres_sessions_updated_at
  BEFORE UPDATE ON conseil_ministres_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ordre_du_jour_updated_at
  BEFORE UPDATE ON ordre_du_jour
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_decrets_ordonnances_updated_at
  BEFORE UPDATE ON decrets_ordonnances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nominations_updated_at
  BEFORE UPDATE ON nominations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budget_national_updated_at
  BEFORE UPDATE ON budget_national
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chantiers_updated_at
  BEFORE UPDATE ON chantiers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projets_presidentiels_updated_at
  BEFORE UPDATE ON projets_presidentiels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projets_etat_updated_at
  BEFORE UPDATE ON projets_etat
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
