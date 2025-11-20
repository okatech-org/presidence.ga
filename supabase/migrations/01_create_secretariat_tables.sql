-- Create official_decrees table
CREATE TABLE IF NOT EXISTS public.official_decrees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    reference_number TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('draft', 'pending_signature', 'signed', 'published')),
    signature_date TIMESTAMP WITH TIME ZONE,
    publication_date TIMESTAMP WITH TIME ZONE,
    type TEXT NOT NULL CHECK (type IN ('decree', 'order', 'decision', 'circular')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create legal_reviews table
CREATE TABLE IF NOT EXISTS public.legal_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_title TEXT NOT NULL,
    requestor TEXT NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
    status TEXT NOT NULL CHECK (status IN ('pending', 'in_review', 'completed')),
    assigned_to TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create administrative_archives table
CREATE TABLE IF NOT EXISTS public.administrative_archives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    reference_code TEXT NOT NULL,
    archiving_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    access_level TEXT NOT NULL CHECK (access_level IN ('public', 'restricted', 'confidential', 'secret')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.official_decrees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.administrative_archives ENABLE ROW LEVEL SECURITY;

-- Create policies (allowing read/write for authenticated users for now, can be restricted later)
CREATE POLICY "Enable read access for all users" ON public.official_decrees FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.official_decrees FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.official_decrees FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON public.legal_reviews FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.legal_reviews FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.legal_reviews FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON public.administrative_archives FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.administrative_archives FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.administrative_archives FOR UPDATE USING (auth.role() = 'authenticated');
