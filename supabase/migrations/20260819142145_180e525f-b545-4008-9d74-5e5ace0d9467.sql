REVOKE ALL ON FUNCTION public.bump_proposals_used() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.notify_org_admins_on_inbound_email() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_funder_pipeline_on_interaction() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_access_state(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_active_subscription(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_access_state(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) TO authenticated;
