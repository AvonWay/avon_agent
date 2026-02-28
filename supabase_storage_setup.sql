-- SUPABASE STORAGE SETUP
-- Run this in the Supabase SQL Editor

-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow public access to read avatars
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- 3. Allow users to upload their own avatars
CREATE POLICY "Allow individual uploads"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- 4. Allow users to update their own avatars
CREATE POLICY "Allow individual updates"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- 5. Allow users to delete their own avatars
CREATE POLICY "Allow individual deletes"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);
