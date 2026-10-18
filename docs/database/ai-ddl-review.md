# AI Studio DDL Review

## Prompt Result

Google AI Studio proposed PostgreSQL DDL and an RLS plan for the profiles, properties, sponsors, property_sponsors, and inquiries tables.

## Useful Ideas Retained

- Explicit primary and foreign keys
- Controlled values enforced with check constraints
- Ownership based on `auth.uid()`
- Public access limited to approved properties and active sponsors
- Cascade cleanup for junction records
- Server-only administrative authorization
- RLS enabled on every exposed table

## Output Rejected

The generated SQL was not executed because it was incomplete and malformed:

- Trigger function bodies were missing.
- The sponsors definition was truncated.
- Property-sponsor and inquiry definitions were missing.
- RLS policies and executable tests were incomplete.
- Several regular expressions were corrupted.
- Enumeration values did not match the existing application contract.
- One section incorrectly used `server_role` instead of Supabase `service_role`.

## Verification Decision

The AI response was treated only as design feedback. The project uses a complete numbered migration that will be manually reviewed and tested in a development Supabase project before use.