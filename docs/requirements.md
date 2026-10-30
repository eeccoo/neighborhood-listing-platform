# Practical Examination Requirements

## Feature

Sponsor-Backed Property Listing & Inquiry Subsystem.

These are acceptance criteria to verify during implementation.
They are not claims that tests have already passed.

## Story 1: Property Owner

As a registered property owner, I want to submit listing drafts
so that prospective buyers can review them once verified by
administrative staff.

Scope: Medium
Role: Authenticated property_owner

### Acceptance criteria

- Given an authenticated property owner and a valid listing payload,
  when POST /api/properties is called, then the server returns
  HTTP 201 and persists the listing with status = 'draft' and
  owner_id equal to the authenticated user's auth.uid().
- Given an invalid payload or an unknown field, when the owner
  submits it, then the server returns HTTP 400 with structured
  validation details and does not insert a record.
- Given an unauthenticated visitor, when they submit a listing,
  then the server denies creation.
- Given an owner, when they query their own listings, then their
  listings are accessible through owner-scoped database policies.
- Given an owner's draft or rejected listing, when that owner
  edits it, then the update is permitted.
- Given another owner's listing or an approved listing,
  when an owner attempts an unauthorized update, then no row changes.
- Given an owner's listing, when that owner deletes it,
  then the owner-scoped delete policy permits the operation.

## Story 2: Public Inquirer

As a prospective neighborhood resident, I want to view approved
properties alongside their tier-level sponsors and submit an
inquiry without seeing prior inquiries from other users.

Scope: Large
Role: Anonymous visitor or public user

### Acceptance criteria

- Given an anonymous visitor, when public listings are requested,
  then only approved properties with at least one active sponsor
  are returned.
- Given an approved property's sponsorships, when they are displayed,
  then only active sponsors appear with their gold, silver, or
  bronze tier.
- Given a draft, pending, or rejected property, when an anonymous
  visitor queries it, then it is not returned.
- Given a valid property reference, email, and message of at least
  10 characters, when a visitor submits an inquiry, then it is saved.
- Given an inquirer without owner or administrator authority,
  when they request existing inquiries, then no inquiry rows
  are disclosed.
- Given the owner of the referenced property, when they query
  its inquiries, then those inquiries are visible to that owner.

## Story 3: Platform Administrator

As a platform administrator, I want full override authority across
all records and tables to conduct compliance audits.

Scope: Medium
Role: Administrator using trusted server-side service execution

### Acceptance criteria

- Given authorized administrative service execution,
  when an audit reads any of the five subsystem tables,
  then all relevant records are accessible.
- Given authorized administrative service execution,
  when records are inserted, updated, or deleted,
  then ordinary owner restrictions do not block the operation.
- Given a browser client or ordinary user session,
  when it accesses the application, then no service-role
  credential is exposed.
- Given an ordinary authenticated user, when they attempt to
  grant themselves administrator privileges, then the operation
  is denied.

## Implementation Traceability

All implementation targets below are planned until verified.

| Story | Migration | Route / execution entry | Supporting files |
| --- | --- | --- | --- |
| 1: Property Owner | supabase/migrations/20261029140000_exam_schema_persistence.sql | src/app/api/properties/route.ts: authenticated POST | src/schemas/property.ts; src/lib/supabaseServer.ts |
| 2: Public Inquirer | supabase/migrations/20261029140000_exam_schema_persistence.sql | src/app/api/properties/route.ts: public GET; src/app/api/inquiries/route.ts: inquiry POST | src/components/PropertyCard.tsx; src/app/page.tsx |
| 3: Platform Administrator | supabase/migrations/20261029140000_exam_schema_persistence.sql | Trusted server-side audit execution; public routes retain their restricted responses | src/lib/supabaseServer.ts; docs/security-audit.md |

## Route Directory Convention

This existing project uses the Next.js src/app directory.
Therefore src/app/api/properties/route.ts implements the
assignment's app/api/properties/route.ts route.

## Verification Evidence

Actual authorization results will be recorded in
docs/security-audit.md. API validation, responsive layout,
keyboard navigation, and deployment will be verified separately.