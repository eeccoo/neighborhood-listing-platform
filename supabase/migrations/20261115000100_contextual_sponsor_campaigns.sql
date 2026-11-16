-- Contextual sponsor campaign fields.
-- No identity or sensitive traits are used.

alter table public.sponsors
  add column is_approved boolean
    not null default false,
  add column placement text
    not null default 'search-banner',
  add column starts_at timestamptz
    not null default now(),
  add column ends_at timestamptz
    not null default 'infinity',
  add column zip_codes text[]
    not null default array[]::text[],
  add column nearby_zip_codes text[]
    not null default array[]::text[],
  add column priority integer
    not null default 0;

alter table public.sponsors
  add constraint sponsors_placement_allowed
    check (
      placement in (
        'search-banner',
        'property-card'
      )
    ),
  add constraint sponsors_campaign_date_order
    check (starts_at < ends_at),
  add constraint sponsors_priority_range
    check (priority between 0 and 1000);

create index sponsors_campaign_eligibility_idx
  on public.sponsors (
    placement,
    is_approved,
    is_active,
    starts_at,
    ends_at
  );

create index sponsors_zip_codes_gin_idx
  on public.sponsors using gin (zip_codes);

create index sponsors_nearby_zip_codes_gin_idx
  on public.sponsors using gin (
    nearby_zip_codes
  );

drop policy if exists
  "Public can read active sponsors"
  on public.sponsors;

create policy
  "Public can read approved active sponsors"
on public.sponsors
for select
to anon, authenticated
using (
  is_approved = true
  and is_active = true
);