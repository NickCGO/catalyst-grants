-- ============================================================
-- Enums
-- ============================================================
CREATE TYPE public.email_thread_direction AS ENUM ('inbound', 'outbound');

CREATE TYPE public.email_provider AS ENUM ('gmail', 'outlook', 'smtp');

CREATE TYPE public.automation_trigger AS ENUM (
  'application_submitted',
  'application_won',
  'application_lost',
  'deadline_approaching_7d',
  'deadline_approaching_1d',
  'no_reply_after_14d',
  'no_activity_after_30d'
);

CREATE TYPE public.automation_action AS ENUM (
  'create_task',
  'send_notification',
  'send_email_draft',
  'move_kanban_column'
);

-- ============================================================
-- email_threads
-- ============================================================
CREATE TABLE public.email_threads (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              uuid NOT NULL,
  funder_id           uuid,
  application_id      uuid,
  relationship_id     uuid,
  provider_thread_id  text,
  provider_message_id text,
  direction           public.email_thread_direction NOT NULL,
  from_address        text NOT NULL,
  to_addresses        text[] NOT NULL DEFAULT '{}',
  subject             text,
  snippet             text,
  body_html           text,
  sent_at             timestamptz NOT NULL DEFAULT now(),
  synced_at           timestamptz NOT NULL DEFAULT now(),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, provider_message_id)
);

CREATE INDEX idx_email_threads_org ON public.email_threads (org_id);
CREATE INDEX idx_email_threads_funder ON public.email_threads (funder_id);
CREATE INDEX idx_email_threads_application ON public.email_threads (application_id);
CREATE INDEX idx_email_threads_provider_thread ON public.email_threads (provider_thread_id);

ALTER TABLE public.email_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view email threads"
  ON public.email_threads FOR SELECT
  USING (public.is_org_member(org_id, auth.uid()));

CREATE POLICY "Editors can insert email threads"
  ON public.email_threads FOR INSERT
  WITH CHECK (public.has_org_role(org_id, auth.uid(), 'editor'));

CREATE POLICY "Editors can update email threads"
  ON public.email_threads FOR UPDATE
  USING (public.has_org_role(org_id, auth.uid(), 'editor'));

CREATE POLICY "Editors can delete email threads"
  ON public.email_threads FOR DELETE
  USING (public.has_org_role(org_id, auth.uid(), 'editor'));

CREATE TRIGGER trg_email_threads_updated_at
  BEFORE UPDATE ON public.email_threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- automation_rules
-- ============================================================
CREATE TABLE public.automation_rules (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         uuid NOT NULL,
  name           text NOT NULL,
  trigger_event  public.automation_trigger NOT NULL,
  action_type    public.automation_action NOT NULL,
  action_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active      boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_automation_rules_org_active ON public.automation_rules (org_id, is_active);

ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view automation rules"
  ON public.automation_rules FOR SELECT
  USING (public.is_org_member(org_id, auth.uid()));

CREATE POLICY "Editors can insert automation rules"
  ON public.automation_rules FOR INSERT
  WITH CHECK (public.has_org_role(org_id, auth.uid(), 'editor'));

CREATE POLICY "Editors can update automation rules"
  ON public.automation_rules FOR UPDATE
  USING (public.has_org_role(org_id, auth.uid(), 'editor'));

CREATE POLICY "Editors can delete automation rules"
  ON public.automation_rules FOR DELETE
  USING (public.has_org_role(org_id, auth.uid(), 'editor'));

CREATE TRIGGER trg_automation_rules_updated_at
  BEFORE UPDATE ON public.automation_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- email_credentials (admins only — holds OAuth secret references)
-- ============================================================
CREATE TABLE public.email_credentials (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                  uuid NOT NULL UNIQUE,
  provider                public.email_provider NOT NULL,
  email_address           text NOT NULL,
  access_token_secret_id  text,
  refresh_token_secret_id text,
  token_expires_at        timestamptz,
  last_synced_at          timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view email credentials"
  ON public.email_credentials FOR SELECT
  USING (public.has_org_role(org_id, auth.uid(), 'admin'));

CREATE POLICY "Admins can insert email credentials"
  ON public.email_credentials FOR INSERT
  WITH CHECK (public.has_org_role(org_id, auth.uid(), 'admin'));

CREATE POLICY "Admins can update email credentials"
  ON public.email_credentials FOR UPDATE
  USING (public.has_org_role(org_id, auth.uid(), 'admin'));

CREATE POLICY "Admins can delete email credentials"
  ON public.email_credentials FOR DELETE
  USING (public.has_org_role(org_id, auth.uid(), 'admin'));

CREATE TRIGGER trg_email_credentials_updated_at
  BEFORE UPDATE ON public.email_credentials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- Reporting views (security_invoker so RLS on applications applies)
-- ============================================================
CREATE VIEW public.pipeline_summary
  WITH (security_invoker = true) AS
SELECT
  org_id,
  COALESCE(kanban_column, 'backlog') AS kanban_column,
  COUNT(*)                            AS opportunity_count,
  COALESCE(SUM(amount_requested), 0)  AS total_requested,
  COALESCE(SUM(amount_awarded), 0)    AS total_awarded,
  MIN(deadline)                       AS nearest_deadline
FROM public.applications
GROUP BY org_id, kanban_column;

CREATE VIEW public.stage_velocity
  WITH (security_invoker = true) AS
SELECT
  org_id,
  COALESCE(kanban_column, 'backlog') AS kanban_column,
  ROUND(AVG(
    EXTRACT(EPOCH FROM (COALESCE(updated_at, now()) - created_at)) / 86400
  )::numeric, 1) AS avg_days_in_stage
FROM public.applications
WHERE created_at IS NOT NULL
GROUP BY org_id, kanban_column;