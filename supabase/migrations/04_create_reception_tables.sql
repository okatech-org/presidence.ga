-- Create visitor_logs table
CREATE TABLE IF NOT EXISTS public.visitor_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_name TEXT NOT NULL,
    organization TEXT,
    purpose TEXT NOT NULL,
    host_name TEXT NOT NULL,
    check_in_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    check_out_time TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL CHECK (status IN ('checked_in', 'checked_out', 'expected')),
    badge_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create accreditation_requests table
CREATE TABLE IF NOT EXISTS public.accreditation_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_name TEXT NOT NULL,
    organization TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('press', 'diplomatic', 'staff', 'contractor')),
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'revoked')),
    valid_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.visitor_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accreditation_requests ENABLE ROW LEVEL SECURITY;

-- Create policies (allowing read/write for authenticated users for now, can be restricted later)
CREATE POLICY "Enable read access for all users" ON public.visitor_logs FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.visitor_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.visitor_logs FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON public.accreditation_requests FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.accreditation_requests FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.accreditation_requests FOR UPDATE USING (auth.role() = 'authenticated');
