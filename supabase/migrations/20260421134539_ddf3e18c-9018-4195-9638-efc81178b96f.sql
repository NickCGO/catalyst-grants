-- Allow returning the inserted row via PostgREST .select() after insert.
-- We use a simple permissive SELECT policy because the visitor only ever
-- sees their own freshly-inserted row in the API response, and the table
-- contains no PII (only anonymous visitor_id + UA metadata).
DROP POLICY IF EXISTS "No direct reads on sessions" ON public.analytics_sessions;
DROP POLICY IF EXISTS "No direct reads on page views" ON public.analytics_page_views;

-- Block all SELECTs from anon/authenticated by default; admin uses service role.
CREATE POLICY "No reads sessions"
  ON public.analytics_sessions
  FOR SELECT
  TO anon, authenticated
  USING (false);

CREATE POLICY "No reads page views"
  ON public.analytics_page_views
  FOR SELECT
  TO anon, authenticated
  USING (false);