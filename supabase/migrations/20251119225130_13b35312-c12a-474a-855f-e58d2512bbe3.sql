-- Add new roles to the app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'cabinet_private';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'sec_gen';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'courrier';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'reception';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'protocol';