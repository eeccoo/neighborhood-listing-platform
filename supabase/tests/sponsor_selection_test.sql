begin;

do $test$
declare
  test_owner_id uuid;
  selected_sponsor_id uuid;
  fallback_count integer;
begin
  select id
  into test_owner_id
  from public.profiles
  order by created_at
  limit 1;

  if test_owner_id is null then
    raise exception
      'Sponsor test requires at least one fictional profile.';
  end if;

  insert into public.properties (
    id,
    owner_id,
    address,
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
    is_approved,
    status
  )
  values (
    '90032000-0000-4000-8000-000000000001',
    test_owner_id,
    '100 Fictional Sponsor Test Way, Los Angeles, CA 90032',
    'Fictional 90032 Selection Property',
    '100 Fictional Sponsor Test Way',
    'Los Angeles',
    'CA',
    '90032',
    500000,
    3,
    2,
    1400,
    'single-family',
    '/property-home.svg',
    '/properties/sponsor-selection-test',
    array['parking'],
    true,
    'approved'
  );

  insert into public.properties (
    id,
    owner_id,
    address,
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
    is_approved,
    status
  )
  values (
    '90032000-0000-4000-8000-000000000002',
    test_owner_id,
    '200 Fictional Fallback Way, Los Angeles, CA 90032',
    'Fictional Fallback Property',
    '200 Fictional Fallback Way',
    'Los Angeles',
    'CA',
    '90032',
    450000,
    2,
    1,
    900,
    'condo',
    '/property-home.svg',
    '/properties/sponsor-fallback-test',
    array['parking'],
    true,
    'approved'
  );

  insert into public.sponsors (
    id,
    owner_id,
    business_name,
    name,
    short_description,
    destination_url,
    category,
    is_active,
    status
  )
  values
    (
      'aaaaaaaa-0000-4000-8000-000000000001',
      test_owner_id,
      'Sponsor A',
      'Sponsor A',
      'Fictional Silver sponsor for selection testing.',
      'https://sponsor-a.example/offers',
      'home-services',
      true,
      'APPROVED'
    ),
    (
      'bbbbbbbb-0000-4000-8000-000000000002',
      test_owner_id,
      'Sponsor B',
      'Sponsor B',
      'Fictional Gold sponsor for selection testing.',
      'https://sponsor-b.example/offers',
      'finance',
      true,
      'APPROVED'
    ),
    (
      'cccccccc-0000-4000-8000-000000000003',
      test_owner_id,
      'Sponsor C',
      'Sponsor C',
      'Fictional Gold sponsor for selection testing.',
      'https://sponsor-c.example/offers',
      'community',
      true,
      'APPROVED'
    ),
    (
      'dddddddd-0000-4000-8000-000000000004',
      test_owner_id,
      'Sponsor D',
      'Sponsor D',
      'Fictional pending Platinum sponsor for testing.',
      'https://sponsor-d.example/offers',
      'food-and-drink',
      true,
      'PENDING'
    );

  insert into public.property_sponsors (
    property_id,
    sponsor_id,
    sponsored_label,
    tier,
    distance_miles,
    impressions,
    start_date,
    end_date,
    target_zip_codes
  )
  values
    (
      '90032000-0000-4000-8000-000000000001',
      'aaaaaaaa-0000-4000-8000-000000000001',
      'Sponsored Partner',
      'SILVER',
      0.4,
      120,
      current_date - 1,
      current_date + 1,
      array['90032']
    ),
    (
      '90032000-0000-4000-8000-000000000001',
      'bbbbbbbb-0000-4000-8000-000000000002',
      'Sponsored Partner',
      'GOLD',
      1.2,
      45,
      current_date - 1,
      current_date + 1,
      array['90032']
    ),
    (
      '90032000-0000-4000-8000-000000000001',
      'cccccccc-0000-4000-8000-000000000003',
      'Sponsored Partner',
      'GOLD',
      0.8,
      90,
      current_date - 1,
      current_date + 1,
      array['90032']
    ),
    (
      '90032000-0000-4000-8000-000000000001',
      'dddddddd-0000-4000-8000-000000000004',
      'Sponsored Partner',
      'PLATINUM',
      0.2,
      10,
      current_date - 1,
      current_date + 1,
      array['90032']
    );

  select id
  into selected_sponsor_id
  from public.select_sponsor_for_property(
    '90032000-0000-4000-8000-000000000001'
  );

  if selected_sponsor_id is distinct from
    'cccccccc-0000-4000-8000-000000000003'::uuid
  then
    raise exception
      'Expected Sponsor C, received %',
      selected_sponsor_id;
  end if;

  select count(*)
  into fallback_count
  from public.select_sponsor_for_property(
    '90032000-0000-4000-8000-000000000002'
  );

  if fallback_count <> 0 then
    raise exception
      'Expected fallback to return zero sponsors.';
  end if;

  raise notice
    'PASS: Sponsor C selected; pending Sponsor D excluded; fallback returned zero rows.';
end;
$test$;

rollback;