-- Run the entire script as postgres in Supabase SQL Editor.
-- ROLLBACK removes all fictional test records afterward.

begin;

create temporary table exam_fixture on commit drop as
select
  (select id from public.profiles order by id limit 1) as owner_id,
  gen_random_uuid() as approved_id,
  gen_random_uuid() as draft_id,
  gen_random_uuid() as active_id,
  gen_random_uuid() as inactive_id;

do $$
begin
  if (select owner_id from exam_fixture) is null then
    raise exception 'At least one existing profile is required.';
  end if;
end;
$$;

create temporary table exam_results (
  test text,
  database_role text,
  expected bigint,
  actual bigint
) on commit drop;

-- Prepare fictional records with elevated setup access.
insert into public.properties (
  id, owner_id, address, price, bedrooms,
  bathrooms, square_feet, status
)
select approved_id, owner_id, '100 Fictional Approved Street',
  500000, 3, 2, 1400, 'approved'
from exam_fixture
union all
select draft_id, owner_id, '200 Fictional Draft Street',
  450000, 2, 1, 1100, 'draft'
from exam_fixture;

insert into public.sponsors (id, name, tier, active_status)
select active_id, 'Fictional Active Sponsor', 'gold', true
from exam_fixture
union all
select inactive_id, 'Fictional Inactive Sponsor', 'bronze', false
from exam_fixture;

insert into public.property_sponsors (property_id, sponsor_id)
select approved_id, active_id from exam_fixture;

grant select on exam_fixture to anon;
grant insert on exam_results to anon;

-- Exercise actual anonymous permissions.
set local request.jwt.claim.sub = '';
set local request.jwt.claims = '{"role":"anon"}';
set local role anon;

insert into exam_results
select 'Approved property visible', current_user, 1, count(*)
from public.properties
where id = (select approved_id from exam_fixture)
union all
select 'Draft property hidden', current_user, 0, count(*)
from public.properties
where id = (select draft_id from exam_fixture)
union all
select 'Active sponsor visible', current_user, 1, count(*)
from public.sponsors
where id = (select active_id from exam_fixture)
union all
select 'Inactive sponsor hidden', current_user, 0, count(*)
from public.sponsors
where id = (select inactive_id from exam_fixture);

-- Insert without requesting the saved row back.
insert into public.inquiries (
  property_id, inquirer_email, message
)
select approved_id, 'anonymous-test@example.invalid',
  'This is a fictional examination inquiry.'
from exam_fixture;

insert into exam_results
select 'Inquiry hidden from anonymous user', current_user, 0, count(*)
from public.inquiries
where property_id = (select approved_id from exam_fixture);

-- Independently confirm the anonymous insertion succeeded.
reset role;

insert into exam_results
select 'Anonymous inquiry saved: elevated check',
  current_user, 1, count(*)
from public.inquiries
where property_id = (select approved_id from exam_fixture)
  and inquirer_email = 'anonymous-test@example.invalid';

select
  test,
  database_role,
  expected,
  actual,
  case when actual = expected then 'PASS' else 'FAIL' end as verdict
from exam_results
order by test;

rollback;