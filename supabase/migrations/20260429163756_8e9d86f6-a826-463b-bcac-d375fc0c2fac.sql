CREATE TABLE public.support_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  name text,
  message text NOT NULL,
  conversation jsonb,
  page_url text,
  status text NOT NULL DEFAULT 'new',
  user_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;

-- Anyone (incl. unauthenticated visitors on the landing page) can submit a support request
CREATE POLICY "Anyone can submit support requests"
ON public.support_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Users can view their own requests (matched by user_id when logged in)
CREATE POLICY "Users can view own support requests"
ON public.support_requests
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE TRIGGER update_support_requests_updated_at
BEFORE UPDATE ON public.support_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_support_requests_status ON public.support_requests(status, created_at DESC);