-- 1. Trigger: auto-advance funder relationship when an interaction is logged
CREATE OR REPLACE FUNCTION public.sync_funder_pipeline_on_interaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rel_id uuid := NEW.relationship_id;
BEGIN
  -- Only sync for outreach-type interactions
  IF NEW.interaction_type NOT IN ('email','email_sent','email_received','call','meeting','letter','contact') THEN
    RETURN NEW;
  END IF;

  IF rel_id IS NULL THEN
    -- Find existing relationship for this funder+org
    SELECT id INTO rel_id
      FROM public.funder_relationships
     WHERE org_id = NEW.org_id AND funder_id = NEW.funder_id
     LIMIT 1;
  END IF;

  IF rel_id IS NULL THEN
    -- Create a new relationship in 'contacted' state
    INSERT INTO public.funder_relationships (org_id, funder_id, relationship_status, health_score, last_interaction_date)
    VALUES (NEW.org_id, NEW.funder_id, 'contacted', 55, NEW.date);
  ELSE
    -- Advance only forward from prospect; always update last_interaction_date
    UPDATE public.funder_relationships
       SET relationship_status = CASE WHEN relationship_status = 'prospect' THEN 'contacted' ELSE relationship_status END,
           last_interaction_date = GREATEST(COALESCE(last_interaction_date, '1900-01-01'::date), NEW.date),
           updated_at = now()
     WHERE id = rel_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_funder_pipeline ON public.funder_interactions;
CREATE TRIGGER trg_sync_funder_pipeline
AFTER INSERT ON public.funder_interactions
FOR EACH ROW EXECUTE FUNCTION public.sync_funder_pipeline_on_interaction();

-- 2. Editable email templates per org
CREATE TABLE public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  name text NOT NULL,
  purpose text,
  subject text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_templates TO authenticated;
GRANT ALL ON public.email_templates TO service_role;

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view email templates"
  ON public.email_templates FOR SELECT
  USING (is_org_member(org_id, auth.uid()));

CREATE POLICY "Editors can insert email templates"
  ON public.email_templates FOR INSERT
  WITH CHECK (has_org_role(org_id, auth.uid(), 'editor'));

CREATE POLICY "Editors can update email templates"
  ON public.email_templates FOR UPDATE
  USING (has_org_role(org_id, auth.uid(), 'editor'));

CREATE POLICY "Editors can delete email templates"
  ON public.email_templates FOR DELETE
  USING (has_org_role(org_id, auth.uid(), 'editor'));

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_email_templates_org ON public.email_templates(org_id, sort_order);