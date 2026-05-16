
-- =====================================================================
-- Subscriptions table (sandbox + live coexist via environment column)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  environment text NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox','live')),
  stripe_customer_id text,
  stripe_subscription_id text,
  price_id text,
  product_id text,
  tier text,
  status text NOT NULL DEFAULT 'incomplete',
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  trial_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_env ON public.subscriptions(user_id, environment, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_subscriptions_stripe_sub ON public.subscriptions(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Service role manages subscriptions"
  ON public.subscriptions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================================
-- Trial / usage tracking on organisations
-- =====================================================================
ALTER TABLE public.organisations
  ADD COLUMN IF NOT EXISTS trial_started_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS proposals_used integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS plan_tier text NOT NULL DEFAULT 'trial';

-- Backfill trial_started_at for existing orgs
UPDATE public.organisations SET trial_started_at = COALESCE(trial_started_at, created_at, now()) WHERE trial_started_at IS NULL;

-- =====================================================================
-- has_active_subscription: server-side check
-- =====================================================================
CREATE OR REPLACE FUNCTION public.has_active_subscription(_user_id uuid, _env text DEFAULT 'sandbox')
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = _user_id
      AND environment = _env
      AND status IN ('active','trialing','past_due')
      AND (current_period_end IS NULL OR current_period_end > now())
  );
$$;

-- =====================================================================
-- get_access_state: returns trial/paid/expired status for the caller
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_access_state(_env text DEFAULT 'sandbox')
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  org RECORD;
  sub RECORD;
  trial_days_used int;
  trial_expired boolean;
  proposal_limit_hit boolean;
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
    RETURN jsonb_build_object(
      'state','paid',
      'tier', COALESCE(sub.tier,'bronze'),
      'price_id', sub.price_id,
      'status', sub.status,
      'current_period_end', sub.current_period_end,
      'cancel_at_period_end', sub.cancel_at_period_end
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
$$;

-- =====================================================================
-- Increment proposals_used when a new proposal is inserted
-- =====================================================================
CREATE OR REPLACE FUNCTION public.bump_proposals_used()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.organisations
     SET proposals_used = COALESCE(proposals_used,0) + 1
   WHERE id = NEW.org_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bump_proposals_used ON public.proposals;
CREATE TRIGGER trg_bump_proposals_used
  AFTER INSERT ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION public.bump_proposals_used();

-- =====================================================================
-- Realtime
-- =====================================================================
ALTER TABLE public.subscriptions REPLICA IDENTITY FULL;
DO $$ BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
