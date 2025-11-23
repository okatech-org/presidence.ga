-- Create Private Cabinet Tables for Cabinet Director
-- These tables store sensitive private information accessible only to the Cabinet Director

-- Table 1: Private Audiences
CREATE TABLE IF NOT EXISTS public.private_audiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    person_name TEXT NOT NULL,
    person_title TEXT,
    subject TEXT NOT NULL,
    location TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'scheduled',
    confidentiality_level TEXT NOT NULL DEFAULT 'confidentiel',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table 2: Encrypted Messages
CREATE TABLE IF NOT EXISTS public.encrypted_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'normal',
    security_level TEXT NOT NULL DEFAULT 'standard',
    is_read BOOLEAN DEFAULT false,
    encryption_key TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table 3: Personal Correspondence
CREATE TABLE IF NOT EXISTS public.personal_correspondence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_name TEXT NOT NULL,
    sender_organization TEXT,
    subject TEXT NOT NULL,
    content TEXT,
    received_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'new',
    priority TEXT NOT NULL DEFAULT 'normal',
    type TEXT NOT NULL DEFAULT 'letter',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table 4: VIP Contacts
CREATE TABLE IF NOT EXISTS public.vip_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    title TEXT,
    organization TEXT,
    category TEXT NOT NULL DEFAULT 'diplomatic',
    phone TEXT,
    email TEXT,
    address TEXT,
    notes TEXT,
    last_contact_date DATE,
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table 5: Private Trips
CREATE TABLE IF NOT EXISTS public.private_trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    destination TEXT NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    purpose TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'official',
    status TEXT NOT NULL DEFAULT 'planned',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.private_audiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encrypted_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_correspondence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_trips ENABLE ROW LEVEL SECURITY;

-- RLS Policies for private_audiences
CREATE POLICY "Users can view their own audiences"
    ON public.private_audiences FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create their own audiences"
    ON public.private_audiences FOR INSERT
    WITH CHECK (user_id = auth.uid() AND created_by = auth.uid());

CREATE POLICY "Users can update their own audiences"
    ON public.private_audiences FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own audiences"
    ON public.private_audiences FOR DELETE
    USING (user_id = auth.uid());

-- RLS Policies for encrypted_messages
CREATE POLICY "Users can view messages they sent or received"
    ON public.encrypted_messages FOR SELECT
    USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can send messages"
    ON public.encrypted_messages FOR INSERT
    WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Recipients can update read status"
    ON public.encrypted_messages FOR UPDATE
    USING (recipient_id = auth.uid());

CREATE POLICY "Users can delete their own sent messages"
    ON public.encrypted_messages FOR DELETE
    USING (sender_id = auth.uid());

-- RLS Policies for personal_correspondence
CREATE POLICY "Users can view their own correspondence"
    ON public.personal_correspondence FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create their own correspondence"
    ON public.personal_correspondence FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own correspondence"
    ON public.personal_correspondence FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own correspondence"
    ON public.personal_correspondence FOR DELETE
    USING (user_id = auth.uid());

-- RLS Policies for vip_contacts
CREATE POLICY "Users can view their own contacts"
    ON public.vip_contacts FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create their own contacts"
    ON public.vip_contacts FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own contacts"
    ON public.vip_contacts FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own contacts"
    ON public.vip_contacts FOR DELETE
    USING (user_id = auth.uid());

-- RLS Policies for private_trips
CREATE POLICY "Users can view their own trips"
    ON public.private_trips FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create their own trips"
    ON public.private_trips FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own trips"
    ON public.private_trips FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own trips"
    ON public.private_trips FOR DELETE
    USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_private_audiences_user_id ON public.private_audiences(user_id);
CREATE INDEX idx_private_audiences_date ON public.private_audiences(date);
CREATE INDEX idx_encrypted_messages_recipient_id ON public.encrypted_messages(recipient_id);
CREATE INDEX idx_encrypted_messages_sender_id ON public.encrypted_messages(sender_id);
CREATE INDEX idx_personal_correspondence_user_id ON public.personal_correspondence(user_id);
CREATE INDEX idx_vip_contacts_user_id ON public.vip_contacts(user_id);
CREATE INDEX idx_private_trips_user_id ON public.private_trips(user_id);

-- Add updated_at triggers
CREATE TRIGGER update_private_audiences_updated_at
    BEFORE UPDATE ON public.private_audiences
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_personal_correspondence_updated_at
    BEFORE UPDATE ON public.personal_correspondence
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_vip_contacts_updated_at
    BEFORE UPDATE ON public.vip_contacts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_private_trips_updated_at
    BEFORE UPDATE ON public.private_trips
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();