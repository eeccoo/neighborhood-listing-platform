# Week 3 Data Requirements

## Purpose

Define the minimum validated data required for property cards, property
details, sponsor selection, and accessible voice responses. All records
and names in generated seed data must be fictional.

## Property Card

A property card requires:

- `property_id`: stable property identifier
- `title`: display name
- `street_address`: street portion of the address
- `city`: property city
- `state`: two-letter state abbreviation
- `zip_code`: five-digit ZIP code
- `price`: listing price in US dollars
- `bedrooms`: number of bedrooms
- `bathrooms`: number of bathrooms
- `square_feet`: interior square footage
- `property_type`: controlled property category
- `image_path`: local image path
- `details_url`: property-detail destination

## Property Detail Page

A property detail page requires all property-card fields plus:

- `amenities`: controlled list of property features
- `local_sponsors`: validated sponsors associated with the property

## Sponsor Selection

A sponsor requires:

- `sponsor_id`: stable sponsor identifier
- `business_name`: public business name
- `short_description`: short promotional description
- `destination_url`: valid link destination
- `category`: controlled business category
- `sponsored_label`: visible advertising disclosure
- `is_active`: whether the sponsor may currently be displayed

Only active sponsors may be selected for display.

## Voice Response

A voice response uses validated property data:

- Property title
- Complete address
- Formatted price
- Bedroom count
- Bathroom count
- Square footage
- Amenities
- Active local sponsor names

The voice summary should be derived from validated property data instead
of being stored as a second copy that could become outdated.

## Entities and Primary Keys

### Property

Primary key: `property_id`

A Property represents one real-estate listing.

### Sponsor

Primary key: `sponsor_id`

A Sponsor represents one local business or organization.

### PropertySponsor

Composite primary key:

- `property_id`
- `sponsor_id`

Foreign keys:

- `property_id` references Property
- `sponsor_id` references Sponsor

PropertySponsor represents the relationship between a property and a
local sponsor.

## Relationships

- One Property can have zero or more sponsors.
- One Sponsor can support zero or more properties.
- Property and Sponsor therefore have a many-to-many relationship.
- PropertySponsor is the join entity connecting them.
- The generated JSON representation may embed validated sponsor summaries
  in `local_sponsors`, while the conceptual database model keeps Sponsor
  records separate.

## Initial Business Rules

- IDs must be non-empty and stable.
- Prices must be zero or greater.
- Bedrooms must be nonnegative integers.
- Bathrooms must be nonnegative numbers.
- Square footage must be greater than zero.
- ZIP codes must contain exactly five digits.
- State values must use two uppercase letters.
- Property types must come from a controlled enumeration.
- Amenities must come from a controlled enumeration.
- Unknown fields must be rejected.
- Sponsor URLs must use valid URL syntax.
- Inactive sponsors must not be displayed.
- Synthetic records must not contain real client or personal data.

## Ambiguities Requiring Confirmation

- Whether a price of zero means a valid unpriced listing or should be rejected.
- Whether half-bathroom values such as `2.5` are permitted.
- Which amenity values belong in the controlled list.
- Whether one sponsor may appear more than once on the same property.
- Whether sponsor selection needs a display-order or priority value.
- Whether ZIP+4 values should be accepted in addition to five-digit ZIP codes.