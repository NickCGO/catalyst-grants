CREATE TABLE public.user_roles (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 role text NOT NULL,
 UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own platform roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email_confirmed_at IS NOT NULL AND lower(email) IN ('founders@grantmatch.co.za','admin@grantmatch.co.za','info@nickfernandes.co.za','hello@chantalehlen.com');
CREATE TABLE public.oauth_connection_states (
 nonce uuid PRIMARY KEY,
 user_id uuid NOT NULL,
 org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
 provider text NOT NULL,
 expires_at timestamptz NOT NULL
);
GRANT ALL ON public.oauth_connection_states TO service_role;
REVOKE ALL ON public.oauth_connection_states FROM anon, authenticated;
ALTER TABLE public.oauth_connection_states ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.ai_daily_usage (
 org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
 usage_day date NOT NULL DEFAULT CURRENT_DATE,
 calls integer NOT NULL DEFAULT 0,
 PRIMARY KEY(org_id, usage_day)
);
GRANT ALL ON public.ai_daily_usage TO service_role;
REVOKE ALL ON public.ai_daily_usage FROM anon, authenticated;
ALTER TABLE public.ai_daily_usage ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.reserve_ai_call(_org_id uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE used integer;
BEGIN
 INSERT INTO public.ai_daily_usage(org_id,usage_day,calls) VALUES(_org_id,CURRENT_DATE,1)
 ON CONFLICT(org_id,usage_day) DO UPDATE SET calls=ai_daily_usage.calls+1 WHERE ai_daily_usage.calls < 10
 RETURNING calls INTO used;
 RETURN used IS NOT NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.reserve_ai_call(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_ai_call(uuid) TO service_role;