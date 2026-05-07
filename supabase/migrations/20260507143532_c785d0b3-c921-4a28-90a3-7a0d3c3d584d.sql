
-- 1) Notify owners + admins on new inbound email
CREATE OR REPLACE FUNCTION public.notify_org_admins_on_inbound_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recipient_id uuid;
  org_owner_id uuid;
BEGIN
  -- Owner of the org (organisations.user_id)
  SELECT user_id INTO org_owner_id FROM public.organisations WHERE id = NEW.org_id;
  IF org_owner_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, org_id, type, title, body, link)
    VALUES (
      org_owner_id, NEW.org_id, 'inbound_email',
      COALESCE('New email from ' || COALESCE(NEW.from_name, NEW.from_email), 'New email received'),
      LEFT(COALESCE(NEW.subject, NEW.body_text, ''), 200),
      CASE WHEN NEW.funder_id IS NOT NULL THEN '/crm/' || NEW.funder_id::text ELSE '/inbox' END
    );
  END IF;

  -- Admin team members
  FOR recipient_id IN
    SELECT user_id FROM public.team_members
    WHERE org_id = NEW.org_id AND status = 'active' AND role IN ('admin','owner')
      AND user_id IS DISTINCT FROM org_owner_id
  LOOP
    INSERT INTO public.notifications (user_id, org_id, type, title, body, link)
    VALUES (
      recipient_id, NEW.org_id, 'inbound_email',
      COALESCE('New email from ' || COALESCE(NEW.from_name, NEW.from_email), 'New email received'),
      LEFT(COALESCE(NEW.subject, NEW.body_text, ''), 200),
      CASE WHEN NEW.funder_id IS NOT NULL THEN '/crm/' || NEW.funder_id::text ELSE '/inbox' END
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_inbound_email ON public.inbound_emails;
CREATE TRIGGER trg_notify_inbound_email
AFTER INSERT ON public.inbound_emails
FOR EACH ROW EXECUTE FUNCTION public.notify_org_admins_on_inbound_email();

-- Realtime for inbox feature
ALTER TABLE public.inbound_emails REPLICA IDENTITY FULL;
DO $$ BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.inbound_emails';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2) Accept invite RPC
CREATE OR REPLACE FUNCTION public.accept_team_invite(_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite RECORD;
  user_email text;
  user_id_v uuid;
BEGIN
  user_id_v := auth.uid();
  IF user_id_v IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  SELECT email INTO user_email FROM auth.users WHERE id = user_id_v;
  IF user_email IS NULL THEN
    RETURN jsonb_build_object('error', 'no_email');
  END IF;

  SELECT * INTO invite FROM public.team_invites
   WHERE token = _token AND status = 'pending'
   LIMIT 1;
  IF invite IS NULL THEN
    RETURN jsonb_build_object('error', 'invalid_or_used');
  END IF;
  IF invite.expires_at < now() THEN
    RETURN jsonb_build_object('error', 'expired');
  END IF;
  IF lower(invite.email) <> lower(user_email) THEN
    RETURN jsonb_build_object('error', 'email_mismatch', 'expected', invite.email);
  END IF;

  -- Insert or upgrade member
  INSERT INTO public.team_members (org_id, user_id, email, role, status, invited_by, joined_at)
  VALUES (invite.org_id, user_id_v, user_email, invite.role, 'active', invite.invited_by, now())
  ON CONFLICT (org_id, user_id) DO UPDATE
    SET role = EXCLUDED.role, status = 'active', joined_at = COALESCE(public.team_members.joined_at, now());

  UPDATE public.team_invites SET status = 'accepted', accepted_at = now() WHERE id = invite.id;

  RETURN jsonb_build_object('ok', true, 'org_id', invite.org_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_team_invite(text) TO authenticated;

-- Ensure unique (org_id,user_id) for ON CONFLICT
DO $$ BEGIN
  ALTER TABLE public.team_members ADD CONSTRAINT team_members_org_user_unique UNIQUE (org_id, user_id);
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL;
END $$;
