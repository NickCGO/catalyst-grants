
-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- organisations table
CREATE TABLE public.organisations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  country TEXT,
  region TEXT,
  registration_number TEXT,
  founded_year INTEGER,
  org_size TEXT,
  mission_statement TEXT,
  focus_areas TEXT[],
  programmes TEXT[],
  website TEXT,
  logo_url TEXT,
  onboarding_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own org" ON public.organisations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own org" ON public.organisations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own org" ON public.organisations FOR UPDATE USING (auth.uid() = user_id);

-- funders table
CREATE TABLE public.funders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pappilon_code TEXT,
  elizayo_code TEXT,
  donor_name TEXT NOT NULL,
  category TEXT,
  method_of_approach TEXT,
  funder_focus TEXT,
  company_standing TEXT,
  application_period TEXT,
  call_for_proposal TEXT,
  website TEXT,
  contact_person TEXT,
  email TEXT,
  title TEXT,
  has_grants BOOLEAN DEFAULT true,
  has_scholarships BOOLEAN DEFAULT false,
  has_capacity_building BOOLEAN DEFAULT false,
  address1 TEXT,
  address2 TEXT,
  address3 TEXT,
  address4 TEXT,
  geographical_area TEXT,
  telephone TEXT,
  subsidiary_of TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.funders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Funders are publicly readable" ON public.funders FOR SELECT USING (true);

-- funder_focus_areas
CREATE TABLE public.funder_focus_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funder_id UUID REFERENCES public.funders(id) ON DELETE CASCADE,
  donor_name TEXT,
  children BOOLEAN DEFAULT false,
  families_parents BOOLEAN DEFAULT false,
  disability BOOLEAN DEFAULT false,
  health_aids_sexual_reproductive BOOLEAN DEFAULT false,
  aged_elderly BOOLEAN DEFAULT false,
  women_gender_dv_girls BOOLEAN DEFAULT false,
  lgbtqi_gender_equality BOOLEAN DEFAULT false,
  youth BOOLEAN DEFAULT false,
  education_ecd BOOLEAN DEFAULT false,
  science_research BOOLEAN DEFAULT false,
  capacity_building_governance BOOLEAN DEFAULT false,
  entrepreneur_skills_vocational BOOLEAN DEFAULT false,
  poverty_livelihood BOOLEAN DEFAULT false,
  housing_homeless BOOLEAN DEFAULT false,
  welfare BOOLEAN DEFAULT false,
  displaced_refugees BOOLEAN DEFAULT false,
  peace_conflict_resolution BOOLEAN DEFAULT false,
  human_rights_advocacy BOOLEAN DEFAULT false,
  religion BOOLEAN DEFAULT false,
  arts_culture BOOLEAN DEFAULT false,
  sports BOOLEAN DEFAULT false,
  community_development BOOLEAN DEFAULT false,
  environment_conservation BOOLEAN DEFAULT false,
  agriculture_land BOOLEAN DEFAULT false,
  animals BOOLEAN DEFAULT false
);
ALTER TABLE public.funder_focus_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Focus areas publicly readable" ON public.funder_focus_areas FOR SELECT USING (true);

-- funder_windows
CREATE TABLE public.funder_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funder_id UUID REFERENCES public.funders(id) ON DELETE CASCADE,
  donor_name TEXT,
  application_period_text TEXT,
  jan BOOLEAN DEFAULT false,
  feb BOOLEAN DEFAULT false,
  mar BOOLEAN DEFAULT false,
  apr BOOLEAN DEFAULT false,
  may BOOLEAN DEFAULT false,
  jun BOOLEAN DEFAULT false,
  jul BOOLEAN DEFAULT false,
  aug BOOLEAN DEFAULT false,
  sep BOOLEAN DEFAULT false,
  oct BOOLEAN DEFAULT false,
  nov BOOLEAN DEFAULT false,
  dec BOOLEAN DEFAULT false
);
ALTER TABLE public.funder_windows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Windows publicly readable" ON public.funder_windows FOR SELECT USING (true);

-- applications
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE NOT NULL,
  funder_id UUID REFERENCES public.funders(id),
  status TEXT DEFAULT 'pending',
  kanban_column TEXT DEFAULT 'backlog',
  applied_month TEXT,
  applied_year INTEGER,
  deadline DATE,
  amount_requested NUMERIC,
  amount_awarded NUMERIC,
  project_name TEXT,
  notes TEXT,
  activity_category TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own apps" ON public.applications FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.organisations WHERE id = applications.org_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert own apps" ON public.applications FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.organisations WHERE id = org_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update own apps" ON public.applications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.organisations WHERE id = applications.org_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete own apps" ON public.applications FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.organisations WHERE id = applications.org_id AND user_id = auth.uid())
);
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- proposals
CREATE TABLE public.proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  funder_id UUID REFERENCES public.funders(id),
  org_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE,
  draft_content TEXT,
  ai_score INTEGER,
  ai_feedback TEXT,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'draft',
  reviewed_by TEXT,
  approved_at TIMESTAMPTZ,
  sections JSONB,
  word_count INTEGER,
  target_word_count INTEGER DEFAULT 2000,
  funder_requirements TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own proposals" ON public.proposals FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.organisations WHERE id = proposals.org_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert own proposals" ON public.proposals FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.organisations WHERE id = org_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update own proposals" ON public.proposals FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.organisations WHERE id = proposals.org_id AND user_id = auth.uid())
);

-- grant_matches
CREATE TABLE public.grant_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE NOT NULL,
  funder_id UUID REFERENCES public.funders(id) ON DELETE CASCADE NOT NULL,
  match_score INTEGER,
  focus_score INTEGER,
  geo_score INTEGER,
  timing_score INTEGER,
  method_score INTEGER,
  is_saved BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  calculated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.grant_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own matches" ON public.grant_matches FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.organisations WHERE id = grant_matches.org_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert own matches" ON public.grant_matches FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.organisations WHERE id = org_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update own matches" ON public.grant_matches FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.organisations WHERE id = grant_matches.org_id AND user_id = auth.uid())
);

-- proposal_versions
CREATE TABLE public.proposal_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE CASCADE NOT NULL,
  version_number INTEGER NOT NULL,
  content TEXT,
  word_count INTEGER,
  change_summary TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.proposal_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own versions" ON public.proposal_versions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.proposals p JOIN public.organisations o ON p.org_id = o.id WHERE p.id = proposal_versions.proposal_id AND o.user_id = auth.uid())
);
CREATE POLICY "Users can insert own versions" ON public.proposal_versions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.proposals p JOIN public.organisations o ON p.org_id = o.id WHERE p.id = proposal_id AND o.user_id = auth.uid())
);

-- proposal_scores
CREATE TABLE public.proposal_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE CASCADE NOT NULL,
  overall_score INTEGER,
  executive_summary_score INTEGER,
  problem_statement_score INTEGER,
  objectives_score INTEGER,
  methodology_score INTEGER,
  impact_score INTEGER,
  budget_score INTEGER,
  organisation_score INTEGER,
  feedback_json JSONB,
  recommendations TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.proposal_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own scores" ON public.proposal_scores FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.proposals p JOIN public.organisations o ON p.org_id = o.id WHERE p.id = proposal_scores.proposal_id AND o.user_id = auth.uid())
);
CREATE POLICY "Users can insert own scores" ON public.proposal_scores FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.proposals p JOIN public.organisations o ON p.org_id = o.id WHERE p.id = proposal_id AND o.user_id = auth.uid())
);

-- deadline_intelligence
CREATE TABLE public.deadline_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE NOT NULL,
  funder_id UUID REFERENCES public.funders(id),
  deadline_date DATE,
  estimated_writing_days INTEGER,
  recommended_start_date DATE,
  workload_conflict BOOLEAN DEFAULT false,
  conflict_detail TEXT,
  priority_score INTEGER,
  ai_recommendation TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.deadline_intelligence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own deadline intel" ON public.deadline_intelligence FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.organisations WHERE id = deadline_intelligence.org_id AND user_id = auth.uid())
);
CREATE POLICY "Users can manage own deadline intel" ON public.deadline_intelligence FOR ALL USING (
  EXISTS (SELECT 1 FROM public.organisations WHERE id = deadline_intelligence.org_id AND user_id = auth.uid())
);

-- impact_reports
CREATE TABLE public.impact_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  org_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE NOT NULL,
  funder_id UUID REFERENCES public.funders(id),
  report_period_start DATE,
  report_period_end DATE,
  project_updates TEXT,
  generated_report TEXT,
  report_format TEXT DEFAULT 'narrative',
  status TEXT DEFAULT 'draft',
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.impact_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own reports" ON public.impact_reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.organisations WHERE id = impact_reports.org_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert own reports" ON public.impact_reports FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.organisations WHERE id = org_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update own reports" ON public.impact_reports FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.organisations WHERE id = impact_reports.org_id AND user_id = auth.uid())
);

-- ai_usage_log
CREATE TABLE public.ai_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own usage" ON public.ai_usage_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.organisations WHERE id = ai_usage_log.org_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert own usage" ON public.ai_usage_log FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.organisations WHERE id = org_id AND user_id = auth.uid())
);
