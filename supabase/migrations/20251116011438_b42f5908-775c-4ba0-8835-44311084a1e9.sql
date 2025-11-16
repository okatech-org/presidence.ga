-- Create feedback table for role improvements
CREATE TABLE public.role_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  role_name TEXT NOT NULL,
  role_description TEXT NOT NULL,
  work_description TEXT NOT NULL,
  implementation_suggestions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'implemented'))
);

-- Enable RLS
ALTER TABLE public.role_feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can submit feedback
CREATE POLICY "Anyone can submit role feedback"
  ON public.role_feedback
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy: Only authenticated users can view all feedback
CREATE POLICY "Authenticated users can view all feedback"
  ON public.role_feedback
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Users can view their own feedback
CREATE POLICY "Users can view their own feedback"
  ON public.role_feedback
  FOR SELECT
  TO public
  USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Create storage bucket for feedback documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('role-feedback-docs', 'role-feedback-docs', false);

-- Storage policies for feedback documents
CREATE POLICY "Anyone can upload feedback documents"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'role-feedback-docs');

CREATE POLICY "Authenticated users can view all feedback documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'role-feedback-docs');

-- Add comment for documentation
COMMENT ON TABLE public.role_feedback IS 'Stores feedback from role holders about their real roles and work to improve system implementation';