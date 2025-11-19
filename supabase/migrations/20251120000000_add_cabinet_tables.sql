-- Create ministerial_projects table
CREATE TABLE IF NOT EXISTS public.ministerial_projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ministry TEXT NOT NULL,
    project TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('en_cours', 'termine', 'bloque')),
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    deadline DATE NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('haute', 'moyenne', 'basse')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create presidential_instructions table
CREATE TABLE IF NOT EXISTS public.presidential_instructions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    instruction TEXT NOT NULL,
    assigned_to TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed')),
    due_date DATE NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'normal')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create interministerial_coordination table
CREATE TABLE IF NOT EXISTS public.interministerial_coordination (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('reunion', 'blocage')),
    participants TEXT[], -- Array of ministries involved
    status TEXT DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create conseil_ministers table
CREATE TABLE IF NOT EXISTS public.conseil_ministers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    title TEXT NOT NULL,
    agenda JSONB, -- List of items
    decisions JSONB, -- List of decisions taken
    execution_rate INTEGER DEFAULT 0,
    status TEXT DEFAULT 'planned',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.ministerial_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presidential_instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interministerial_coordination ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conseil_ministers ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow read access to authenticated users
CREATE POLICY "Allow read access to authenticated users" ON public.ministerial_projects
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read access to authenticated users" ON public.presidential_instructions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read access to authenticated users" ON public.interministerial_coordination
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read access to authenticated users" ON public.conseil_ministers
    FOR SELECT TO authenticated USING (true);

-- Allow write access to dgr and admin roles
-- Note: This assumes a 'has_role' function exists as seen in types.ts, or we check user_roles table directly.
-- Using a simplified check for now based on auth.uid() existence, but in production should be stricter.
-- Ideally we use the has_role function if available in RLS context.

CREATE POLICY "Allow write access to admins and dgr" ON public.ministerial_projects
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'dgr')
        )
    );

CREATE POLICY "Allow write access to admins and dgr" ON public.presidential_instructions
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'dgr')
        )
    );

CREATE POLICY "Allow write access to admins and dgr" ON public.interministerial_coordination
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'dgr')
        )
    );

CREATE POLICY "Allow write access to admins and dgr" ON public.conseil_ministers
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'dgr')
        )
    );
