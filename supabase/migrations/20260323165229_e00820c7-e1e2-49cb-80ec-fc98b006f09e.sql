
-- Partnership members (create first, referenced by other policies)
CREATE TABLE public.partnership_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partnership_id uuid NOT NULL,
  org_id uuid REFERENCES public.organisations(id) NOT NULL,
  role text DEFAULT 'equal_partner',
  budget_share_percent integer,
  responsibilities text[],
  joined_at timestamptz DEFAULT now(),
  status text DEFAULT 'active'
);

-- Partnerships
CREATE TABLE public.partnerships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_org_id uuid REFERENCES public.organisations(id) NOT NULL,
  partnership_name text,
  description text,
  status text DEFAULT 'forming',
  funder_id uuid REFERENCES public.funders(id),
  application_id uuid REFERENCES public.applications(id),
  partnership_type text DEFAULT 'consortium',
  budget_total numeric,
  lead_share_percent integer,
  agreement_signed boolean DEFAULT false,
  mou_content text,
  trust_score integer DEFAULT 50,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Now add the FK on partnership_members
ALTER TABLE public.partnership_members ADD CONSTRAINT partnership_members_partnership_id_fkey FOREIGN KEY (partnership_id) REFERENCES public.partnerships(id);

-- RLS for partnerships
ALTER TABLE public.partnerships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own partnerships" ON public.partnerships FOR ALL USING (
  EXISTS (SELECT 1 FROM organisations WHERE organisations.id = partnerships.lead_org_id AND organisations.user_id = auth.uid())
);
CREATE POLICY "Partners can view partnerships" ON public.partnerships FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM partnership_members pm
    JOIN organisations o ON o.id = pm.org_id
    WHERE pm.partnership_id = partnerships.id AND o.user_id = auth.uid()
  )
);

-- RLS for partnership_members
ALTER TABLE public.partnership_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lead org can manage members" ON public.partnership_members FOR ALL USING (
  EXISTS (
    SELECT 1 FROM partnerships p
    JOIN organisations o ON o.id = p.lead_org_id
    WHERE p.id = partnership_members.partnership_id AND o.user_id = auth.uid()
  )
);
CREATE POLICY "Members can view own membership" ON public.partnership_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM organisations WHERE organisations.id = partnership_members.org_id AND organisations.user_id = auth.uid())
);

-- Partnership proposals
CREATE TABLE public.partnership_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partnership_id uuid REFERENCES public.partnerships(id) NOT NULL,
  funder_id uuid REFERENCES public.funders(id),
  status text DEFAULT 'draft',
  sections jsonb,
  merged_content text,
  section_ownership jsonb,
  ai_merge_status text DEFAULT 'pending',
  overall_score integer,
  version integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.partnership_proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Partnership members can manage proposals" ON public.partnership_proposals FOR ALL USING (
  EXISTS (
    SELECT 1 FROM partnership_members pm
    JOIN organisations o ON o.id = pm.org_id
    WHERE pm.partnership_id = partnership_proposals.partnership_id AND o.user_id = auth.uid()
  )
);
