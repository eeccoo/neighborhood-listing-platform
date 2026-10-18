-- Lab 5 initial Supabase schema
-- All records and test data for this project must be fictional.

create extension if not exists pgcrypto;

-- Keep updated_at values current.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================================
-- Profiles
-- =========================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profiles_display_name_length
    check (char_length(trim(display_name)) between 2 and 60)
);

-- Automatically create a profile when a Supabase user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      'New user'
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger create_profile_after_signup
after insert on auth.users
for each row execute function public.handle_new_user();

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- =========================================================
-- Properties
-- =========================================================

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null
    references public.profiles(id) on delete restrict,
  title text not null,
  street_address text not null,
  city text not null,
  state text not null,
  zip_code text not null,
  price numeric(12, 2) not null,
  bedrooms integer not null,
  bathrooms numeric(4, 1) not null,
  square_feet integer not null,
  property_type text not null,
  image_path text not null,
  details_url text not null,
  amenities text[] not null default array[]::text[],
  is_approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint properties_title_length
    check (char_length(trim(title)) between 3 and 140),

  constraint properties_street_address_length
    check (char_length(trim(street_address)) between 5 and 150),

  constraint properties_city_length
    check (char_length(trim(city)) between 2 and 100),

  constraint properties_state_format
    check (state ~ '^[A-Z]{2}$'),

  constraint properties_zip_code_format
    check (zip_code ~ '^[0-9]{5}$'),

  constraint properties_price_range
    check (price >= 0 and price <= 999999999.99),

  constraint properties_bedrooms_range
    check (bedrooms between 0 and 99),

  constraint properties_bathrooms_range
    check (
      bathrooms between 0 and 99
      and bathrooms * 2 = round(bathrooms * 2)
    ),

  constraint properties_square_feet_range
    check (square_feet between 1 and 500000),

  constraint properties_type_allowed
    check (
      property_type in (
        'single-family',
        'condo',
        'townhouse',
        'multi-family',
        'apartment'
      )
    ),

  constraint properties_image_path_format
    check (image_path ~ '^/'),

  constraint properties_details_url_format
    check (details_url ~ '^/'),

  constraint properties_amenities_allowed
    check (
      amenities <@ array[
        'accessible-entry',
        'air-conditioning',
        'laundry',
        'parking',
        'pet-friendly',
        'pool'
      ]::text[]
    )
);

create trigger properties_set_updated_at
before update on public.properties
for each row execute function public.set_updated_at();

create index properties_owner_id_idx
  on public.properties(owner_id);

create index properties_public_listing_idx
  on public.properties(is_approved, created_at desc);

-- =========================================================
-- Sponsors
-- =========================================================

create table public.sponsors (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null
    references public.profiles(id) on delete restrict,
  business_name text not null,
  short_description text not null,
  destination_url text not null,
  category text not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint sponsors_business_name_length
    check (char_length(trim(business_name)) between 2 and 100),

  constraint sponsors_description_length
    check (char_length(trim(short_description)) between 10 and 500),

  constraint sponsors_destination_url_format
    check (destination_url ~ '^https://'),

  constraint sponsors_category_allowed
    check (
      category in (
        'community',
        'finance',
        'food-and-drink',
        'health-and-wellness',
        'home-services'
      )
    )
);

create trigger sponsors_set_updated_at
before update on public.sponsors
for each row execute function public.set_updated_at();

create index sponsors_owner_id_idx
  on public.sponsors(owner_id);

create index sponsors_active_idx
  on public.sponsors(is_active);

-- =========================================================
-- Property sponsors
-- =========================================================

create table public.property_sponsors (
  property_id uuid not null
    references public.properties(id) on delete cascade,
  sponsor_id uuid not null
    references public.sponsors(id) on delete cascade,
  sponsored_label text not null default 'Sponsored',
  display_order integer not null default 0,
  created_at timestamptz not null default now(),

  primary key (property_id, sponsor_id),

  constraint property_sponsors_label_length
    check (char_length(trim(sponsored_label)) between 2 and 40),

  constraint property_sponsors_display_order_range
    check (display_order between 0 and 100)
);

create index property_sponsors_sponsor_id_idx
  on public.property_sponsors(sponsor_id);

-- =========================================================
-- Inquiries
-- =========================================================

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null
    references public.properties(id) on delete restrict,
  user_id uuid not null
    references public.profiles(id) on delete restrict,
  message text not null,
  status text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint inquiries_message_length
    check (char_length(trim(message)) between 10 and 2000),

  constraint inquiries_status_allowed
    check (status in ('new', 'reviewing', 'responded', 'closed'))
);

create trigger inquiries_set_updated_at
before update on public.inquiries
for each row execute function public.set_updated_at();

create index inquiries_user_id_idx
  on public.inquiries(user_id);

create index inquiries_property_id_idx
  on public.inquiries(property_id);

-- =========================================================
-- Enable and force Row-Level Security
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
-- Table privileges
-- =========================================================

revoke all on public.profiles from anon, authenticated;
revoke all on public.properties from anon, authenticated;
revoke all on public.sponsors from anon, authenticated;
revoke all on public.property_sponsors from anon, authenticated;
revoke all on public.inquiries from anon, authenticated;

grant select on public.properties to anon;
grant select on public.sponsors to anon;
grant select on public.property_sponsors to anon;

grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;

grant select, insert, update, delete
  on public.properties to authenticated;

grant select, insert, update, delete
  on public.sponsors to authenticated;

grant select, insert, update, delete
  on public.property_sponsors to authenticated;

grant select, insert, update, delete
  on public.inquiries to authenticated;

-- =========================================================
-- Profile policies
-- =========================================================

create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy "Users can update their own display name"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- =========================================================
-- Property policies
-- =========================================================

create policy "Public can read approved properties"
on public.properties
for select
to anon, authenticated
using (is_approved = true);

create policy "Owners can read their own properties"
on public.properties
for select
to authenticated
using ((select auth.uid()) = owner_id);

create policy "Owners can create unapproved properties"
on public.properties
for insert
to authenticated
with check (
  (select auth.uid()) = owner_id
  and is_approved = false
);

create policy "Owners can update their own unapproved properties"
on public.properties
for update
to authenticated
using (
  (select auth.uid()) = owner_id
  and is_approved = false
)
with check (
  (select auth.uid()) = owner_id
  and is_approved = false
);

create policy "Owners can delete their own unapproved properties"
on public.properties
for delete
to authenticated
using (
  (select auth.uid()) = owner_id
  and is_approved = false
);

-- =========================================================
-- Sponsor policies
-- =========================================================

create policy "Public can read active sponsors"
on public.sponsors
for select
to anon, authenticated
using (is_active = true);

create policy "Owners can read their own sponsors"
on public.sponsors
for select
to authenticated
using ((select auth.uid()) = owner_id);

create policy "Owners can create inactive sponsors"
on public.sponsors
for insert
to authenticated
with check (
  (select auth.uid()) = owner_id
  and is_active = false
);

create policy "Owners can update their own inactive sponsors"
on public.sponsors
for update
to authenticated
using (
  (select auth.uid()) = owner_id
  and is_active = false
)
with check (
  (select auth.uid()) = owner_id
  and is_active = false
);

create policy "Owners can delete their own inactive sponsors"
on public.sponsors
for delete
to authenticated
using (
  (select auth.uid()) = owner_id
  and is_active = false
);

-- =========================================================
-- Property-sponsor policies
-- =========================================================

create policy "Public can read approved active sponsorships"
on public.property_sponsors
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.properties
    where properties.id = property_sponsors.property_id
      and properties.is_approved = true
  )
  and exists (
    select 1
    from public.sponsors
    where sponsors.id = property_sponsors.sponsor_id
      and sponsors.is_active = true
  )
);

create policy "Property owners can manage draft sponsorships"
on public.property_sponsors
for all
to authenticated
using (
  exists (
    select 1
    from public.properties
    where properties.id = property_sponsors.property_id
      and properties.owner_id = (select auth.uid())
      and properties.is_approved = false
  )
)
with check (
  exists (
    select 1
    from public.properties
    where properties.id = property_sponsors.property_id
      and properties.owner_id = (select auth.uid())
      and properties.is_approved = false
  )
);

-- =========================================================
-- Inquiry policies
-- =========================================================

create policy "Users can create their own inquiries"
on public.inquiries
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can read their own inquiries"
on public.inquiries
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Property owners can read listing inquiries"
on public.inquiries
for select
to authenticated
using (
  exists (
    select 1
    from public.properties
    where properties.id = inquiries.property_id
      and properties.owner_id = (select auth.uid())
  )
);

create policy "Inquiry authors can delete their own inquiries"
on public.inquiries
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "Property owners can update inquiry status"
on public.inquiries
for update
to authenticated
using (
  exists (
    select 1
    from public.properties
    where properties.id = inquiries.property_id
      and properties.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.properties
    where properties.id = inquiries.property_id
      and properties.owner_id = (select auth.uid())
  )
);