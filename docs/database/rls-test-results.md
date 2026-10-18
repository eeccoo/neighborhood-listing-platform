# Row-Level Security Test Results

## Test Environment

- Database: Supabase development project
- Table evaluated: `public.properties`
- Data: fictional development records only
- Credentials: referenced through local environment variables and never committed
- Test date: October 17, 2026

## Policy Predicates

```sql
alter table public.properties enable row level security;
alter table public.properties force row level security;
```

Public approved-record predicate:

```sql
is_approved = true
```

Owner predicate:

```sql
(select auth.uid()) = owner_id
and is_approved = false
```

## Role Operations Matrix

| Role | Permitted operation | Enforced rule | Denied operation | Enforced rule |
|---|---|---|---|---|
| Anonymous user | `SELECT` approved properties | `is_approved = true` | `INSERT` property | No `INSERT` privilege or insert policy for `anon` |
| Resource owner | `UPDATE` own unapproved property | `auth.uid() = owner_id AND is_approved = false` | `UPDATE` another owner’s record or an approved record | Ownership and approval predicates fail |
| Other authenticated user | `SELECT` approved properties | Public approved-record policy also applies to authenticated users | `UPDATE` property owned by another user | `auth.uid() = owner_id` evaluates false |
| Server administrator | `SELECT` all properties | Server-only `service_role` bypasses RLS | Direct client use of administrative SQL operations | Service-role credential is unavailable to client code; no public administrative route exists |

The `service_role` itself bypasses RLS and is therefore not restricted by an RLS row predicate. Its denial boundary is architectural: it is stored only in a server-only environment variable and imported only by server-only code.

## Anonymous Approved Read

### Request

No `Authorization` header was included.

```bash
curl -i http://localhost:3000/api/properties
```

### Response

```http
HTTP/1.1 200 OK
cache-control: no-store
content-type: application/json

{"properties":[{"id":"11111111-1111-4111-8111-111111111111","title":"Pinecrest Modern Villa","is_approved":true}]}
```

Only the approved record was returned. Both unapproved records were hidden.

## Anonymous Insert Denial

### Request

The request included the public API key but no `Authorization` header, so it executed as `anon`.

```bash
curl -i -X POST \
  "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/properties" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "owner_id": "99999999-9999-4999-8999-999999999999",
    "title": "Unauthorized Anonymous Listing",
    "street_address": "999 Fictional Street",
    "city": "Springfield",
    "state": "OR",
    "zip_code": "97477",
    "price": 100000,
    "bedrooms": 2,
    "bathrooms": 1,
    "square_feet": 900,
    "property_type": "condo",
    "image_path": "/images/properties/unauthorized.jpg",
    "details_url": "/properties/unauthorized",
    "amenities": ["parking"],
    "is_approved": false
  }'
```

### Raw Response

```http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer
Proxy-Status: PostgREST; error=42501

{"code":"42501","details":null,"hint":"Grant the required privileges to the current role with: GRANT INSERT ON public.properties TO anon;","message":"permission denied for table properties"}
```

## Other Authenticated User Update Denial

### Request

The bearer token belonged to `other-test@example.com`. The target property belonged to `owner-test@example.com`.

```bash
curl -i -X PATCH \
  "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/properties?id=eq.22222222-2222-4222-8222-222222222222" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $OTHER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"title":"Unauthorized Other-User Change"}'
```

### Raw Response

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Length: 2
Content-Range: */*
preference-applied: return=representation

[]
```

The request was authenticated, but RLS concealed the non-owned row. Zero records were updated.

## Owner Update Success

### Request

The bearer token belonged to the owner of the target draft record.

```bash
curl -i -X PATCH \
  "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/properties?id=eq.22222222-2222-4222-8222-222222222222" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $OWNER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"title":"Owner Updated Draft Townhouse"}'
```

### Raw Response

```http
HTTP/1.1 200 OK
Content-Range: 0-0/*
preference-applied: return=representation

[{"id":"22222222-2222-4222-8222-222222222222","title":"Owner Updated Draft Townhouse","is_approved":false}]
```

One row was updated because the authenticated user matched `owner_id` and the property remained unapproved.

## Service-Role Read Success

### Request

The privileged credential remained in a server-only environment variable.

```bash
curl -i \
  "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/properties?select=id,title,is_approved&order=id" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

### Raw Response

```http
HTTP/1.1 200 OK
Content-Range: 0-2/*

[
  {"id":"11111111-1111-4111-8111-111111111111","title":"Pinecrest Modern Villa","is_approved":true},
  {"id":"22222222-2222-4222-8222-222222222222","title":"Owner Updated Draft Townhouse","is_approved":false},
  {"id":"33333333-3333-4333-8333-333333333333","title":"Other User Draft Condo","is_approved":false}
]
```

This demonstrates that the trusted service role can read records hidden from public and ordinary authenticated users.

## Empty Array Versus 403

An empty JSON array means the request was syntactically valid and authenticated, but the RLS visibility predicate exposed zero matching rows. This behavior conceals whether the protected row exists and reduces record-enumeration risk.

A `403 Forbidden` explicitly states that the server understood the request but refused it. That response is clearer to an authorized application user, but it may reveal that the protected resource or operation exists.

Application code must inspect the number of affected rows. It must not interpret `HTTP 200` with `[]` as proof that an update succeeded.