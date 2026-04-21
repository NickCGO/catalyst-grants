ALTER TABLE public.analytics_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.analytics_page_views REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.analytics_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.analytics_page_views;