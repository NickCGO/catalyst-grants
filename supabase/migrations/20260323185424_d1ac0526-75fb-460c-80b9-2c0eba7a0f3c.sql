
-- New columns for 9-step deep onboarding
ALTER TABLE public.organisations
  ADD COLUMN IF NOT EXISTS physical_address text,
  ADD COLUMN IF NOT EXISTS postal_address text,
  ADD COLUMN IF NOT EXISTS toc_if_then text,
  ADD COLUMN IF NOT EXISTS beneficiary_reach_unit text DEFAULT 'individuals',
  ADD COLUMN IF NOT EXISTS primary_sdgs text[],
  ADD COLUMN IF NOT EXISTS problem_statement text,
  ADD COLUMN IF NOT EXISTS problem_evidence text,
  ADD COLUMN IF NOT EXISTS problem_root_causes text,
  ADD COLUMN IF NOT EXISTS problem_geographic_context text,
  ADD COLUMN IF NOT EXISTS community_voice_quote text,
  ADD COLUMN IF NOT EXISTS gap_in_services text,
  ADD COLUMN IF NOT EXISTS why_your_org text,
  ADD COLUMN IF NOT EXISTS intervention_approach text,
  ADD COLUMN IF NOT EXISTS innovation_factor text,
  ADD COLUMN IF NOT EXISTS primary_target_group text,
  ADD COLUMN IF NOT EXISTS beneficiary_selection_criteria text,
  ADD COLUMN IF NOT EXISTS beneficiary_demographics jsonb,
  ADD COLUMN IF NOT EXISTS direct_beneficiaries_annual integer,
  ADD COLUMN IF NOT EXISTS indirect_beneficiaries_annual integer,
  ADD COLUMN IF NOT EXISTS beneficiary_participation text,
  ADD COLUMN IF NOT EXISTS key_outcomes text[],
  ADD COLUMN IF NOT EXISTS key_outputs text[],
  ADD COLUMN IF NOT EXISTS impact_indicators jsonb,
  ADD COLUMN IF NOT EXISTS data_collection_methods text[],
  ADD COLUMN IF NOT EXISTS reporting_frequency text,
  ADD COLUMN IF NOT EXISTS mne_framework_description text,
  ADD COLUMN IF NOT EXISTS baseline_data text,
  ADD COLUMN IF NOT EXISTS past_impact_achievements text,
  ADD COLUMN IF NOT EXISTS annual_budget_currency text DEFAULT 'ZAR',
  ADD COLUMN IF NOT EXISTS budget_breakdown jsonb,
  ADD COLUMN IF NOT EXISTS funding_sources_detail jsonb,
  ADD COLUMN IF NOT EXISTS typical_grant_size_range text,
  ADD COLUMN IF NOT EXISTS financial_management_system text,
  ADD COLUMN IF NOT EXISTS has_dedicated_bank_account boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS cofunding_available boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS cofunding_description text,
  ADD COLUMN IF NOT EXISTS executive_director_bio text,
  ADD COLUMN IF NOT EXISTS key_staff jsonb,
  ADD COLUMN IF NOT EXISTS has_policies boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS policies_list text[],
  ADD COLUMN IF NOT EXISTS strategic_plan_period text,
  ADD COLUMN IF NOT EXISTS governance_structure text,
  ADD COLUMN IF NOT EXISTS organisational_achievements text,
  ADD COLUMN IF NOT EXISTS past_funders_detailed jsonb,
  ADD COLUMN IF NOT EXISTS grant_management_experience text,
  ADD COLUMN IF NOT EXISTS lessons_learned text,
  ADD COLUMN IF NOT EXISTS partnership_seeks text[];

-- Programme details table for rich programme data
CREATE TABLE IF NOT EXISTS public.programme_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organisations(id) ON DELETE CASCADE NOT NULL,
  programme_name text NOT NULL,
  description text,
  detailed_description text,
  primary_focus_area text,
  secondary_focus_areas text[],
  target_beneficiaries text,
  annual_reach integer,
  geographic_areas text[],
  activities text[],
  key_outputs text[],
  key_outcomes text[],
  success_story text,
  challenges_faced text,
  approach_methodology text,
  partner_organisations text[],
  annual_budget_range text,
  status text DEFAULT 'active',
  year_started integer,
  intervention_approaches text[],
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.programme_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own programme details"
ON public.programme_details FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.organisations
  WHERE organisations.id = programme_details.org_id
  AND organisations.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.organisations
  WHERE organisations.id = programme_details.org_id
  AND organisations.user_id = auth.uid()
));
