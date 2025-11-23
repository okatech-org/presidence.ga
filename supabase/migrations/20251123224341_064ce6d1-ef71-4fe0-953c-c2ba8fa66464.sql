-- Create missing tables for Cabinet Director operations (FIXED: correct role names)

-- Table 1: Ministerial Projects
CREATE TABLE IF NOT EXISTS public.ministerial_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ministry TEXT NOT NULL,
    project_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'en_cours' CHECK (status IN ('en_cours', 'termine', 'bloque')),
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    priority TEXT NOT NULL DEFAULT 'moyenne' CHECK (priority IN ('haute', 'moyenne', 'basse')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table 2: Presidential Instructions
CREATE TABLE IF NOT EXISTS public.presidential_instructions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instruction TEXT NOT NULL,
    assigned_to TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('critical', 'high', 'normal')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table 3: Interministerial Coordination
CREATE TABLE IF NOT EXISTS public.interministerial_coordination (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject TEXT NOT NULL,
    ministries_involved TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'ongoing', 'completed')),
    meeting_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table 4: Council Preparations
CREATE TABLE IF NOT EXISTS public.council_preparations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_date TIMESTAMP WITH TIME ZONE NOT NULL,
    agenda_items TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'finalized', 'archived')),
    documents_url TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table 5: Incoming Mails (for courrier service) - FIXED: 'courrier' not 'courriers'
CREATE TABLE IF NOT EXISTS public.incoming_mails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_number TEXT NOT NULL UNIQUE,
    sender TEXT NOT NULL,
    subject TEXT NOT NULL,
    received_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    type TEXT NOT NULL DEFAULT 'lettre' CHECK (type IN ('lettre', 'colis', 'facture', 'invitation', 'autre')),
    urgency TEXT NOT NULL DEFAULT 'normale' CHECK (urgency IN ('faible', 'normale', 'haute', 'urgente')),
    status TEXT NOT NULL DEFAULT 'recu' CHECK (status IN ('recu', 'en_traitement', 'distribue', 'archive')),
    assigned_to TEXT,
    digital_copy_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.ministerial_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presidential_instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interministerial_coordination ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.council_preparations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incoming_mails ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ministerial_projects
CREATE POLICY "Cabinet and Admin can view projects"
    ON public.ministerial_projects FOR SELECT
    USING (
        has_role(auth.uid(), 'dgr'::app_role) OR 
        has_role(auth.uid(), 'admin'::app_role) OR
        is_president(auth.uid())
    );

CREATE POLICY "Cabinet can manage projects"
    ON public.ministerial_projects FOR ALL
    USING (
        has_role(auth.uid(), 'dgr'::app_role) OR 
        has_role(auth.uid(), 'admin'::app_role)
    );

-- RLS Policies for presidential_instructions
CREATE POLICY "Cabinet and Admin can view instructions"
    ON public.presidential_instructions FOR SELECT
    USING (
        has_role(auth.uid(), 'dgr'::app_role) OR 
        has_role(auth.uid(), 'admin'::app_role) OR
        is_president(auth.uid())
    );

CREATE POLICY "Cabinet can manage instructions"
    ON public.presidential_instructions FOR ALL
    USING (
        has_role(auth.uid(), 'dgr'::app_role) OR 
        has_role(auth.uid(), 'admin'::app_role)
    );

-- RLS Policies for interministerial_coordination
CREATE POLICY "Cabinet and Admin can view coordination"
    ON public.interministerial_coordination FOR SELECT
    USING (
        has_role(auth.uid(), 'dgr'::app_role) OR 
        has_role(auth.uid(), 'admin'::app_role) OR
        is_president(auth.uid())
    );

CREATE POLICY "Cabinet can manage coordination"
    ON public.interministerial_coordination FOR ALL
    USING (
        has_role(auth.uid(), 'dgr'::app_role) OR 
        has_role(auth.uid(), 'admin'::app_role)
    );

-- RLS Policies for council_preparations
CREATE POLICY "Cabinet and Admin can view council prep"
    ON public.council_preparations FOR SELECT
    USING (
        has_role(auth.uid(), 'dgr'::app_role) OR 
        has_role(auth.uid(), 'admin'::app_role) OR
        is_president(auth.uid())
    );

CREATE POLICY "Cabinet can manage council prep"
    ON public.council_preparations FOR ALL
    USING (
        has_role(auth.uid(), 'dgr'::app_role) OR 
        has_role(auth.uid(), 'admin'::app_role)
    );

-- RLS Policies for incoming_mails (FIXED: 'courrier' role)
CREATE POLICY "Courrier service can view mails"
    ON public.incoming_mails FOR SELECT
    USING (
        has_role(auth.uid(), 'courrier'::app_role) OR 
        has_role(auth.uid(), 'admin'::app_role)
    );

CREATE POLICY "Courrier service can manage mails"
    ON public.incoming_mails FOR ALL
    USING (
        has_role(auth.uid(), 'courrier'::app_role) OR 
        has_role(auth.uid(), 'admin'::app_role)
    );

-- Create indexes for performance
CREATE INDEX idx_ministerial_projects_status ON public.ministerial_projects(status);
CREATE INDEX idx_ministerial_projects_priority ON public.ministerial_projects(priority);
CREATE INDEX idx_presidential_instructions_status ON public.presidential_instructions(status);
CREATE INDEX idx_presidential_instructions_due_date ON public.presidential_instructions(due_date);
CREATE INDEX idx_interministerial_coordination_status ON public.interministerial_coordination(status);
CREATE INDEX idx_council_preparations_meeting_date ON public.council_preparations(meeting_date);
CREATE INDEX idx_incoming_mails_status ON public.incoming_mails(status);
CREATE INDEX idx_incoming_mails_urgency ON public.incoming_mails(urgency);
CREATE INDEX idx_incoming_mails_reference ON public.incoming_mails(reference_number);

-- Add trigger for updated_at
CREATE TRIGGER update_incoming_mails_updated_at
    BEFORE UPDATE ON public.incoming_mails
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();