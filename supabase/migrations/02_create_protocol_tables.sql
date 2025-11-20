-- Create official_events table
CREATE TABLE IF NOT EXISTS public.official_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('ceremony', 'meeting', 'visit', 'gala')),
    status TEXT NOT NULL CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create guest_lists table
CREATE TABLE IF NOT EXISTS public.guest_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.official_events(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    title TEXT,
    organization TEXT,
    status TEXT NOT NULL CHECK (status IN ('invited', 'confirmed', 'declined', 'attended')),
    category TEXT NOT NULL CHECK (category IN ('vip', 'press', 'staff', 'general')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create protocol_procedures table
CREATE TABLE IF NOT EXISTS public.protocol_procedures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('ceremonial', 'diplomatic', 'security', 'logistics')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.official_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protocol_procedures ENABLE ROW LEVEL SECURITY;

-- Create policies (allowing read/write for authenticated users for now, can be restricted later)
CREATE POLICY "Enable read access for all users" ON public.official_events FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.official_events FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.official_events FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON public.guest_lists FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.guest_lists FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.guest_lists FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON public.protocol_procedures FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.protocol_procedures FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.protocol_procedures FOR UPDATE USING (auth.role() = 'authenticated');
