-- Fictional development seed data.
-- Requires owner-test@example.com and other-test@example.com
-- to exist in Supabase Authentication.

do $seed$
declare
  owner_user_id uuid;
  other_user_id uuid;
begin
  select id into owner_user_id
  from auth.users
  where email = 'owner-test@example.com';

  select id into other_user_id
  from auth.users
  where email = 'other-test@example.com';

  if owner_user_id is null then
    raise exception 'Missing fictional user: owner-test@example.com';
  end if;

  if other_user_id is null then
    raise exception 'Missing fictional user: other-test@example.com';
  end if;

  insert into public.profiles (id, display_name)
  values
    (owner_user_id, 'Fictional Property Owner'),
    (other_user_id, 'Fictional Other User')
  on conflict (id) do update
  set display_name = excluded.display_name;

  insert into public.properties (
    id,
    owner_id,
    title,
    street_address,
    city,
    state,
    zip_code,
    price,
    bedrooms,
    bathrooms,
    square_feet,
    property_type,
    image_path,
    details_url,
    amenities,
    is_approved
  )
  values
    (
      '11111111-1111-4111-8111-111111111111',
      owner_user_id,
      'Pinecrest Modern Villa',
      '742 Fictional Pine Street',
      'Springfield',
      'OR',
      '97477',
      425000,
      3,
      2.5,
      1850,
      'single-family',
      '/property-home.svg',
      '/properties/11111111-1111-4111-8111-111111111111',
      array['air-conditioning', 'parking', 'pet-friendly', 'laundry'],
      true
    ),
    (
      '22222222-2222-4222-8222-222222222222',
      owner_user_id,
      'Owner Draft Townhouse',
      '518 Fictional Maple Lane',
      'Austin',
      'TX',
      '78704',
      540000,
      3,
      3.0,
      1750,
      'townhouse',
      '/property-home.svg',
      '/properties/22222222-2222-4222-8222-222222222222',
      array['parking', 'pet-friendly', 'laundry'],
      false
    ),
    (
      '33333333-3333-4333-8333-333333333333',
      other_user_id,
      'Other User Draft Condo',
      '1200 Fictional Harbor Way',
      'Seattle',
      'WA',
      '98101',
      890000,
      2,
      2.0,
      1420,
      'condo',
      '/property-home.svg',
      '/properties/33333333-3333-4333-8333-333333333333',
      array['accessible-entry', 'pool', 'parking'],
      false
    )
  on conflict (id) do update
  set
    owner_id = excluded.owner_id,
    title = excluded.title,
    street_address = excluded.street_address,
    city = excluded.city,
    state = excluded.state,
    zip_code = excluded.zip_code,
    price = excluded.price,
    bedrooms = excluded.bedrooms,
    bathrooms = excluded.bathrooms,
    square_feet = excluded.square_feet,
    property_type = excluded.property_type,
    image_path = excluded.image_path,
    details_url = excluded.details_url,
    amenities = excluded.amenities,
    is_approved = excluded.is_approved;

  insert into public.sponsors (
    id,
    owner_id,
    business_name,
    short_description,
    destination_url,
    category,
    is_active
  )
  values
    (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      owner_user_id,
      'Fictional Cascade Home Inspection',
      'Synthetic home inspection sponsor used only for development testing.',
      'https://example.com/fictional-cascade-inspection',
      'home-services',
      true
    ),
    (
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      owner_user_id,
      'Fictional Neighborhood Cafe',
      'Synthetic local cafe sponsor awaiting content approval.',
      'https://example.com/fictional-neighborhood-cafe',
      'food-and-drink',
      false
    )
  on conflict (id) do update
  set
    owner_id = excluded.owner_id,
    business_name = excluded.business_name,
    short_description = excluded.short_description,
    destination_url = excluded.destination_url,
    category = excluded.category,
    is_active = excluded.is_active;

  insert into public.property_sponsors (
    property_id,
    sponsor_id,
    sponsored_label,
    display_order
  )
  values (
    '11111111-1111-4111-8111-111111111111',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Sponsored',
    1
  )
  on conflict (property_id, sponsor_id) do update
  set
    sponsored_label = excluded.sponsored_label,
    display_order = excluded.display_order;

  insert into public.inquiries (
    id,
    property_id,
    user_id,
    message,
    status
  )
  values (
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    '11111111-1111-4111-8111-111111111111',
    other_user_id,
    'This is a fictional inquiry used only for access-control testing.',
    'new'
  )
  on conflict (id) do update
  set
    property_id = excluded.property_id,
    user_id = excluded.user_id,
    message = excluded.message,
    status = excluded.status;
end;
$seed$;