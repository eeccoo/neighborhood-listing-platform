-- Add administrative approval state to sponsors.

alter table public.sponsors
add column status text not null default 'PENDING';

alter table public.sponsors
add constraint sponsors_status_allowed
check (status in ('PENDING', 'APPROVED', 'REJECTED'));

-- Preserve the meaning of existing fictional seed records.
update public.sponsors
set status = case
  when is_active = true then 'APPROVED'
  else 'PENDING'
end;

-- Add campaign eligibility and deterministic-ranking data
-- to the property-to-sponsor relationship.

alter table public.property_sponsors
add column tier text not null default 'SILVER',
add column distance_miles numeric(6,2) not null default 0,
add column impressions bigint not null default 0,
add column start_date date,
add column end_date date,
add column target_zip_codes text[] not null default '{}';

-- Give existing relationships a valid fictional campaign period
-- and derive their initial ZIP scope from the related property.

update public.property_sponsors as ps
set
  start_date = current_date - 30,
  end_date = current_date + 365,
  target_zip_codes = array[p.zip_code]
from public.properties as p
where p.id = ps.property_id;

alter table public.property_sponsors
alter column start_date set not null,
alter column end_date set not null;

alter table public.property_sponsors
add constraint property_sponsors_tier_allowed
check (tier in ('SILVER', 'GOLD', 'PLATINUM'));

alter table public.property_sponsors
add constraint property_sponsors_distance_nonnegative
check (distance_miles >= 0);

alter table public.property_sponsors
add constraint property_sponsors_impressions_nonnegative
check (impressions >= 0);

alter table public.property_sponsors
add constraint property_sponsors_date_order
check (end_date >= start_date);

alter table public.property_sponsors
add constraint property_sponsors_zip_scope_not_empty
check (cardinality(target_zip_codes) > 0);

alter table public.property_sponsors
add constraint property_sponsors_zip_format
check (
  array_to_string(target_zip_codes, ',')
  ~ '^[0-9]{5}(,[0-9]{5})*$'
);

create index property_sponsors_eligibility_idx
on public.property_sponsors (
  property_id,
  tier,
  distance_miles,
  impressions
);

create index property_sponsors_zip_scope_idx
on public.property_sponsors
using gin (target_zip_codes);

create index sponsors_selection_status_idx
on public.sponsors (status, is_active);

-- Public sponsor visibility now requires both approval and active status.

drop policy if exists "Public can read active sponsors"
on public.sponsors;

create policy "Public can read approved active sponsors"
on public.sponsors
for select
to anon, authenticated
using (
  status = 'APPROVED'
  and is_active = true
);

-- Select exactly one eligible sponsor for a property.
--
-- Eligibility:
--   1. Administrative status is APPROVED.
--   2. Sponsor is operationally active.
--   3. CURRENT_DATE falls within the campaign dates.
--   4. The property's ZIP appears in the campaign ZIP scope.
--
-- Deterministic ranking:
--   1. Highest tier.
--   2. Shortest distance.
--   3. Fewest impressions.
--   4. Lowest sponsor UUID as the final stable tie-breaker.

create or replace function public.select_sponsor_for_property(
  requested_property_id uuid
)
returns table (
  id uuid,
  business_name text,
  short_description text,
  destination_url text,
  sponsored_label text,
  tier text,
  distance_miles numeric,
  impressions bigint
)
language sql
stable
security invoker
set search_path = ''
as $function$
  select
    s.id,
    s.business_name,
    s.short_description,
    s.destination_url,
    ps.sponsored_label,
    ps.tier,
    ps.distance_miles,
    ps.impressions
  from public.properties as p
  join public.property_sponsors as ps
    on ps.property_id = p.id
  join public.sponsors as s
    on s.id = ps.sponsor_id
  where p.id = requested_property_id
    and s.status = 'APPROVED'
    and s.is_active = true
    and current_date between ps.start_date and ps.end_date
    and p.zip_code = any(ps.target_zip_codes)
  order by
    case ps.tier
      when 'PLATINUM' then 3
      when 'GOLD' then 2
      when 'SILVER' then 1
      else 0
    end desc,
    ps.distance_miles asc,
    ps.impressions asc,
    s.id asc
  limit 1;
$function$;

revoke all on function public.select_sponsor_for_property(uuid)
from public;

grant execute on function public.select_sponsor_for_property(uuid)
to anon, authenticated, service_role;