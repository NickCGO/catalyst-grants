-- funder_contacts
create table if not exists public.funder_contacts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organisations(id) on delete cascade not null,
  funder_id uuid references public.funders(id) on delete cascade not null,
  relationship_id uuid references public.funder_relationships(id) on delete set null,
  name text,
  role text,
  email text,
  alt_emails text[] default '{}',
  phone text,
  is_primary boolean default false,
  source text default 'manual',
  notes text,
  tags text[] default '{}',
  created_by uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

grant select, insert, update, delete on public.funder_contacts to authenticated;
grant all on public.funder_contacts to service_role;

create index if not exists funder_contacts_org_funder_idx on public.funder_contacts(org_id, funder_id);
create index if not exists funder_contacts_email_idx on public.funder_contacts(lower(email));
create index if not exists funder_contacts_alt_emails_idx on public.funder_contacts using gin(alt_emails);

alter table public.funder_contacts enable row level security;
create policy "Team manages funder contacts"
  on public.funder_contacts for all to authenticated
  using (public.is_org_member(org_id, auth.uid()))
  with check (public.is_org_member(org_id, auth.uid()));

create policy "Team views funder relationships"
  on public.funder_relationships for select to authenticated
  using (public.is_org_member(org_id, auth.uid()));
create policy "Team writes funder relationships"
  on public.funder_relationships for all to authenticated
  using (public.is_org_member(org_id, auth.uid()))
  with check (public.is_org_member(org_id, auth.uid()));

create policy "Team views funder interactions"
  on public.funder_interactions for select to authenticated
  using (public.is_org_member(org_id, auth.uid()));
create policy "Team writes funder interactions"
  on public.funder_interactions for all to authenticated
  using (public.is_org_member(org_id, auth.uid()))
  with check (public.is_org_member(org_id, auth.uid()));

create policy "Team views crm emails"
  on public.crm_emails for select to authenticated
  using (public.is_org_member(org_id, auth.uid()));
create policy "Team writes crm emails"
  on public.crm_emails for all to authenticated
  using (public.is_org_member(org_id, auth.uid()))
  with check (public.is_org_member(org_id, auth.uid()));

alter table public.inbound_emails add column if not exists match_method text;
create index if not exists inbound_emails_unassigned_idx on public.inbound_emails(org_id) where funder_id is null;
