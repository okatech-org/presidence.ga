-- Create missing tables for Protocol service

-- Table 1: Official Events
CREATE TABLE IF NOT EXISTS public.official_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'ceremony' CHECK (type IN ('ceremony', 'meeting', 'visit', 'gala')),
    status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table 2: Guest Lists
CREATE TABLE IF NOT EXISTS public.guest_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.official_events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    title TEXT,
    organization TEXT,
    status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'confirmed', 'declined', 'attended')),
    category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('vip', 'press', 'staff', 'general')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add missing sender_name column to encrypted_messages
ALTER TABLE public.encrypted_messages 
ADD COLUMN IF NOT EXISTS sender_name TEXT;

-- Enable RLS
ALTER TABLE public.official_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_lists ENABLE ROW LEVEL SECURITY;

-- RLS Policies for official_events
CREATE POLICY "Protocol service can view events"
    ON public.official_events FOR SELECT
    USING (
        has_role(auth.uid(), 'protocol'::app_role) OR 
        has_role(auth.uid(), 'admin'::app_role) OR
        is_president(auth.uid())
    );

CREATE POLICY "Protocol service can manage events"
    ON public.official_events FOR ALL
    USING (
        has_role(auth.uid(), 'protocol'::app_role) OR 
        has_role(auth.uid(), 'admin'::app_role)
    );

-- RLS Policies for guest_lists
CREATE POLICY "Protocol service can view guests"
    ON public.guest_lists FOR SELECT
    USING (
        has_role(auth.uid(), 'protocol'::app_role) OR 
        has_role(auth.uid(), 'admin'::app_role) OR
        is_president(auth.uid())
    );

CREATE POLICY "Protocol service can manage guests"
    ON public.guest_lists FOR ALL
    USING (
        has_role(auth.uid(), 'protocol'::app_role) OR 
        has_role(auth.uid(), 'admin'::app_role)
    );

-- Create indexes
CREATE INDEX idx_official_events_date ON public.official_events(date);
CREATE INDEX idx_official_events_status ON public.official_events(status);
CREATE INDEX idx_official_events_type ON public.official_events(type);
CREATE INDEX idx_guest_lists_event_id ON public.guest_lists(event_id);
CREATE INDEX idx_guest_lists_status ON public.guest_lists(status);
CREATE INDEX idx_guest_lists_category ON public.guest_lists(category);