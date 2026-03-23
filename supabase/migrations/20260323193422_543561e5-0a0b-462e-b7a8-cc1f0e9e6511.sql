ALTER TABLE applications ADD COLUMN IF NOT EXISTS application_route text;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS format text DEFAULT 'full_proposal';
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS form_prep_content jsonb;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS ai_funder_tip text;