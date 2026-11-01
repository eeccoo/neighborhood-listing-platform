-- Execute the entire script as postgres in Supabase SQL Editor.
-- All profile changes and fictional records are rolled back.

begin;

create temporary table exam_owner_fixture on commit drop as
select
  (select id from public.profiles order by id limit 1) as owner_a,
  (select id from public.profiles order by id limit 1 offset 1) as owner_b,
  gen_random_uuid() as draft_a,
  gen_random_uuid() as draft_b,
  gen_random_uuid() as approved_a;

do $$
begin
  if (select owner_b from exam_owner_fixture) is null then
    raise exception 'Two existing profiles are required.';
  end if;
end;
$$;

create temporary table exam_owner_results (
  test text,
  database_role text,
  expected bigint,
  actual bigint
) on commit drop;

-- Temporary role assignments; ROLLBACK restores prior values.
update public.profiles
set role = 'property_owner'
where id in (
  select owner_a from exam_owner_fixture
  union all
  select owner_b from exam_owner_fixture
);

insert into public.properties (
  id, owner_id, address, price, bedrooms,
  bathrooms, square_feet, status
)
select draft_a, owner_a, '101 Fictional Owner A Street',
  500000, 3, 2, 1400, 'draft'
from exam_owner_fixture
union all
select draft_b, owner_b, '202 Fictional Owner B Street',
  600000, 3, 2, 1500, 'draft'
from exam_owner_fixture
union all
select approved_a, owner_a, '303 Fictional Approved Street',
  700000, 4, 3, 1800, 'approved'
from exam_owner_fixture;

-- One inquiry for each owner's draft.
insert into public.inquiries (
  property_id, inquirer_email, message
)
select draft_a, 'owner-a-test@example.invalid',
  'Fictional inquiry for Owner A.'
from exam_owner_fixture
union all
select draft_b, 'owner-b-test@example.invalid',
  'Fictional inquiry for Owner B.'
from exam_owner_fixture;

grant select on exam_owner_fixture to authenticated;
grant insert on exam_owner_results to authenticated;

-- Simulate a verified request from Owner A.
select set_config(
  'request.jwt.claim.sub',
  (select owner_a::text from exam_owner_fixture),
  true
);

select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', (select owner_a from exam_owner_fixture),
    'role', 'authenticated'
  )::text,
  true
);

set local role authenticated;

do $$
declare
  f record;
  affected bigint;
  denied bigint;
begin
  select * into f from exam_owner_fixture;

  insert into exam_owner_results
  values (
    'Authenticated identity matches Owner A',
    current_user, 1,
    case when auth.uid() = f.owner_a then 1 else 0 end
  );

  -- Positive: create an owned draft using allowed columns.
  insert into public.properties (
    owner_id, address, price, bedrooms, bathrooms, square_feet
  )
  values (
    f.owner_a, '404 Fictional New Draft Street',
    400000, 2, 1, 1000
  );

  get diagnostics affected = row_count;

  insert into exam_owner_results
  values ('Insert own draft', current_user, 1, affected);

  -- Positive: edit own draft.
  update public.properties
  set price = 510000
  where id = f.draft_a;

  get diagnostics affected = row_count;

  insert into exam_owner_results
  values ('Update own draft', current_user, 1, affected);

  -- Negative: edit another owner's draft.
  update public.properties
  set price = 1
  where id = f.draft_b;

  get diagnostics affected = row_count;

  insert into exam_owner_results
  values ('Update Owner B draft blocked', current_user, 0, affected);

  -- Negative: edit own approved listing.
  update public.properties
  set price = 1
  where id = f.approved_a;

  get diagnostics affected = row_count;

  insert into exam_owner_results
  values ('Update own approved listing blocked', current_user, 0, affected);

  -- Negative: self-approve a draft.
  denied := 0;
  begin
    update public.properties
    set status = 'approved'
    where id = f.draft_a;
  exception
    when insufficient_privilege then
      denied := 1;
  end;

  insert into exam_owner_results
  values ('Self-approval denied', current_user, 1, denied);

  -- Positive and negative inquiry visibility together:
  -- exactly one of these two inquiries belongs to Owner A.
  select count(*) into affected
  from public.inquiries
  where property_id in (f.draft_a, f.draft_b);

  insert into exam_owner_results
  values ('Read only own property inquiry', current_user, 1, affected);

  -- Negative: grant oneself administrator privileges.
  denied := 0;
  begin
    update public.profiles
    set role = 'admin'
    where id = f.owner_a;
  exception
    when insufficient_privilege then
      denied := 1;
  end;

  insert into exam_owner_results
  values ('Self-assigned admin role denied', current_user, 1, denied);
end;
$$;

reset role;

-- Independently inspect stored values with elevated access.
insert into exam_owner_results
select 'Own draft price persisted', current_user, 1, count(*)
from public.properties
where id = (select draft_a from exam_owner_fixture)
  and price = 510000
  and status = 'draft'
union all
select 'Owner B draft unchanged', current_user, 1, count(*)
from public.properties
where id = (select draft_b from exam_owner_fixture)
  and price = 600000
  and status = 'draft'
union all
select 'Approved listing unchanged', current_user, 1, count(*)
from public.properties
where id = (select approved_a from exam_owner_fixture)
  and price = 700000
  and status = 'approved'
union all
select 'Owner A role unchanged', current_user, 1, count(*)
from public.profiles
where id = (select owner_a from exam_owner_fixture)
  and role = 'property_owner';

select
  test,
  database_role,
  expected,
  actual,
  case when actual = expected then 'PASS' else 'FAIL' end as verdict
from exam_owner_results
order by test;

rollback;