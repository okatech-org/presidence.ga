-- Create ministerial_projects table
CREATE TABLE IF NOT EXISTS public.ministerial_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ministry TEXT NOT NULL,
    project_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('en_cours', 'termine', 'bloque')),
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('haute', 'moyenne', 'basse')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create presidential_instructions table
CREATE TABLE IF NOT EXISTS public.presidential_instructions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instruction TEXT NOT NULL,
    assigned_to TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed')),
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'normal')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create interministerial_coordination table
CREATE TABLE IF NOT EXISTS public.interministerial_coordination (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject TEXT NOT NULL,
    ministries_involved TEXT[] NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('planned', 'ongoing', 'completed')),
    meeting_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create council_preparations table
CREATE TABLE IF NOT EXISTS public.council_preparations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_date TIMESTAMP WITH TIME ZONE NOT NULL,
    agenda_items TEXT[] NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('draft', 'finalized', 'archived')),
    documents_url TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.ministerial_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presidential_instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interministerial_coordination ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.council_preparations ENABLE ROW LEVEL SECURITY;

-- Create policies (allowing read/write for authenticated users for now, can be restricted later)
CREATE POLICY "Enable read access for all users" ON public.ministerial_projects FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.ministerial_projects FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.ministerial_projects FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON public.presidential_instructions FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.presidential_instructions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.presidential_instructions FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON public.interministerial_coordination FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.interministerial_coordination FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.interministerial_coordination FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON public.council_preparations FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.council_preparations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.council_preparations FOR UPDATE USING (auth.role() = 'authenticated');
