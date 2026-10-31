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
| Owner A | Insert own draft | Insert succeeds | 1 row inserted as authenticated Owner A | PASS |
| Owner A | Update own draft | One row changes | 1 row updated; elevated check confirmed saved price | PASS |
| Owner A | Update Owner B listing | No row changes | 0 rows updated; Owner B record unchanged | PASS |
| Owner A | Update own approved listing | No row changes | 0 rows updated; approved record unchanged | PASS |
| Owner A | Change draft to approved | Update denied | Insufficient-privilege error caught; listing remained draft | PASS |
| Inquirer | Submit anonymous inquiry | Insert succeeds | Elevated verification confirmed 1 saved inquiry | PASS |
| Inquirer | Read existing inquiries | No inquiries disclosed | 0 matching inquiry rows returned as anon | PASS |
| Property owner | Read own property's inquiries | Matching inquiries visible | Only 1 of the 2 fixture inquiries was visible | PASS |
| Ordinary user | Change own profile role | Update denied | Insufficient-privilege error caught; role remained property_owner | PASS |
| Service role | Read/write all five tables | Operations succeed | 19 checks passed as service_role; reads and updates covered all five tables, with inserts and deletes on the four listing-related tables | PASS |

## Test Method

Configuration was checked using SQL Editor metadata queries.

### Anonymous Tests

Script: supabase/tests/exam-anonymous.sql

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

### Owner and Privilege-Escalation Tests

Script: supabase/tests/exam-owners.sql
Execution date: October 30, 2026.

The script temporarily assigned two existing profiles the
property_owner role and created fictional listings and inquiries.

It switched to the authenticated database role with Owner A's
user identity.

All 12 checks passed:
- Authenticated identity matched Owner A.
- Owner A inserted an owned draft.
- Owner A updated an owned draft.
- Owner A could not update Owner B's draft.
- Owner A could not update an owned approved listing.
- Owner A could not approve an owned draft.
- Owner A saw only one of the two owners' fixture inquiries.
- Owner A could not assign themselves the admin role.
- Elevated verification confirmed the owned draft's saved price.
- Elevated verification confirmed Owner B's draft was unchanged.
- Elevated verification confirmed the approved listing was unchanged.
- Elevated verification confirmed Owner A's role was unchanged.

The script ended with ROLLBACK, restoring the temporary profile
role assignments and removing the fictional test records.

### Service-Role Administrative Tests

Script: supabase/tests/exam-service-role.sql
Execution date: October 30, 2026.

All 19 checks passed using the service_role database role:
- Execution identity was service_role.
- Reads and updates succeeded on all five subsystem tables.
- Inserts and deletes succeeded on properties, sponsors,
  property_sponsors, and inquiries.
- Protected profile-role changes and approved-listing edits succeeded.

Existing authentication accounts were preserved. Profile insertion
and deletion were not exercised by this script.

The script ended with ROLLBACK to restore the profile and remove
all fictional test records.

Database authorization checks are complete for the recorded cases.
API authentication, validation, UI, and deployment checks remain.

### Interpretation

A denied operation may return zero affected rows instead of an
error. Tests check affected-row counts and persisted values.

Database-role simulation verifies database authorization.
Application authentication and API behavior require separate tests.
## Property API Verification

Implementation commit: fe61097.

| Request | Actual result | Verdict |
| --- | --- | --- |
| GET /api/properties | HTTP 200; returned only the six required public property fields | PASS |
| POST with negative price | HTTP 400; price issue with code too_small | PASS |
| POST with extra status field | HTTP 400; unrecognized_keys issue | PASS |
| POST with malformed JSON | HTTP 400; invalid_json issue | PASS |
| POST with valid payload without authentication | HTTP 401; authentication required | PASS |
| POST as authenticated property owner | HTTP 201; owner_id matched the authenticated user and status was draft | PASS |

Authenticated creation initially returned HTTP 403 because the
signed-in test account lacked the property_owner role.
After trusted administrative role assignment, the same valid
request returned HTTP 201 with matching ownership and draft status.

Created test property:
859d8cfa-8885-4e16-a277-59b61ae361e9.

PASS: Direct SQL verification returned one persisted record.
Both owner_matches and saved_as_draft returned true.

Controlled HTTP fixture tests for draft exclusion and inactive
sponsorship exclusion remain pending. UI and deployment verification
remain pending.
