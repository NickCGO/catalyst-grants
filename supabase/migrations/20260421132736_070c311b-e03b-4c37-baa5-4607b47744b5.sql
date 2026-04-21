DROP POLICY IF EXISTS "Anyone can insert sessions" ON public.analytics_sessions;
DROP POLICY IF EXISTS "Anyone can update sessions" ON public.analytics_sessions;
DROP POLICY IF EXISTS "Anyone can insert page views" ON public.analytics_page_views;

CREATE POLICY "Public insert sessions" ON public.analytics_sessions FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public update sessions" ON public.analytics_sessions FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public insert page views" ON public.analytics_page_views FOR INSERT TO public WITH CHECK (true);