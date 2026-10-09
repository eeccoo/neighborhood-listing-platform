import rawProperties from "../../data/generated/properties.raw.json";

import { PropertyCollectionSchema } from "@/schemas/property-data";
import type { Property, Sponsor } from "@/types";

const validatedProperties =
  PropertyCollectionSchema.parse(rawProperties);

export const properties: Property[] =
  validatedProperties.map((property) => ({
    id: property.property_id,
    title: property.title,
    streetAddress: property.street_address,
    city: property.city,
    state: property.state,
    price: property.price,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    squareFootage: property.square_feet,
    imagePath: "/property-home.svg",
    detailsUrl: `/?property=${encodeURIComponent(
      property.property_id,
    )}#listings`,
    propertyType: property.property_type,
  }));

const activeSponsor = validatedProperties
  .flatMap((property) => property.local_sponsors)
  .find((candidate) => candidate.is_active);

if (!activeSponsor) {
  throw new Error(
    "Validated property data contains no active sponsor.",
  );
}

export const sponsor: Sponsor = {
  id: activeSponsor.sponsor_id,
  businessName: activeSponsor.business_name,
  shortDescription: activeSponsor.short_description,
  destinationUrl: activeSponsor.destination_url,
  sponsoredLabel: activeSponsor.sponsored_label,
};