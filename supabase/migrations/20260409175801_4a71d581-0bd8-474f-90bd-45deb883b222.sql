
CREATE TABLE public.waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  name text,
  organisation text,
  country text,
  role text,
  committed_to_pay boolean DEFAULT false,
  referral_source text,
  position integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public signup form)
CREATE POLICY "Anyone can join waitlist"
ON public.waitlist
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Users can view their own waitlist entry by email
CREATE POLICY "Users can view own waitlist entry"
ON public.waitlist
FOR SELECT
TO anon, authenticated
USING (true);
