-- Record image provenance and administrative approval.
-- All three assets are original synthetic project artwork.
-- They do not depict or claim endorsement by real properties
-- or local businesses.

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  asset_key text not null unique,
  category text not null,
  source_path text not null unique,
  permission_source text not null,
  permission_proof text not null,
  status text not null default 'PENDING',
  approved_at timestamptz,
  created_at timestamptz not null default now(),

  constraint media_assets_key_length
    check (char_length(trim(asset_key)) between 3 and 80),

  constraint media_assets_category_allowed
    check (
      category in (
        'PROPERTY_PHOTO',
        'SPONSOR_BANNER',
        'UI_GRAPHIC'
      )
    ),

  constraint media_assets_local_svg_path
    check (
      source_path ~ '^/[a-z0-9][a-z0-9-]*\.svg$'
    ),

  constraint media_assets_permission_source_length
    check (
      char_length(trim(permission_source)) between 3 and 200
    ),

  constraint media_assets_permission_proof_length
    check (
      char_length(trim(permission_proof)) between 10 and 500
    ),

  constraint media_assets_status_allowed
    check (
      status in ('PENDING', 'ACTIVE', 'REJECTED')
    ),

  constraint media_assets_active_requires_approval_time
    check (
      status <> 'ACTIVE' or approved_at is not null
    )
);

alter table public.media_assets
enable row level security;

alter table public.media_assets
force row level security;

revoke all on public.media_assets
from public, anon, authenticated;

grant select on public.media_assets
to anon, authenticated;

create policy "Public can read active media assets"
on public.media_assets
for select
to anon, authenticated
using (status = 'ACTIVE');

insert into public.media_assets (
  asset_key,
  category,
  source_path,
  permission_source,
  permission_proof,
  status,
  approved_at
)
values
  (
    'primary-property-illustration',
    'PROPERTY_PHOTO',
    '/property-home.svg',
    'Giovanni Clara, student developer and original asset creator',
    'Repository commit 4f60611 records the original property illustration and its project use.',
    'ACTIVE',
    now()
  ),
  (
    'local-partner-banner',
    'SPONSOR_BANNER',
    '/sponsor-partner-banner.svg',
    'Giovanni Clara, student developer and original asset creator',
    'Original synthetic sponsor artwork created for this project; no third-party logo, photo, or business identity is used.',
    'ACTIVE',
    now()
  ),
  (
    'neighborhood-interface-mark',
    'UI_GRAPHIC',
    '/neighborhood-mark.svg',
    'Giovanni Clara, student developer and original asset creator',
    'Original synthetic interface artwork created for this project; no third-party logo or trademark is used.',
    'ACTIVE',
    now()
  );

create index media_assets_active_category_idx
on public.media_assets (status, category);