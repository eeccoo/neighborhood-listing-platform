# ADR 001: Validated Property Data Contract

## Status

Accepted

## Context

The application receives property and sponsor data from external or AI-generated sources. TypeScript types provide compile-time checking but disappear at runtime, so they cannot verify incoming JSON.

The project needs strict runtime validation before data reaches the interface or a future database. It also needs to prevent unknown fields, invalid prices, malformed ZIP codes, and unsupported property or amenity values.

## Decision

Zod will be the single source of truth for the runtime data contract.

The project will:

- Define `Property`, `Sponsor`, and `PropertySponsor` as separate concepts.
- Generate TypeScript types from the Zod schemas.
- Generate JSON Schema from the Zod source.
- Reject unknown properties with strict object schemas.
- Require nonnegative prices, valid five-digit ZIP codes, and approved enumeration values.
- Keep amenities as an array of controlled enumeration values.
- Preserve the raw AI-generated response separately from validated data.
- Call `PropertyCollectionSchema.parse()` before records reach the interface.
- Allow nested sponsor objects in the current validated JSON read model.

A future relational database should store sponsors separately and use a `PropertySponsor` junction table to represent the many-to-many relationship.

## Alternatives Considered

### Separate TypeScript and JSON Schema definitions

Rejected because maintaining two independent contracts could cause the compile-time and runtime rules to drift apart.

### Ajv with a handwritten JSON Schema

Not selected because the project already uses TypeScript and Zod can provide runtime validation while deriving TypeScript types from the same source.

### Free-text amenities

Rejected because spelling, capitalization, and naming differences would make filtering unreliable.

### Separate Amenity and PropertyAmenity tables

Postponed because the current application does not require amenity descriptions, icons, localization, or other amenity-specific metadata.

### Fully normalized database implementation

Postponed because the current assignment uses validated synthetic JSON and does not require persistent relational storage.

## Consequences

### Positive

- Invalid external data fails before rendering.
- TypeScript types and runtime validation originate from one source.
- Unknown fields and invalid domain values are rejected.
- Validation behavior can be tested with valid and invalid fixtures.
- Sponsor and property relationships can be normalized later without changing the conceptual model.

### Negative

- Schema changes require regenerating the JSON Schema and rerunning tests.
- Nested sponsor data may duplicate business information in the JSON read model.
- Zod and the schema-generation package become project dependencies.
- Future database work will require mapping the nested read model into normalized tables.