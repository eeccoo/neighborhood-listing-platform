-- Practical examination schema upgrade.
-- Prerequisites: the two existing October 18 migrations.
-- Apply the complete migration chain to reproduce the database.
-- Legacy columns remain available while application code is upgraded.

begin;

-- =========================================================
-- 1. Profiles: controlled roles
-- =========================================================

alter table public.profiles
  add column role text not null default 'public'
  constraint profiles_role_allowed
  check (role in ('admin', 'property_owner', 'sponsor', 'public'));

-- Preserve existing administrator and ownership classifications.
-- This migration runs with trusted database privileges.
update public.profiles as p
set role = case
  when p.is_admin then 'admin'
  when exists (
    select 1 from public.properties as property
    where property.owner_id = p.id
  ) then 'property_owner'
  when exists (
    select 1 from public.sponsors as sponsor
    where sponsor.owner_id = p.id
  ) then 'sponsor'
  else 'public'
end;

-- Ordinary users must not be able to grant themselves roles.
-- Existing UPDATE(display_name) access remains unchanged.
revoke update (role, is_admin)
  on public.profiles from anon, authenticated;

-- =========================================================
-- 2. Properties: examination address and approval lifecycle
-- =========================================================

alter table public.properties
  add column address text,
  add column status text not null default 'draft'
    constraint properties_status_allowed
    check (status in ('draft', 'pending', 'approved', 'rejected'));

update public.properties
set
  address = concat_ws(', ', street_address, city, state, zip_code),
  status = case when is_approved then 'approved' else 'draft' end;

alter table public.properties
  alter column address set not null,
  add constraint properties_address_min_length
    check (char_length(address) >= 5);

-- The exam POST contract does not supply these legacy fields.
-- Preserve their existing values, but allow new exam records
-- to omit them. Existing CHECK constraints permit NULL values.
alter table public.properties
  alter column title drop not null,
  alter column street_address drop not null,
  alter column city drop not null,
  alter column state drop not null,
  alter column zip_code drop not null,
  alter column property_type drop not null,
  alter column image_path drop not null,
  alter column details_url drop not null;

-- Replace older lab limits with the examination constraints.
alter table public.properties
  drop constraint properties_price_range,
  drop constraint properties_bedrooms_range,
  drop constraint properties_bathrooms_range,
  drop constraint properties_square_feet_range;

alter table public.properties
  alter column bathrooms type numeric(3, 1),
  add constraint properties_exam_price_check check (price >= 0),
  add constraint properties_exam_bedrooms_check check (bedrooms >= 0),
  add constraint properties_exam_bathrooms_check check (bathrooms >= 0),
  add constraint properties_exam_square_feet_check check (square_feet > 0);

create index properties_exam_status_idx
  on public.properties(status, created_at desc);

-- =========================================================
-- 3. Sponsors: public name, tier, and activation
-- =========================================================

alter table public.sponsors
  add column name text,
  add column tier text not null default 'bronze'
    constraint sponsors_tier_allowed
    check (tier in ('gold', 'silver', 'bronze')),
  add column active_status boolean not null default true;

-- Existing sponsors have no tier information.
-- Bronze is an initial classification, not a verified paid tier.
update public.sponsors
set
  name = business_name,
  active_status = is_active;

alter table public.sponsors
  alter column name set not null,
  add constraint sponsors_exam_name_length
    check (char_length(name) >= 2),
  alter column owner_id drop not null,
  alter column business_name drop not null,
  alter column short_description drop not null,
  alter column destination_url drop not null,
  alter column category drop not null;

create index sponsors_exam_active_idx
  on public.sponsors(active_status);

-- =========================================================
-- 4. Inquiries: anonymous submissions and cascading deletion
-- =========================================================

alter table public.inquiries
  add column inquirer_email text;

-- Legacy inquiries never collected an email address.
-- Use clearly synthetic placeholders rather than inventing
-- actual contact details. New inquiries must provide an email.
update public.inquiries
set inquirer_email = 'legacy-' || id::text || '@example.invalid';

alter table public.inquiries
  alter column inquirer_email set not null,
  alter column user_id drop not null,
  add constraint inquiries_exam_email_format
    check (
      inquirer_email ~*
      '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    ),
  drop constraint inquiries_message_length,
  add constraint inquiries_exam_message_length
    check (char_length(message) >= 10),
  drop constraint inquiries_property_id_fkey,
  add constraint inquiries_property_id_fkey
    foreign key (property_id)
    references public.properties(id)
    on delete cascade;

-- =========================================================
-- 5. Explicit examination timestamp defaults
-- =========================================================

alter table public.profiles
  alter column created_at set default timezone('utc'::text, now());

alter table public.sponsors
  alter column created_at set default timezone('utc'::text, now());

alter table public.properties
  alter column created_at set default timezone('utc'::text, now());

alter table public.inquiries
  alter column created_at set default timezone('utc'::text, now());

-- The existing migration already defines:
-- * All five primary keys, including the junction composite key.
-- * Profiles -> auth.users with ON DELETE CASCADE.
-- * Properties -> profiles with ON DELETE RESTRICT.
-- * Both junction foreign keys with ON DELETE CASCADE.
-- * Required UUID defaults and NOT NULL numeric fields.

-- =========================================================
-- 6. Replace legacy policies and permissions
-- =========================================================

-- Old permissive policies must be removed so they cannot
-- continue granting access forbidden by the examination.
do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'profiles',
        'properties',
        'sponsors',
        'property_sponsors',
        'inquiries'
      )
  loop
    execute format(
      'drop policy %I on %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  end loop;
end;
$$;

-- Reset table privileges, including any PUBLIC grants.
revoke all privileges on table
  public.profiles,
  public.properties,
  public.sponsors,
  public.property_sponsors,
  public.inquiries
from public, anon, authenticated;

-- Column-level grants survive table-level revocation.
-- Remove the known column grants from the earlier migrations.
revoke update (display_name, is_admin, role)
  on public.profiles from public, anon, authenticated;

revoke update (status)
  on public.inquiries from public, anon, authenticated;

grant usage on schema public to anon, authenticated, service_role;

-- =========================================================
-- 7. Explicitly enable RLS on all five tables
-- =========================================================

alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.sponsors enable row level security;
alter table public.property_sponsors enable row level security;
alter table public.inquiries enable row level security;

alter table public.profiles force row level security;
alter table public.properties force row level security;
alter table public.sponsors force row level security;
alter table public.property_sponsors force row level security;
alter table public.inquiries force row level security;

-- =========================================================
-- 8. Profiles: self-read and display-name changes only
-- =========================================================

grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;

create policy exam_profiles_self_read
on public.profiles
for select
to authenticated
using (id = (select auth.uid()));

create policy exam_profiles_self_update
on public.profiles
for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

-- No ordinary-user INSERT, DELETE, or role/is_admin UPDATE
-- privileges are granted.

-- =========================================================
-- 9. Properties: public approved reads and owner scope
-- =========================================================

grant select on public.properties to anon, authenticated;

-- Limit owner writes to examination fields.
grant insert (
  owner_id,
  address,
  price,
  bedrooms,
  bathrooms,
  square_feet,
  status
) on public.properties to authenticated;

grant update (
  address,
  price,
  bedrooms,
  bathrooms,
  square_feet,
  status
) on public.properties to authenticated;

grant delete on public.properties to authenticated;

create policy exam_properties_public_read
on public.properties
for select
to anon, authenticated
using (status = 'approved');

create policy exam_properties_owner_read
on public.properties
for select
to authenticated
using (owner_id = (select auth.uid()));

create policy exam_properties_owner_insert
on public.properties
for insert
to authenticated
with check (
  owner_id = (select auth.uid())
  and status = 'draft'
  and exists (
    select 1
    from public.profiles as profile
    where profile.id = (select auth.uid())
      and profile.role = 'property_owner'
  )
);

create policy exam_properties_owner_update
on public.properties
for update
to authenticated
using (
  owner_id = (select auth.uid())
  and status in ('draft', 'rejected')
)
with check (
  owner_id = (select auth.uid())
  and status in ('draft', 'rejected')
);

create policy exam_properties_owner_delete
on public.properties
for delete
to authenticated
using (owner_id = (select auth.uid()));

-- =========================================================
-- 10. Sponsors: active public reads
-- =========================================================

grant select on public.sponsors to anon, authenticated;

create policy exam_sponsors_public_read
on public.sponsors
for select
to anon, authenticated
using (active_status = true);

-- Sponsor creation and changes use trusted administration.

-- =========================================================
-- 11. Junction: approved properties and active sponsors
-- =========================================================

grant select on public.property_sponsors to anon, authenticated;

create policy exam_property_sponsors_public_read
on public.property_sponsors
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.properties as property
    where property.id = property_sponsors.property_id
      and property.status = 'approved'
  )
  and exists (
    select 1
    from public.sponsors as sponsor
    where sponsor.id = property_sponsors.sponsor_id
      and sponsor.active_status = true
  )
);

-- Linking sponsors to properties uses trusted administration.

-- =========================================================
-- 12. Inquiries: public insertion, owner-only ordinary reads
-- =========================================================

grant insert (
  property_id,
  inquirer_email,
  message
) on public.inquiries to anon, authenticated;

-- SELECT permission allows RLS to filter the result.
-- Anonymous users receive no rows because no anonymous
-- SELECT policy is defined.
grant select on public.inquiries to anon, authenticated;

create policy exam_inquiries_public_insert
on public.inquiries
for insert
to anon, authenticated
with check (true);

create policy exam_inquiries_owner_read
on public.inquiries
for select
to authenticated
using (
  exists (
    select 1
    from public.properties as property
    where property.id = inquiries.property_id
      and property.owner_id = (select auth.uid())
  )
);

-- There is deliberately no author-read policy.
-- Ordinary users receive no inquiry UPDATE or DELETE grants.

-- =========================================================
-- 13. Trusted administrative execution
-- =========================================================

-- Supabase's service_role bypasses RLS.
-- These grants provide CRUD privileges on every subsystem table.
-- Service credentials must remain in trusted server contexts.
grant all privileges on table
  public.profiles,
  public.properties,
  public.sponsors,
  public.property_sponsors,
  public.inquiries
to service_role;

commit;