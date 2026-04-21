CREATE TABLE public.analytics_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id text NOT NULL,
  user_id uuid,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  duration_seconds integer DEFAULT 0,
  page_count integer DEFAULT 1,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  landing_path text,
  user_agent text,
  device_type text,
  browser text,
  os text,
  country text,
  city text,
  language text
);
CREATE INDEX idx_sessions_started ON public.analytics_sessions(started_at DESC);
CREATE INDEX idx_sessions_visitor ON public.analytics_sessions(visitor_id);

CREATE TABLE public.analytics_page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.analytics_sessions(id) ON DELETE CASCADE,
  visitor_id text NOT NULL,
  path text NOT NULL,
  title text,
  referrer text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pv_created ON public.analytics_page_views(created_at DESC);
CREATE INDEX idx_pv_session ON public.analytics_page_views(session_id);
CREATE INDEX idx_pv_path ON public.analytics_page_views(path);

ALTER TABLE public.analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert sessions" ON public.analytics_sessions
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update sessions" ON public.analytics_sessions
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can insert page views" ON public.analytics_page_views
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "No direct reads on sessions" ON public.analytics_sessions
  FOR SELECT USING (false);
CREATE POLICY "No direct reads on page views" ON public.analytics_page_views
  FOR SELECT USING (false);