-- Add column to store document paths in role_feedback table
ALTER TABLE public.role_feedback 
ADD COLUMN document_paths text[] DEFAULT ARRAY[]::text[];