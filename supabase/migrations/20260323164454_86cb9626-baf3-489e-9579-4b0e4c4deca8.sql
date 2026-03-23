
-- Funder Relationships CRM table
CREATE TABLE public.funder_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organisations(id) NOT NULL,
  funder_id uuid REFERENCES public.funders(id) NOT NULL,
  relationship_status text DEFAULT 'prospect',
  health_score integer DEFAULT 50,
  last_interaction_date date,
  next_action_date date,
  next_action_type text,
  next_action_note text,
  relationship_owner uuid,
  total_applied numeric DEFAULT 0,
  total_awarded numeric DEFAULT 0,
  applications_count integer DEFAULT 0,
  successful_count integer DEFAULT 0,
  notes text,
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(org_id, funder_id)
);

ALTER TABLE public.funder_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own funder relationships"
  ON public.funder_relationships FOR ALL
  USING (EXISTS (
    SELECT 1 FROM organisations WHERE organisations.id = funder_relationships.org_id AND organisations.user_id = auth.uid()
  ));

-- Funder Interactions table
CREATE TABLE public.funder_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organisations(id) NOT NULL,
  funder_id uuid REFERENCES public.funders(id) NOT NULL,
  relationship_id uuid REFERENCES public.funder_relationships(id),
  interaction_type text NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  summary text,
  outcome text,
  sentiment text DEFAULT 'unknown',
  created_by uuid,
  ai_generated boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.funder_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own funder interactions"
  ON public.funder_interactions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM organisations WHERE organisations.id = funder_interactions.org_id AND organisations.user_id = auth.uid()
  ));

-- Trigger for updated_at on funder_relationships
CREATE TRIGGER update_funder_relationships_updated_at
  BEFORE UPDATE ON public.funder_relationships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
