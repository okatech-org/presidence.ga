-- Create conseil_ministres_sessions table
CREATE TABLE IF NOT EXISTS public.conseil_ministres_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    time TIME,
    location TEXT DEFAULT 'Palais Rénovation',
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    agenda_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create ordre_du_jour table
CREATE TABLE IF NOT EXISTS public.ordre_du_jour (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.conseil_ministres_sessions(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    ministry TEXT,
    presenter TEXT,
    status TEXT DEFAULT 'proposed' CHECK (status IN ('proposed', 'approved', 'discussed', 'deferred')),
    order_index INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create decrets_ordonnances table
CREATE TABLE IF NOT EXISTS public.decrets_ordonnances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_number TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    type TEXT DEFAULT 'decree' CHECK (type IN ('decree', 'order', 'decision', 'circular')),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'pending_signature', 'signed', 'published')),
    content TEXT,
    ministry TEXT,
    created_by UUID,
    signature_date TIMESTAMPTZ,
    publication_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create decret_comments table
CREATE TABLE IF NOT EXISTS public.decret_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decret_id UUID REFERENCES public.decrets_ordonnances(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    user_name TEXT,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create decret_signatures table
CREATE TABLE IF NOT EXISTS public.decret_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decret_id UUID REFERENCES public.decrets_ordonnances(id) ON DELETE CASCADE,
    signed_by UUID NOT NULL,
    signed_by_name TEXT,
    signed_at TIMESTAMPTZ DEFAULT now(),
    signature_type TEXT DEFAULT 'approval' CHECK (signature_type IN ('approval', 'review', 'countersign'))
);

-- Create nominations table
CREATE TABLE IF NOT EXISTS public.nominations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_name TEXT NOT NULL,
    poste TEXT NOT NULL,
    ministere TEXT NOT NULL,
    candidate_info JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    decided_at TIMESTAMPTZ,
    decided_by UUID,
    decision_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create budget_national table
CREATE TABLE IF NOT EXISTS public.budget_national (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year INTEGER NOT NULL,
    total_budget BIGINT NOT NULL,
    executed_amount BIGINT DEFAULT 0,
    ministry_allocations JSONB DEFAULT '[]'::jsonb,
    last_updated TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create chantiers table
CREATE TABLE IF NOT EXISTS public.chantiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    location TEXT,
    status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'suspended')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    budget BIGINT,
    start_date DATE,
    end_date DATE,
    ministry TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create projets_presidentiels table
CREATE TABLE IF NOT EXISTS public.projets_presidentiels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status TEXT DEFAULT 'proposed' CHECK (status IN ('proposed', 'approved', 'in_progress', 'completed', 'suspended')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    budget BIGINT,
    responsible_ministry TEXT,
    start_date DATE,
    target_date DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create projets_etat table
CREATE TABLE IF NOT EXISTS public.projets_etat (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    sector TEXT,
    status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'suspended', 'cancelled')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    budget BIGINT,
    funding_source TEXT,
    responsible_entity TEXT,
    start_date DATE,
    completion_date DATE,
    impact_score INTEGER CHECK (impact_score >= 0 AND impact_score <= 100),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.conseil_ministres_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordre_du_jour ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decrets_ordonnances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decret_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decret_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nominations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_national ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chantiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projets_presidentiels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projets_etat ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conseil_ministres_sessions
CREATE POLICY "Allow president and admin to view sessions"
ON public.conseil_ministres_sessions FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role IN ('president', 'admin', 'dgr', 'sec_gen')
    )
);

CREATE POLICY "Allow admin to manage sessions"
ON public.conseil_ministres_sessions FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'sec_gen')
    )
);

-- RLS Policies for ordre_du_jour
CREATE POLICY "Allow viewing agenda items"
ON public.ordre_du_jour FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role IN ('president', 'admin', 'dgr', 'sec_gen')
    )
);

CREATE POLICY "Allow managing agenda items"
ON public.ordre_du_jour FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'sec_gen')
    )
);

-- RLS Policies for decrets_ordonnances
CREATE POLICY "Allow viewing decrets"
ON public.decrets_ordonnances FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role IN ('president', 'admin', 'sec_gen', 'dgr')
    )
);

CREATE POLICY "Allow managing decrets"
ON public.decrets_ordonnances FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'sec_gen')
    )
);

-- RLS Policies for decret_comments
CREATE POLICY "Allow viewing comments"
ON public.decret_comments FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role IN ('president', 'admin', 'sec_gen', 'dgr')
    )
);

CREATE POLICY "Allow creating comments"
ON public.decret_comments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for decret_signatures
CREATE POLICY "Allow viewing signatures"
ON public.decret_signatures FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role IN ('president', 'admin', 'sec_gen', 'dgr')
    )
);

CREATE POLICY "Allow creating signatures"
ON public.decret_signatures FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = signed_by);

-- RLS Policies for nominations
CREATE POLICY "Allow viewing nominations"
ON public.nominations FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role IN ('president', 'admin', 'dgr')
    )
);

CREATE POLICY "Allow managing nominations"
ON public.nominations FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'president')
    )
);

-- RLS Policies for budget_national
CREATE POLICY "Allow viewing budget"
ON public.budget_national FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role IN ('president', 'admin', 'dgr')
    )
);

CREATE POLICY "Allow managing budget"
ON public.budget_national FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
);

-- RLS Policies for chantiers
CREATE POLICY "Allow viewing chantiers"
ON public.chantiers FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role IN ('president', 'admin', 'dgr')
    )
);

CREATE POLICY "Allow managing chantiers"
ON public.chantiers FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'president')
    )
);

-- RLS Policies for projets_presidentiels
CREATE POLICY "Allow viewing presidential projects"
ON public.projets_presidentiels FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role IN ('president', 'admin', 'dgr')
    )
);

CREATE POLICY "Allow managing presidential projects"
ON public.projets_presidentiels FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'president')
    )
);

-- RLS Policies for projets_etat
CREATE POLICY "Allow viewing state projects"
ON public.projets_etat FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role IN ('president', 'admin', 'dgr')
    )
);

CREATE POLICY "Allow managing state projects"
ON public.projets_etat FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'president')
    )
);

-- Create updated_at triggers
CREATE TRIGGER update_conseil_sessions_updated_at
    BEFORE UPDATE ON public.conseil_ministres_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_decrets_updated_at
    BEFORE UPDATE ON public.decrets_ordonnances
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_nominations_updated_at
    BEFORE UPDATE ON public.nominations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_chantiers_updated_at
    BEFORE UPDATE ON public.chantiers
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_projets_presidentiels_updated_at
    BEFORE UPDATE ON public.projets_presidentiels
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_projets_etat_updated_at
    BEFORE UPDATE ON public.projets_etat
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for performance
CREATE INDEX idx_ordre_du_jour_session ON public.ordre_du_jour(session_id);
CREATE INDEX idx_decret_comments_decret ON public.decret_comments(decret_id);
CREATE INDEX idx_decret_signatures_decret ON public.decret_signatures(decret_id);
CREATE INDEX idx_decrets_status ON public.decrets_ordonnances(status);
CREATE INDEX idx_nominations_status ON public.nominations(status);
CREATE INDEX idx_chantiers_status ON public.chantiers(status);
CREATE INDEX idx_projets_presidentiels_status ON public.projets_presidentiels(status);
CREATE INDEX idx_projets_etat_status ON public.projets_etat(status);