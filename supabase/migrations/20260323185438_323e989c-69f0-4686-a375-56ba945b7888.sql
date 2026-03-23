
-- Fix overly permissive notification insert policy
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated users can insert notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() OR EXISTS (
  SELECT 1 FROM public.organisations
  WHERE organisations.id = notifications.org_id
  AND organisations.user_id = auth.uid()
));
