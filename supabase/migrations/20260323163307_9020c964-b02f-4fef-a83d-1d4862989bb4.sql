
-- Phase 3: Team Collaboration tables

CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organisations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  email text NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'viewer',
  avatar_url text,
  status text DEFAULT 'pending',
  invited_by uuid,
  invited_at timestamptz DEFAULT now(),
  joined_at timestamptz,
  last_active timestamptz
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view own org team" ON public.team_members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.organisations WHERE id = team_members.org_id AND user_id = auth.uid())
    OR team_members.user_id = auth.uid()
  );

CREATE POLICY "Org owners/admins can manage team" ON public.team_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.organisations WHERE id = team_members.org_id AND user_id = auth.uid()
    )
  );

-- Team invitations
CREATE TABLE public.team_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organisations(id) ON DELETE CASCADE NOT NULL,
  invited_email text NOT NULL,
  role text NOT NULL DEFAULT 'viewer',
  invite_token text UNIQUE DEFAULT gen_random_uuid()::text,
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  accepted boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org owners can manage invitations" ON public.team_invitations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.organisations WHERE id = team_invitations.org_id AND user_id = auth.uid())
  );

-- Tasks
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organisations(id) ON DELETE CASCADE NOT NULL,
  application_id uuid REFERENCES public.applications(id) ON DELETE SET NULL,
  proposal_id uuid REFERENCES public.proposals(id) ON DELETE SET NULL,
  assigned_to uuid,
  assigned_by uuid,
  title text NOT NULL,
  description text,
  due_date date,
  priority text DEFAULT 'medium',
  status text DEFAULT 'open',
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own org tasks" ON public.tasks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.organisations WHERE id = tasks.org_id AND user_id = auth.uid())
  );

-- Proposal comments
CREATE TABLE public.proposal_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid REFERENCES public.proposals(id) ON DELETE CASCADE NOT NULL,
  section_key text,
  content text NOT NULL,
  created_by uuid NOT NULL,
  resolved boolean DEFAULT false,
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.proposal_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org comments" ON public.proposal_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.proposals p
      JOIN public.organisations o ON p.org_id = o.id
      WHERE p.id = proposal_comments.proposal_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert comments" ON public.proposal_comments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.proposals p
      JOIN public.organisations o ON p.org_id = o.id
      WHERE p.id = proposal_comments.proposal_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own comments" ON public.proposal_comments
  FOR UPDATE USING (created_by = auth.uid());

-- Notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid REFERENCES public.organisations(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- Add new columns to organisations for deep onboarding
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS trading_name text;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS org_type text;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS tax_status text;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS pbo_number text;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS is_audited boolean DEFAULT false;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS last_audit_year integer;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS vision_statement text;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS core_values text[];
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS theory_of_change text;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS beneficiary_groups text[];
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS annual_beneficiary_reach integer;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS impact_statement text;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS sdgs integer[];
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS focus_priority jsonb;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS programme_details jsonb;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS annual_budget numeric;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS operational_expenses numeric;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS funding_gap numeric;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS regions_of_operation text[];
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS cities text[];
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS works_rural boolean DEFAULT false;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS works_urban boolean DEFAULT false;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS works_other_african boolean DEFAULT false;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS other_african_countries text[];
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS works_internationally boolean DEFAULT false;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS geo_summary text;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS fte_count integer;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS parttime_count integer;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS volunteer_count integer;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS board_count integer;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS has_grant_writer boolean DEFAULT false;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS ceo_name text;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS finance_contact text;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS annual_income numeric;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS pct_grants integer DEFAULT 0;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS pct_government integer DEFAULT 0;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS pct_corporate integer DEFAULT 0;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS has_strategic_plan boolean DEFAULT false;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS has_me_framework boolean DEFAULT false;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS has_bbbee boolean DEFAULT false;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS bbbee_level integer;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS past_funders text[];
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS largest_grant_range text;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS total_funding_3yr text;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS funding_achievement text;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS partnership_open boolean;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS partnership_role text;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS partner_types text[];
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS partnership_strengths text[];
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS partnership_statement text;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS is_discoverable boolean DEFAULT false;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS profile_completeness integer DEFAULT 0;
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS onboarding_step integer DEFAULT 0;
