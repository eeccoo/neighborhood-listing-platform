-- Run the entire script as postgres in Supabase SQL Editor.
-- All changes are rolled back.

begin;

create temporary table exam_service_fixture on commit drop as
select
  (select id from public.profiles order by id limit 1) as owner_id,
  gen_random_uuid() as property_id,
  gen_random_uuid() as sponsor_id,
  gen_random_uuid() as inquiry_id;

do $$
begin
  if (select owner_id from exam_service_fixture) is null then
    raise exception 'At least one existing profile is required.';
  end if;
end;
$$;

create temporary table exam_service_results (
  test text,
  database_role text,
  expected bigint,
  actual bigint
) on commit drop;

grant select on exam_service_fixture to service_role;
grant insert on exam_service_results to service_role;

set local request.jwt.claim.sub = '';
set local request.jwt.claims = '{"role":"service_role"}';
set local role service_role;

do $$
declare
  f record;
  affected bigint;
  table_name text;
  matching_condition text;
begin
  select * into f from exam_service_fixture;

  insert into exam_service_results
  values (
    'Execution uses service_role',
    current_user, 1,
    case when current_user = 'service_role' then 1 else 0 end
  );

  -- Administrative creation: an approved property and
  -- inactive sponsor demonstrate elevated operations.
  insert into public.properties (
    id, owner_id, address, price, bedrooms,
    bathrooms, square_feet, status
  )
  values (
    f.property_id, f.owner_id, '505 Fictional Admin Street',
    800000, 4, 3, 2000, 'approved'
  );

  get diagnostics affected = row_count;
  insert into exam_service_results
  values ('Insert approved property', current_user, 1, affected);

  insert into public.sponsors (
    id, name, tier, active_status
  )
  values (
    f.sponsor_id, 'Fictional Administrative Sponsor', 'gold', false
  );

  get diagnostics affected = row_count;
  insert into exam_service_results
  values ('Insert inactive sponsor', current_user, 1, affected);

  insert into public.property_sponsors (property_id, sponsor_id)
  values (f.property_id, f.sponsor_id);

  get diagnostics affected = row_count;
  insert into exam_service_results
  values ('Insert sponsorship link', current_user, 1, affected);

  insert into public.inquiries (
    id, property_id, inquirer_email, message
  )
  values (
    f.inquiry_id, f.property_id, 'admin-test@example.invalid',
    'This is a fictional administrative inquiry.'
  );

  get diagnostics affected = row_count;
  insert into exam_service_results
  values ('Insert inquiry', current_user, 1, affected);

  -- Inspect all five tables, including records hidden from anon.
  foreach table_name in array array[
    'profiles', 'properties', 'sponsors',
    'property_sponsors', 'inquiries'
  ]
  loop
    matching_condition := case table_name
      when 'profiles' then format('id = %L::uuid', f.owner_id)
      when 'properties' then format('id = %L::uuid', f.property_id)
      when 'sponsors' then format('id = %L::uuid', f.sponsor_id)
      when 'property_sponsors' then format(
        'property_id = %L::uuid and sponsor_id = %L::uuid',
        f.property_id, f.sponsor_id
      )
      when 'inquiries' then format('id = %L::uuid', f.inquiry_id)
    end;

    execute format(
      'select count(*) from public.%I where %s',
      table_name, matching_condition
    ) into affected;

    insert into exam_service_results
    values ('Read ' || table_name, current_user, 1, affected);
  end loop;

  -- Change a protected profile field. ROLLBACK restores it.
  update public.profiles
  set role = 'admin'
  where id = f.owner_id;

  get diagnostics affected = row_count;
  insert into exam_service_results
  values ('Update protected profile role', current_user, 1, affected);

  -- Ordinary owners cannot update approved properties.
  update public.properties
  set price = 810000
  where id = f.property_id;

  get diagnostics affected = row_count;
  insert into exam_service_results
  values ('Update approved property', current_user, 1, affected);

  update public.sponsors
  set active_status = true
  where id = f.sponsor_id;

  get diagnostics affected = row_count;
  insert into exam_service_results
  values ('Update sponsor activation', current_user, 1, affected);

  update public.property_sponsors
  set display_order = 1
  where property_id = f.property_id
    and sponsor_id = f.sponsor_id;

  get diagnostics affected = row_count;
  insert into exam_service_results
  values ('Update sponsorship link', current_user, 1, affected);

  update public.inquiries
  set message = 'Updated fictional administrative inquiry.'
  where id = f.inquiry_id;

  get diagnostics affected = row_count;
  insert into exam_service_results
  values ('Update inquiry message', current_user, 1, affected);

  -- Delete only the fictional fixtures.
  delete from public.inquiries where id = f.inquiry_id;
  get diagnostics affected = row_count;
  insert into exam_service_results
  values ('Delete inquiry', current_user, 1, affected);

  delete from public.property_sponsors
  where property_id = f.property_id and sponsor_id = f.sponsor_id;
  get diagnostics affected = row_count;
  insert into exam_service_results
  values ('Delete sponsorship link', current_user, 1, affected);

  delete from public.properties where id = f.property_id;
  get diagnostics affected = row_count;
  insert into exam_service_results
  values ('Delete property', current_user, 1, affected);

  delete from public.sponsors where id = f.sponsor_id;
  get diagnostics affected = row_count;
  insert into exam_service_results
  values ('Delete sponsor', current_user, 1, affected);
end;
$$;

reset role;

select
  test,
  database_role,
  expected,
  actual,
  case when actual = expected then 'PASS' else 'FAIL' end as verdict
from exam_service_results
order by test;

rollback;