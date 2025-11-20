-- Create incoming_mails table
CREATE TABLE IF NOT EXISTS "public"."incoming_mails" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reference_number" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "received_date" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "type" TEXT NOT NULL, -- lettre, colis, facture, invitation, autre
    "urgency" TEXT NOT NULL DEFAULT 'normale', -- faible, normale, haute, urgente
    "status" TEXT NOT NULL DEFAULT 'recu', -- recu, en_traitement, distribue, archive
    "assigned_to" TEXT, -- service destinataire (ex: 'cabinet_private', 'secretariat_general')
    "digital_copy_url" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT "incoming_mails_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "incoming_mails_reference_number_key" UNIQUE ("reference_number")
);

-- Enable RLS
ALTER TABLE "public"."incoming_mails" ENABLE ROW LEVEL SECURITY;

-- Policies

-- Service Courrier can do everything
CREATE POLICY "Service Courrier can do everything on incoming_mails"
ON "public"."incoming_mails"
FOR ALL
TO authenticated
USING (auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'courrier'
))
WITH CHECK (auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'courrier'
));

-- Admin and President can read all
CREATE POLICY "Admin and President can read all incoming_mails"
ON "public"."incoming_mails"
FOR SELECT
TO authenticated
USING (auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role IN ('admin', 'president')
));

-- Other roles can read mails assigned to their service (simplified mapping for now)
-- This assumes 'assigned_to' matches the role name or a known service identifier
-- For this iteration, we'll allow authenticated users to read mails assigned to their role
CREATE POLICY "Users can read mails assigned to their role"
ON "public"."incoming_mails"
FOR SELECT
TO authenticated
USING (
    assigned_to IN (
        SELECT role FROM user_roles WHERE user_id = auth.uid()
    )
);
