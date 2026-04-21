GRANT INSERT, UPDATE ON public.analytics_sessions TO anon, authenticated;
GRANT INSERT ON public.analytics_page_views TO anon, authenticated;
-- Allow returning inserted row id via .select()
GRANT SELECT (id) ON public.analytics_sessions TO anon, authenticated;