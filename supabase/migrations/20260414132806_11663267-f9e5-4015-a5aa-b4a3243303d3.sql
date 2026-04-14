
-- CRM emails table for tracking email communications with funders
CREATE TABLE public.crm_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  funder_id uuid NOT NULL REFERENCES public.funders(id) ON DELETE CASCADE,
  relationship_id uuid REFERENCES public.funder_relationships(id) ON DELETE SET NULL,
  recipient_email text,
  subject text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  sent_at timestamptz,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.crm_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own crm emails"
  ON public.crm_emails FOR ALL
  USING (EXISTS (
    SELECT 1 FROM organisations WHERE organisations.id = crm_emails.org_id AND organisations.user_id = auth.uid()
  ));

-- Activity notes table for internal team notes on funder relationships
CREATE TABLE public.crm_activity_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  funder_id uuid NOT NULL REFERENCES public.funders(id) ON DELETE CASCADE,
  author_id uuid,
  author_name text,
  content text NOT NULL,
  note_type text NOT NULL DEFAULT 'note',
  is_pinned boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.crm_activity_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own crm activity notes"
  ON public.crm_activity_notes FOR ALL
  USING (EXISTS (
    SELECT 1 FROM organisations WHERE organisations.id = crm_activity_notes.org_id AND organisations.user_id = auth.uid()
  ));

ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_emails;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_activity_notes;
