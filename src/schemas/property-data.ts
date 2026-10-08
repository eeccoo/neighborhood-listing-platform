import { z } from "zod";

export const PropertyTypeSchema = z.enum([
  "single-family",
  "condo",
  "townhouse",
  "multi-family",
  "apartment",
]);

export const AmenitySchema = z.enum([
  "accessible-entry",
  "air-conditioning",
  "laundry",
  "parking",
  "pet-friendly",
  "pool",
]);

export const SponsorCategorySchema = z.enum([
  "community",
  "finance",
  "food-and-drink",
  "health-and-wellness",
  "home-services",
]);

export const SponsorSchema = z
  .object({
    sponsor_id: z.string().trim().min(1),
    business_name: z.string().trim().min(2),
    short_description: z.string().trim().min(10),
    destination_url: z.string().url(),
    category: SponsorCategorySchema,
    sponsored_label: z.literal("Sponsored"),
    is_active: z.boolean(),
  })
  .strict();

export const PropertySchema = z
  .object({
    property_id: z.string().trim().min(1),
    title: z.string().trim().min(3),
    street_address: z.string().trim().min(5),
    city: z.string().trim().min(2),
    state: z.string().regex(/^[A-Z]{2}$/),
    zip_code: z.string().regex(/^\d{5}$/),
    price: z.number().nonnegative(),
    bedrooms: z.number().int().nonnegative(),
    bathrooms: z.number().nonnegative(),
    square_feet: z.number().int().positive(),
    property_type: PropertyTypeSchema,
    image_path: z.string().startsWith("/"),
    details_url: z.string().startsWith("/"),
    amenities: z.array(AmenitySchema),
    local_sponsors: z.array(SponsorSchema),
  })
  .strict();

export const PropertySponsorSchema = z
  .object({
    property_id: z.string().trim().min(1),
    sponsor_id: z.string().trim().min(1),
  })
  .strict();

export const PropertyCollectionSchema = z
  .array(PropertySchema)
  .length(5);

export type PropertyType = z.infer<typeof PropertyTypeSchema>;
export type Amenity = z.infer<typeof AmenitySchema>;
export type SponsorCategory = z.infer<
  typeof SponsorCategorySchema
>;
export type ValidatedSponsor = z.infer<typeof SponsorSchema>;
export type ValidatedProperty = z.infer<typeof PropertySchema>;
export type PropertySponsor = z.infer<
  typeof PropertySponsorSchema
>;
export type PropertyCollection = z.infer<
  typeof PropertyCollectionSchema
>;