# Practical Examination Security Audit

## Migration Execution

- Supabase CLI version: 2.122.0.
- Dry run identified only the examination migration.
- Migration 20261029140000 applied successfully.
- Local and remote migration histories match.

## Configuration Verification

- PASS: RLS is enabled and forced on all five tables:
  profiles, properties, sponsors, property_sponsors, and inquiries.
- PASS: All seven new examination columns exist and are NOT NULL.
- PASS: SQL Editor listed exactly 11 policies, all beginning
  with exam_. No legacy policies remained on the five tables.

## Authorization Test Matrix

| Actor | Operation | Expected result | Actual result | Verdict |
| --- | --- | --- | --- | --- |
| Anonymous | Read approved property | Property visible | 1 matching row returned as anon | PASS |
| Anonymous | Read draft property | No draft disclosed | 0 matching rows returned as anon | PASS |
| Anonymous | Read active sponsor | Active sponsor visible | 1 matching row returned as anon | PASS |
| Anonymous | Read inactive sponsor | No inactive sponsor disclosed | 0 matching rows returned as anon | PASS |
| Owner A | Insert own draft | Insert succeeds | Pending | PENDING |
| Owner A | Update own draft | One row changes | Pending | PENDING |
| Owner A | Update Owner B listing | No row changes | Pending | PENDING |
| Owner A | Update own approved listing | No row changes | Pending | PENDING |
| Owner A | Change draft to approved | Update denied | Pending | PENDING |
| Inquirer | Submit anonymous inquiry | Insert succeeds | Elevated verification confirmed 1 saved inquiry | PASS |
| Inquirer | Read existing inquiries | No inquiries disclosed | 0 matching inquiry rows returned as anon | PASS |
| Property owner | Read own property's inquiries | Matching inquiries visible | Pending | PENDING |
| Ordinary user | Change own profile role | Update denied | Pending | PENDING |
| Service role | Read/write all five tables | Operations succeed | Pending | PENDING |

## Test Method

Configuration was checked using SQL Editor metadata queries.

Anonymous authorization tests were executed using
supabase/tests/exam-anonymous.sql.

The script created fictional fixtures and switched to the anon
database role with no authenticated user identity.

It verified:
- Approved properties were visible.
- Draft properties were hidden.
- Active sponsors were visible.
- Inactive sponsors were hidden.
- Anonymous inquiry insertion succeeded.
- The anonymous user could not read the submitted inquiry.

After RESET ROLE, postgres independently confirmed that one
inquiry had been saved. This elevated verification does not
constitute a service-role administrator test.

All six checks passed. The script ended with ROLLBACK to remove
the fictional test records.

Owner isolation, privilege escalation, and service-role tests
remain pending.

A denied operation may return zero affected rows instead of an
error. Tests must check row counts and persisted values.