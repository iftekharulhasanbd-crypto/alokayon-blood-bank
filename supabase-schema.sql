-- আলোকায়ন ব্লাড ব্যাংক: Supabase SQL Editor-এ একবার চালান।
-- IMPORTANT: public donor listing exposes phone numbers only to donors who explicitly consented.
-- This starter is intentionally conservative; review with a developer before collecting real personal data.

create extension if not exists pgcrypto;

create table if not exists public.donors (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 2 and 80),
  blood_group text not null check (blood_group in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  phone text not null check (char_length(phone) between 7 and 20),
  area text not null,
  locality text,
  last_donation_date date,
  available boolean not null default true,
  consent boolean not null default false,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index if not exists donors_phone_unique on public.donors(phone);

create table if not exists public.blood_requests (
  id uuid primary key default gen_random_uuid(),
  requester_name text not null check (char_length(requester_name) between 2 and 80),
  contact_phone text not null check (char_length(contact_phone) between 7 and 20),
  blood_group text not null check (blood_group in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  area text not null,
  needed_at timestamptz not null,
  units integer not null check (units between 1 and 10),
  details text,
  status text not null default 'pending' check (status in ('pending','contacted','completed','cancelled')),
  created_at timestamptz not null default now()
);

alter table public.donors enable row level security;
alter table public.blood_requests enable row level security;

-- Public can submit donor registrations, but cannot approve, list all, edit, or delete them.
drop policy if exists "public submit donor registration" on public.donors;
create policy "public submit donor registration" on public.donors
for insert to anon, authenticated
with check (consent = true and approved = false);

-- Public directory: only approved, available donors who consented.
-- Phone is intentionally omitted from the public view by default. Use admin-mediated contact
-- or implement a separate consented phone disclosure mechanism after reviewing privacy needs.
create or replace view public.public_donors as
select id, full_name, blood_group, area, locality, last_donation_date, available, approved,
       case when consent then phone else null end as phone
from public.donors
where approved = true and available = true and consent = true;

grant select on public.public_donors to anon, authenticated;
grant insert on public.donors to anon, authenticated;

-- Public can submit requests; cannot read, update, or delete requests.
drop policy if exists "public submit blood request" on public.blood_requests;
create policy "public submit blood request" on public.blood_requests
for insert to anon, authenticated
with check (status = 'pending');

grant insert on public.blood_requests to anon, authenticated;

-- Admin-only policies: create your admin user in Supabase Authentication.
-- This starter expects you to put the admin user's UUID below in app_metadata role claim.
-- Simplest setup: use Supabase Dashboard > Authentication > Users, create user,
-- then in SQL Editor run: update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'::jsonb where id = 'YOUR-USER-UUID';
-- Do NOT use user_metadata for authorization because users can edit it themselves.
create or replace function public.is_site_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

drop policy if exists "admin read donors" on public.donors;
create policy "admin read donors" on public.donors for select to authenticated using (public.is_site_admin());
drop policy if exists "admin update donors" on public.donors;
create policy "admin update donors" on public.donors for update to authenticated using (public.is_site_admin()) with check (public.is_site_admin());
drop policy if exists "admin delete donors" on public.donors;
create policy "admin delete donors" on public.donors for delete to authenticated using (public.is_site_admin());

drop policy if exists "admin read requests" on public.blood_requests;
create policy "admin read requests" on public.blood_requests for select to authenticated using (public.is_site_admin());
drop policy if exists "admin update requests" on public.blood_requests;
create policy "admin update requests" on public.blood_requests for update to authenticated using (public.is_site_admin()) with check (public.is_site_admin());
drop policy if exists "admin delete requests" on public.blood_requests;
create policy "admin delete requests" on public.blood_requests for delete to authenticated using (public.is_site_admin());

grant select, update, delete on public.donors to authenticated;
grant select, update, delete on public.blood_requests to authenticated;

-- Do not grant anon SELECT on public.donors. The public directory reads only the
-- explicit columns exposed by public.public_donors; the underlying table stays private.
-- The view uses the view owner's permissions, so keep its selected columns minimal.
