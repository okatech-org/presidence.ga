-- =====================================================
-- Phase 4: Tables DGSS (Direction Générale de la Sécurité et de la Surveillance)
-- =====================================================

-- Table: intelligence_reports
CREATE TABLE IF NOT EXISTS public.intelligence_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    source TEXT NOT NULL,
    classification TEXT NOT NULL DEFAULT 'confidential',
    status TEXT NOT NULL DEFAULT 'draft',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT intelligence_reports_classification_check 
        CHECK (classification IN ('secret', 'top_secret', 'confidential', 'restricted')),
    CONSTRAINT intelligence_reports_status_check 
        CHECK (status IN ('draft', 'submitted', 'reviewed', 'archived'))
);

-- Table: surveillance_targets
CREATE TABLE IF NOT EXISTS public.surveillance_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'individual',
    status TEXT NOT NULL DEFAULT 'active',
    priority TEXT NOT NULL DEFAULT 'medium',
    description TEXT,
    location TEXT,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_update TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT surveillance_targets_type_check 
        CHECK (type IN ('individual', 'organization', 'location', 'cyber')),
    CONSTRAINT surveillance_targets_status_check 
        CHECK (status IN ('active', 'inactive', 'under_review', 'neutralized')),
    CONSTRAINT surveillance_targets_priority_check 
        CHECK (priority IN ('critical', 'high', 'medium', 'low'))
);

-- Table: threat_indicators
CREATE TABLE IF NOT EXISTS public.threat_indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    level TEXT NOT NULL DEFAULT 'guarded',
    description TEXT NOT NULL,
    location TEXT,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT threat_indicators_type_check 
        CHECK (type IN ('terrorism', 'espionage', 'cyber', 'civil_unrest', 'economic')),
    CONSTRAINT threat_indicators_level_check 
        CHECK (level IN ('critical', 'high', 'elevated', 'guarded', 'low'))
);

-- Enable RLS
ALTER TABLE public.intelligence_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surveillance_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threat_indicators ENABLE ROW LEVEL SECURITY;

-- RLS Policies for intelligence_reports
CREATE POLICY "DGSS and Admin can view intelligence reports"
    ON public.intelligence_reports
    FOR SELECT
    USING (
        has_role(auth.uid(), 'dgss'::app_role) OR 
        has_role(auth.uid(), 'admin'::app_role) OR 
        is_president(auth.uid())
    );

CREATE POLICY "DGSS and Admin can create intelligence reports"
    ON public.intelligence_reports
    FOR INSERT
    WITH CHECK (
        has_role(auth.uid(), 'dgss'::app_role) OR 
        has_role(auth.uid(), 'admin'::app_role)
    );

CREATE POLICY "DGSS and Admin can update intelligence reports"
    ON public.intelligence_reports
    FOR UPDATE
    USING (
        has_role(auth.uid(), 'dgss'::app_role) OR 
        has_role(auth.uid(), 'admin'::app_role)
    );

CREATE POLICY "DGSS and Admin can delete intelligence reports"
    ON public.intelligence_reports
    FOR DELETE
    USING (
        has_role(auth.uid(), 'dgss'::app_role) OR 
        has_role(auth.uid(), 'admin'::app_role)
    );

-- RLS Policies for surveillance_targets
CREATE POLICY "DGSS and Admin can view surveillance targets"
    ON public.surveillance_targets
    FOR SELECT
    USING (
        has_role(auth.uid(), 'dgss'::app_role) OR 
        has_role(auth.uid(), 'admin'::app_role) OR 
        is_president(auth.uid())
    );

CREATE POLICY "DGSS and Admin can create surveillance targets"
    ON public.surveillance_targets
    FOR INSERT
    WITH CHECK (
        has_role(auth.uid(), 'dgss'::app_role) OR 
        has_role(auth.uid(), 'admin'::app_role)
    );

CREATE POLICY "DGSS and Admin can update surveillance targets"
    ON public.surveillance_targets
    FOR UPDATE
    USING (
        has_role(auth.uid(), 'dgss'::app_role) OR 
        has_role(auth.uid(), 'admin'::app_role)
    );

CREATE POLICY "DGSS and Admin can delete surveillance targets"
    ON public.surveillance_targets
    FOR DELETE
    USING (
        has_role(auth.uid(), 'dgss'::app_role) OR 
        has_role(auth.uid(), 'admin'::app_role)
    );

-- RLS Policies for threat_indicators
CREATE POLICY "DGSS and Admin can view threat indicators"
    ON public.threat_indicators
    FOR SELECT
    USING (
        has_role(auth.uid(), 'dgss'::app_role) OR 
        has_role(auth.uid(), 'admin'::app_role) OR 
        is_president(auth.uid())
    );

CREATE POLICY "DGSS and Admin can create threat indicators"
    ON public.threat_indicators
    FOR INSERT
    WITH CHECK (
        has_role(auth.uid(), 'dgss'::app_role) OR 
        has_role(auth.uid(), 'admin'::app_role)
    );

CREATE POLICY "DGSS and Admin can update threat indicators"
    ON public.threat_indicators
    FOR UPDATE
    USING (
        has_role(auth.uid(), 'dgss'::app_role) OR 
        has_role(auth.uid(), 'admin'::app_role)
    );

CREATE POLICY "DGSS and Admin can delete threat indicators"
    ON public.threat_indicators
    FOR DELETE
    USING (
        has_role(auth.uid(), 'dgss'::app_role) OR 
        has_role(auth.uid(), 'admin'::app_role)
    );

-- Triggers for updated_at
CREATE TRIGGER update_intelligence_reports_updated_at
    BEFORE UPDATE ON public.intelligence_reports
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_surveillance_targets_last_update
    BEFORE UPDATE ON public.surveillance_targets
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Indexes for performance
CREATE INDEX idx_intelligence_reports_classification ON public.intelligence_reports(classification);
CREATE INDEX idx_intelligence_reports_status ON public.intelligence_reports(status);
CREATE INDEX idx_intelligence_reports_created_at ON public.intelligence_reports(created_at DESC);

CREATE INDEX idx_surveillance_targets_status ON public.surveillance_targets(status);
CREATE INDEX idx_surveillance_targets_priority ON public.surveillance_targets(priority);
CREATE INDEX idx_surveillance_targets_type ON public.surveillance_targets(type);
CREATE INDEX idx_surveillance_targets_last_update ON public.surveillance_targets(last_update DESC);

CREATE INDEX idx_threat_indicators_level ON public.threat_indicators(level);
CREATE INDEX idx_threat_indicators_type ON public.threat_indicators(type);
CREATE INDEX idx_threat_indicators_timestamp ON public.threat_indicators(timestamp DESC);