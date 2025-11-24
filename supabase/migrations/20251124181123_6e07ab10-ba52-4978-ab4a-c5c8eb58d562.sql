-- Fix overly permissive RLS policy on role_feedback table
-- This policy currently allows ALL authenticated users to view all feedback including emails
-- We need to restrict this to admins and president only

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view all feedback" ON public.role_feedback;

-- Create a restricted policy for admins and president only
CREATE POLICY "Admins and president can view all feedback" 
ON public.role_feedback
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'president'::app_role)
);

-- Note: The policy "Users can view their own feedback" already exists and allows
-- users to see their own submissions, which is appropriate