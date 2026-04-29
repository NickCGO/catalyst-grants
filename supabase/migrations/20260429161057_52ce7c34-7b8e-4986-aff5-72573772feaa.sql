-- 1. org_settings column on organisations
ALTER TABLE public.organisations
  ADD COLUMN IF NOT EXISTS org_settings jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 2. partnership_messages table
CREATE TABLE IF NOT EXISTS public.partnership_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partnership_id uuid NOT NULL REFERENCES public.partnerships(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  author_user_id uuid NOT NULL,
  author_name text,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partnership_messages_partnership ON public.partnership_messages(partnership_id, created_at DESC);

ALTER TABLE public.partnership_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can read partnership messages" ON public.partnership_messages;
CREATE POLICY "Members can read partnership messages"
  ON public.partnership_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.partnership_members pm
      JOIN public.organisations o ON o.id = pm.org_id
      WHERE pm.partnership_id = partnership_messages.partnership_id
        AND o.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members can post partnership messages" ON public.partnership_messages;
CREATE POLICY "Members can post partnership messages"
  ON public.partnership_messages FOR INSERT
  WITH CHECK (
    auth.uid() = author_user_id
    AND EXISTS (
      SELECT 1 FROM public.partnership_members pm
      JOIN public.organisations o ON o.id = pm.org_id
      WHERE pm.partnership_id = partnership_messages.partnership_id
        AND o.id = partnership_messages.org_id
        AND o.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Authors can delete own partnership messages" ON public.partnership_messages;
CREATE POLICY "Authors can delete own partnership messages"
  ON public.partnership_messages FOR DELETE
  USING (author_user_id = auth.uid());

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.partnership_messages;
ALTER TABLE public.partnership_messages REPLICA IDENTITY FULL;

-- 3. partnership_documents table
CREATE TABLE IF NOT EXISTS public.partnership_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partnership_id uuid NOT NULL REFERENCES public.partnerships(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL,
  uploader_name text,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint,
  mime_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partnership_documents_partnership ON public.partnership_documents(partnership_id, created_at DESC);

ALTER TABLE public.partnership_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can list partnership documents" ON public.partnership_documents;
CREATE POLICY "Members can list partnership documents"
  ON public.partnership_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.partnership_members pm
      JOIN public.organisations o ON o.id = pm.org_id
      WHERE pm.partnership_id = partnership_documents.partnership_id
        AND o.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members can upload partnership documents" ON public.partnership_documents;
CREATE POLICY "Members can upload partnership documents"
  ON public.partnership_documents FOR INSERT
  WITH CHECK (
    auth.uid() = uploaded_by
    AND EXISTS (
      SELECT 1 FROM public.partnership_members pm
      JOIN public.organisations o ON o.id = pm.org_id
      WHERE pm.partnership_id = partnership_documents.partnership_id
        AND o.id = partnership_documents.org_id
        AND o.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Uploaders can delete own partnership documents" ON public.partnership_documents;
CREATE POLICY "Uploaders can delete own partnership documents"
  ON public.partnership_documents FOR DELETE
  USING (uploaded_by = auth.uid());

-- 4. Storage policies for org-documents bucket scoped to partnerships path
-- We'll store partnership files under: partnership-files/{partnership_id}/{filename}
DROP POLICY IF EXISTS "Partnership members can read partnership files" ON storage.objects;
CREATE POLICY "Partnership members can read partnership files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'org-documents'
    AND (storage.foldername(name))[1] = 'partnership-files'
    AND EXISTS (
      SELECT 1 FROM public.partnership_members pm
      JOIN public.organisations o ON o.id = pm.org_id
      WHERE pm.partnership_id::text = (storage.foldername(name))[2]
        AND o.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Partnership members can upload partnership files" ON storage.objects;
CREATE POLICY "Partnership members can upload partnership files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'org-documents'
    AND (storage.foldername(name))[1] = 'partnership-files'
    AND EXISTS (
      SELECT 1 FROM public.partnership_members pm
      JOIN public.organisations o ON o.id = pm.org_id
      WHERE pm.partnership_id::text = (storage.foldername(name))[2]
        AND o.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Partnership uploaders can delete partnership files" ON storage.objects;
CREATE POLICY "Partnership uploaders can delete partnership files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'org-documents'
    AND (storage.foldername(name))[1] = 'partnership-files'
    AND owner = auth.uid()
  );