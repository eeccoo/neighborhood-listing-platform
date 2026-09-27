export type PropertyType =
  | "single-family"
  | "condo"
  | "townhouse"
  | "multi-family"
  | "apartment";

export interface SearchFilterValues {
  // Optional because users may search across every property type.
  propertyType?: PropertyType;

  // Optional because users may search without setting a minimum price.
  minPrice?: number;

  // Optional because users may search for any bedroom count.
  bedrooms?: number;
}

export interface Property {
  id: string;
  title: string;
  streetAddress: string;
  city: string;
  state: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
  imagePath: string;
  detailsUrl: string;
  propertyType: PropertyType;
}

export interface Sponsor {
  id: string;
  businessName: string;
  shortDescription: string;
  destinationUrl: string;

  // Optional because SponsorBanner can use the default label "Sponsored."
  sponsoredLabel?: string;
}

export interface PropertyCardProps {
  property: Property;

  // Optional because only an above-the-fold image may need loading priority.
  priority?: boolean;
}

export interface SponsorBannerProps {
  sponsor: Sponsor;
}

export interface SearchFiltersProps {
  onSubmit: (filters: SearchFilterValues) => void;

  // Optional because the filter form normally begins without selections.
  initialValues?: SearchFilterValues;
}