-- Create private_audiences table
CREATE TABLE IF NOT EXISTS public.private_audiences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    person_name TEXT NOT NULL,
    person_title TEXT,
    subject TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT,
    confidentiality_level TEXT NOT NULL CHECK (confidentiality_level IN ('confidentiel', 'tres_confidentiel', 'secret')),
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'postponed')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id)
);

-- Create encrypted_messages table
CREATE TABLE IF NOT EXISTS public.encrypted_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_name TEXT NOT NULL,
    sender_role TEXT,
    subject TEXT NOT NULL,
    content TEXT NOT NULL, -- In a real app, this would be encrypted
    is_read BOOLEAN DEFAULT false,
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'critical')),
    security_level TEXT NOT NULL DEFAULT 'standard' CHECK (security_level IN ('standard', 'enhanced', 'maximum')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    recipient_id UUID REFERENCES auth.users(id)
);

-- Create personal_correspondence table
CREATE TABLE IF NOT EXISTS public.personal_correspondence (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    content TEXT,
    received_date TIMESTAMP WITH TIME ZONE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('lettre', 'email', 'invitation', 'autre')),
    priority TEXT NOT NULL DEFAULT 'moyenne' CHECK (priority IN ('basse', 'moyenne', 'haute')),
    status TEXT NOT NULL DEFAULT 'recu' CHECK (status IN ('recu', 'en_traitement', 'traite', 'archive')),
    deadline TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create vip_contacts table
CREATE TABLE IF NOT EXISTS public.vip_contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    title TEXT,
    organization TEXT,
    country TEXT,
    category TEXT NOT NULL CHECK (category IN ('chef_etat', 'diplomate', 'politique', 'famille', 'prive', 'autre')),
    email TEXT,
    phone TEXT,
    notes TEXT,
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create private_trips table
CREATE TABLE IF NOT EXISTS public.private_trips (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    destination TEXT NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    purpose TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('prive', 'vacances', 'famille', 'medical')),
    status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'confirmed', 'cancelled', 'completed')),
    participants TEXT[], -- Array of names
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.private_audiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encrypted_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_correspondence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_trips ENABLE ROW LEVEL SECURITY;

-- Create policies for private_audiences
CREATE POLICY "Allow read access to cabinet_private and president" ON public.private_audiences
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('cabinet_private', 'president', 'admin')
        )
    );

CREATE POLICY "Allow write access to cabinet_private" ON public.private_audiences
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('cabinet_private', 'admin')
        )
    );

-- Create policies for encrypted_messages
CREATE POLICY "Allow read access to cabinet_private and president" ON public.encrypted_messages
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('cabinet_private', 'president', 'admin')
        ) OR recipient_id = auth.uid()
    );

CREATE POLICY "Allow insert to authenticated users" ON public.encrypted_messages
    FOR INSERT TO authenticated
    WITH CHECK (true); -- Anyone can send a message, but only authorized roles can read specific ones

-- Create policies for personal_correspondence
CREATE POLICY "Allow read access to cabinet_private and president" ON public.personal_correspondence
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('cabinet_private', 'president', 'admin')
        )
    );

CREATE POLICY "Allow write access to cabinet_private" ON public.personal_correspondence
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('cabinet_private', 'admin')
        )
    );

-- Create policies for vip_contacts
CREATE POLICY "Allow read access to cabinet_private and president" ON public.vip_contacts
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('cabinet_private', 'president', 'admin')
        )
    );

CREATE POLICY "Allow write access to cabinet_private" ON public.vip_contacts
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('cabinet_private', 'admin')
        )
    );

-- Create policies for private_trips
CREATE POLICY "Allow read access to cabinet_private and president" ON public.private_trips
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('cabinet_private', 'president', 'admin')
        )
    );

CREATE POLICY "Allow write access to cabinet_private" ON public.private_trips
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('cabinet_private', 'admin')
        )
    );
