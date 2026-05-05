-- =========================================================================
-- TEAM INVITES (team_members already exists)
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.team_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'viewer',
  invited_by uuid NOT NULL,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  status text NOT NULL DEFAULT 'pending',
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  UNIQUE (org_id, email)
);

CREATE INDEX IF NOT EXISTS idx_team_invites_email ON public.team_invites(email);
CREATE INDEX IF NOT EXISTS idx_team_invites_org ON public.team_invites(org_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_org_status ON public.team_members(org_id, status);

-- Backfill: every existing organisation owner becomes a team_member with role 'owner'
INSERT INTO public.team_members (org_id, user_id, role, email, full_name, status, joined_at)
SELECT
  o.id,
  o.user_id,
  'owner',
  COALESCE(au.email, 'unknown@local'),
  o.name,
  'active',
  COALESCE(o.created_at, now())
FROM public.organisations o
LEFT JOIN auth.users au ON au.id = o.user_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_members tm WHERE tm.org_id = o.id AND tm.user_id = o.user_id
);

-- =========================================================================
-- SECURITY HELPERS
-- =========================================================================

CREATE OR REPLACE FUNCTION public.is_org_member(_org_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE org_id = _org_id AND user_id = _user_id AND status = 'active'
  )
  OR EXISTS (
    SELECT 1
    FROM public.organisations
    WHERE id = _org_id AND user_id = _user_id
  );
$$;

-- Role hierarchy: owner=4 > admin=3 > editor=2 > viewer=1
CREATE OR REPLACE FUNCTION public.has_org_role(_org_id uuid, _user_id uuid, _min_role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH role_levels AS (
    SELECT 'owner'::text AS r, 4 AS lvl
    UNION ALL SELECT 'admin', 3
    UNION ALL SELECT 'editor', 2
    UNION ALL SELECT 'viewer', 1
  )
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members tm
    JOIN role_levels mr ON mr.r = tm.role
    JOIN role_levels rq ON rq.r = _min_role
    WHERE tm.org_id = _org_id
      AND tm.user_id = _user_id
      AND tm.status = 'active'
      AND mr.lvl >= rq.lvl
  );
$$;

-- =========================================================================
-- TEAM POLICIES (replace the broad existing ones)
-- =========================================================================

DROP POLICY IF EXISTS "Org owners/admins can manage team" ON public.team_members;
DROP POLICY IF EXISTS "Team members can view own org team" ON public.team_members;

CREATE POLICY "Members can view team roster"
  ON public.team_members FOR SELECT
  USING (public.is_org_member(org_id, auth.uid()));

CREATE POLICY "Admins can add members"
  ON public.team_members FOR INSERT
  WITH CHECK (public.has_org_role(org_id, auth.uid(), 'admin'));

CREATE POLICY "Admins can update members"
  ON public.team_members FOR UPDATE
  USING (public.has_org_role(org_id, auth.uid(), 'admin'));

CREATE POLICY "Admins can remove members"
  ON public.team_members FOR DELETE
  USING (public.has_org_role(org_id, auth.uid(), 'admin'));

ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org invites"
  ON public.team_invites FOR SELECT
  USING (public.is_org_member(org_id, auth.uid()));

CREATE POLICY "Admins can create invites"
  ON public.team_invites FOR INSERT
  WITH CHECK (public.has_org_role(org_id, auth.uid(), 'admin') AND invited_by = auth.uid());

CREATE POLICY "Admins can update invites"
  ON public.team_invites FOR UPDATE
  USING (public.has_org_role(org_id, auth.uid(), 'admin'));

CREATE POLICY "Admins can delete invites"
  ON public.team_invites FOR DELETE
  USING (public.has_org_role(org_id, auth.uid(), 'admin'));

-- =========================================================================
-- EXTEND ORG DATA POLICIES TO TEAM MEMBERS (additive — owner policies remain)
-- =========================================================================

CREATE POLICY "Team members can view org"
  ON public.organisations FOR SELECT
  USING (public.is_org_member(id, auth.uid()));

CREATE POLICY "Editors can update org"
  ON public.organisations FOR UPDATE
  USING (public.has_org_role(id, auth.uid(), 'editor'));

CREATE POLICY "Team members can view applications"
  ON public.applications FOR SELECT
  USING (public.is_org_member(org_id, auth.uid()));

CREATE POLICY "Editors can insert applications"
  ON public.applications FOR INSERT
  WITH CHECK (public.has_org_role(org_id, auth.uid(), 'editor'));

CREATE POLICY "Editors can update applications"
  ON public.applications FOR UPDATE
  USING (public.has_org_role(org_id, auth.uid(), 'editor'));

CREATE POLICY "Editors can delete applications"
  ON public.applications FOR DELETE
  USING (public.has_org_role(org_id, auth.uid(), 'editor'));

CREATE POLICY "Team members can view funder relationships"
  ON public.funder_relationships FOR SELECT
  USING (public.is_org_member(org_id, auth.uid()));

CREATE POLICY "Editors can manage funder relationships"
  ON public.funder_relationships FOR ALL
  USING (public.has_org_role(org_id, auth.uid(), 'editor'))
  WITH CHECK (public.has_org_role(org_id, auth.uid(), 'editor'));

CREATE POLICY "Team members can view crm emails"
  ON public.crm_emails FOR SELECT
  USING (public.is_org_member(org_id, auth.uid()));

CREATE POLICY "Editors can manage crm emails"
  ON public.crm_emails FOR ALL
  USING (public.has_org_role(org_id, auth.uid(), 'editor'))
  WITH CHECK (public.has_org_role(org_id, auth.uid(), 'editor'));

CREATE POLICY "Team members can view crm notes"
  ON public.crm_activity_notes FOR SELECT
  USING (public.is_org_member(org_id, auth.uid()));

CREATE POLICY "Editors can manage crm notes"
  ON public.crm_activity_notes FOR ALL
  USING (public.has_org_role(org_id, auth.uid(), 'editor'))
  WITH CHECK (public.has_org_role(org_id, auth.uid(), 'editor'));

CREATE POLICY "Team members can view interactions"
  ON public.funder_interactions FOR SELECT
  USING (public.is_org_member(org_id, auth.uid()));

CREATE POLICY "Editors can manage interactions"
  ON public.funder_interactions FOR ALL
  USING (public.has_org_role(org_id, auth.uid(), 'editor'))
  WITH CHECK (public.has_org_role(org_id, auth.uid(), 'editor'));

-- =========================================================================
-- PER-ORG INBOUND EMAIL
-- =========================================================================

ALTER TABLE public.organisations
  ADD COLUMN IF NOT EXISTS inbound_mailbox_token text UNIQUE;

UPDATE public.organisations
SET inbound_mailbox_token = lower(
  regexp_replace(coalesce(substring(name from 1 for 12), 'org'), '[^a-zA-Z0-9]+', '-', 'g')
) || '-' || substring(encode(gen_random_bytes(3), 'hex') from 1 for 4)
WHERE inbound_mailbox_token IS NULL;

CREATE OR REPLACE FUNCTION public.assign_inbound_mailbox_token()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.inbound_mailbox_token IS NULL THEN
    NEW.inbound_mailbox_token := lower(
      regexp_replace(coalesce(substring(NEW.name from 1 for 12), 'org'), '[^a-zA-Z0-9]+', '-', 'g')
    ) || '-' || substring(encode(gen_random_bytes(3), 'hex') from 1 for 4);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_inbound_mailbox_token ON public.organisations;
CREATE TRIGGER trg_assign_inbound_mailbox_token
  BEFORE INSERT ON public.organisations
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_inbound_mailbox_token();

CREATE TABLE IF NOT EXISTS public.inbound_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  funder_id uuid,
  relationship_id uuid,
  from_email text NOT NULL,
  from_name text,
  to_email text NOT NULL,
  subject text,
  body_text text,
  body_html text,
  message_id text,
  in_reply_to text,
  received_at timestamptz NOT NULL DEFAULT now(),
  raw_payload jsonb,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inbound_emails_org ON public.inbound_emails(org_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_inbound_emails_funder ON public.inbound_emails(funder_id);
CREATE INDEX IF NOT EXISTS idx_inbound_emails_relationship ON public.inbound_emails(relationship_id);

ALTER TABLE public.inbound_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view inbound emails"
  ON public.inbound_emails FOR SELECT
  USING (public.is_org_member(org_id, auth.uid()));

CREATE POLICY "Editors can update inbound emails"
  ON public.inbound_emails FOR UPDATE
  USING (public.has_org_role(org_id, auth.uid(), 'editor'))
  WITH CHECK (public.has_org_role(org_id, auth.uid(), 'editor'));

CREATE POLICY "Service role can insert inbound emails"
  ON public.inbound_emails FOR INSERT
  WITH CHECK (auth.role() = 'service_role');