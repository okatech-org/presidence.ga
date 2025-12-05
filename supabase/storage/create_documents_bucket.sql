-- Create Storage Bucket for Presidential Documents
-- This must be run via Supabase Dashboard > Storage or via CLI

-- Create the bucket
insert into storage.buckets (id, name, public)
values ('documents-presidentiels', 'documents-presidentiels', false);

-- Allow authenticated users to upload to their own folder
create policy "Users can upload to their own folder"
on storage.objects for insert
with check (
  bucket_id = 'documents-presidentiels' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to read their own files
create policy "Users can read their own files"
on storage.objects for select
using (
  bucket_id = 'documents-presidentiels' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own files
create policy "Users can delete their own files"
on storage.objects for delete
using (
  bucket_id = 'documents-presidentiels' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow service role full access
create policy "Service role has full access"
on storage.objects for all
using (auth.role() = 'service_role');
