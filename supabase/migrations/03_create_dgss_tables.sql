-- Create intelligence_reports table
CREATE TABLE IF NOT EXISTS public.intelligence_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    source TEXT NOT NULL,
    classification TEXT NOT NULL CHECK (classification IN ('secret', 'top_secret', 'confidential', 'restricted')),
    status TEXT NOT NULL CHECK (status IN ('draft', 'submitted', 'reviewed', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create surveillance_targets table
CREATE TABLE IF NOT EXISTS public.surveillance_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('individual', 'organization', 'location', 'cyber')),
    status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'under_review', 'neutralized')),
    priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    last_update TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create threat_indicators table
CREATE TABLE IF NOT EXISTS public.threat_indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('terrorism', 'espionage', 'cyber', 'civil_unrest', 'economic')),
    level TEXT NOT NULL CHECK (level IN ('critical', 'high', 'elevated', 'guarded', 'low')),
    description TEXT NOT NULL,
    location TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.intelligence_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surveillance_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threat_indicators ENABLE ROW LEVEL SECURITY;

-- Create policies (allowing read/write for authenticated users for now, can be restricted later)
CREATE POLICY "Enable read access for all users" ON public.intelligence_reports FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.intelligence_reports FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.intelligence_reports FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON public.surveillance_targets FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.surveillance_targets FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.surveillance_targets FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON public.threat_indicators FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.threat_indicators FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.threat_indicators FOR UPDATE USING (auth.role() = 'authenticated');
