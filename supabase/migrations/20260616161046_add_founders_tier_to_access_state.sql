CREATE OR REPLACE FUNCTION public.get_access_state(_env text DEFAULT 'sandbox'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  org RECORD;
  sub RECORD;
  trial_days_used int;
  trial_expired boolean;
  proposal_limit_hit boolean;
  tier_limit int;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('state','anonymous');
  END IF;

  SELECT * INTO org FROM public.organisations WHERE user_id = uid LIMIT 1;

  SELECT * INTO sub
    FROM public.subscriptions
    WHERE user_id = uid AND environment = _env
    ORDER BY created_at DESC LIMIT 1;

  IF sub.id IS NOT NULL AND sub.status IN ('active','trialing','past_due')
     AND (sub.current_period_end IS NULL OR sub.current_period_end > now()) THEN
    tier_limit := CASE COALESCE(sub.tier,'starter')
                    WHEN 'founders' THEN 3
                    WHEN 'starter' THEN 3
                    WHEN 'growth' THEN 10
                    ELSE 3
                  END;
    proposal_limit_hit := COALESCE(org.proposals_used,0) >= tier_limit;
    RETURN jsonb_build_object(
      'state', CASE WHEN proposal_limit_hit THEN 'limit_reached' ELSE 'paid' END,
      'tier', COALESCE(sub.tier,'starter'),
      'price_id', sub.price_id,
      'status', sub.status,
      'current_period_end', sub.current_period_end,
      'cancel_at_period_end', sub.cancel_at_period_end,
      'proposals_used', COALESCE(org.proposals_used,0),
      'proposals_limit', tier_limit
    );
  END IF;

  IF org.id IS NULL THEN
    RETURN jsonb_build_object('state','trial','trial_days_left',7,'proposals_used',0,'proposals_limit',1);
  END IF;

  trial_days_used := GREATEST(0, EXTRACT(EPOCH FROM (now() - COALESCE(org.trial_started_at, org.created_at, now())))::int / 86400);
  trial_expired := trial_days_used >= 7;
  proposal_limit_hit := COALESCE(org.proposals_used,0) >= 1;

  IF trial_expired OR proposal_limit_hit THEN
    RETURN jsonb_build_object(
      'state','expired',
      'reason', CASE WHEN trial_expired THEN 'time' ELSE 'proposals' END,
      'trial_days_left', 0,
      'proposals_used', COALESCE(org.proposals_used,0),
      'proposals_limit', 1
    );
  END IF;

  RETURN jsonb_build_object(
    'state','trial',
    'trial_days_left', GREATEST(0, 7 - trial_days_used),
    'proposals_used', COALESCE(org.proposals_used,0),
    'proposals_limit', 1
  );
END;
$function$;
