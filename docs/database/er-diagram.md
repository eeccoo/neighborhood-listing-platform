# Database Entity Relationship Diagram

```mermaid
erDiagram
    PROFILES ||--o{ PROPERTIES : owns
    PROFILES ||--o{ SPONSORS : owns
    PROFILES ||--o{ INQUIRIES : submits
    PROPERTIES ||--o{ INQUIRIES : receives
    PROPERTIES ||--o{ PROPERTY_SPONSORS : includes
    SPONSORS ||--o{ PROPERTY_SPONSORS : supports

    PROFILES {
        uuid id PK
        text display_name
        boolean is_admin
        timestamptz created_at
        timestamptz updated_at
    }

    PROPERTIES {
        uuid id PK
        uuid owner_id FK
        text title
        text street_address
        text city
        text state
        text zip_code
        numeric price
        integer bedrooms
        numeric bathrooms
        integer square_feet
        text property_type
        text image_path
        text details_url
        text_array amenities
        boolean is_approved
        timestamptz created_at
        timestamptz updated_at
    }

    SPONSORS {
        uuid id PK
        uuid owner_id FK
        text business_name
        text short_description
        text destination_url
        text category
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    PROPERTY_SPONSORS {
        uuid property_id PK,FK
        uuid sponsor_id PK,FK
        text sponsored_label
        integer display_order
        timestamptz created_at
    }

    INQUIRIES {
        uuid id PK
        uuid property_id FK
        uuid user_id FK
        text message
        text status
        timestamptz created_at
        timestamptz updated_at
    }
    
    Relationship Notes
- A profile may own multiple properties.
- A profile may own multiple sponsor records.
- Properties and sponsors have a many-to-many relationship through property_sponsors.
- An authenticated profile may submit multiple property inquiries.
- A property may receive multiple inquiries.
- profiles.id corresponds to the authenticated Supabase user ID.
- Deleting a property removes its property-sponsor relationships and inquiries.
- Deleting a sponsor removes its property-sponsor relationships.
- User-owned property and sponsor records are retained if account-deletion behavior requires administrative review.

