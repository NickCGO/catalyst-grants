INSERT INTO storage.buckets (id, name, public)
VALUES ('org-documents', 'org-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own org docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'org-documents'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM organisations WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can read own org docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'org-documents'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM organisations WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own org docs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'org-documents'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM organisations WHERE user_id = auth.uid()
  )
);