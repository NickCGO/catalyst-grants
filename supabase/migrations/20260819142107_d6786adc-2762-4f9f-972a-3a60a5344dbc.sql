-- 1. Waitlist: remove public read
DROP POLICY IF EXISTS "Users can view own waitlist entry" ON public.waitlist;

-- 2. Partnership storage policies: use partnership_id folder segment + membership
DROP POLICY IF EXISTS "Partnership members can read partnership files" ON storage.objects;
DROP POLICY IF EXISTS "Partnership members can upload partnership files" ON storage.objects;
DROP POLICY IF EXISTS "Partnership uploaders can delete partnership files" ON storage.objects;

CREATE POLICY "Partnership members can read partnership files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'org-documents'
  AND (storage.foldername(name))[1] = 'partnership-files'
  AND EXISTS (
    SELECT 1
    FROM public.partnership_members pm
    JOIN public.organisations o ON o.id = pm.org_id
    WHERE pm.partnership_id::text = (storage.foldername(objects.name))[2]
      AND o.user_id = auth.uid()
  )
);

CREATE POLICY "Partnership members can upload partnership files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'org-documents'
  AND (storage.foldername(name))[1] = 'partnership-files'
  AND EXISTS (
    SELECT 1
    FROM public.partnership_members pm
    JOIN public.organisations o ON o.id = pm.org_id
    WHERE pm.partnership_id::text = (storage.foldername(objects.name))[2]
      AND o.user_id = auth.uid()
  )
);

CREATE POLICY "Partnership uploaders can delete partnership files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'org-documents'
  AND (storage.foldername(name))[1] = 'partnership-files'
  AND owner = auth.uid()
);

-- 3. Fix mutable search_path on queue helpers
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;

-- 4. Restrict EXECUTE on SECURITY DEFINER functions not meant for clients
REVOKE ALL ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.email_queue_dispatch() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.email_queue_wake() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.bump_proposals_used() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_org_admins_on_inbound_email() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_funder_pipeline_on_interaction() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.assign_inbound_mailbox_token() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.get_access_state(text) FROM anon;
REVOKE ALL ON FUNCTION public.has_active_subscription(uuid, text) FROM anon;

GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;
