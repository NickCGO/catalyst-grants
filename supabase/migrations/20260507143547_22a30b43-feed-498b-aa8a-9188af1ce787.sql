REVOKE EXECUTE ON FUNCTION public.accept_team_invite(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.accept_team_invite(text) TO authenticated;