CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.assign_inbound_mailbox_token()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NEW.inbound_mailbox_token IS NULL THEN
    NEW.inbound_mailbox_token := lower(
      regexp_replace(coalesce(substring(NEW.name from 1 for 12), 'org'), '[^a-zA-Z0-9]+', '-', 'g')
    ) || '-' || substring(encode(extensions.gen_random_bytes(3), 'hex') from 1 for 4);
  END IF;
  RETURN NEW;
END;
$$;