-- Drop and recreate analytics RLS policies to explicitly allow anon + authenticated roles
DROP POLICY IF EXISTS "Public insert sessions" ON public.analytics_sessions;
DROP POLICY IF EXISTS "Public update sessions" ON public.analytics_sessions;
DROP POLICY IF EXISTS "Public insert page views" ON public.analytics_page_views;

CREATE POLICY "Anon can insert sessions"
  ON public.analytics_sessions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anon can update sessions"
  ON public.analytics_sessions
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon can insert page views"
  ON public.analytics_page_views
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);