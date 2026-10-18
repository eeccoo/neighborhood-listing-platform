import { z } from "zod";

const propertyTypes = [
  "single-family",
  "condo",
  "townhouse",
  "multi-family",
  "apartment",
] as const;

const amenities = [
  "accessible-entry",
  "air-conditioning",
  "laundry",
  "parking",
  "pet-friendly",
  "pool",
] as const;

export const CreatePropertySchema = z
  .object({
    title: z.string().trim().min(3).max(140),
    street_address: z.string().trim().min(5).max(150),
    city: z.string().trim().min(2).max(100),
    state: z.string().regex(/^[A-Z]{2}$/),
    zip_code: z.string().regex(/^[0-9]{5}$/),
    price: z.number().min(0).max(999999999.99),
    bedrooms: z.number().int().min(0).max(99),
    bathrooms: z
      .number()
      .min(0)
      .max(99)
      .refine(
        (value) => Number.isInteger(value * 2),
        "Bathrooms must use half-unit increments.",
      ),
    square_feet: z.number().int().min(1).max(500000),
    property_type: z.enum(propertyTypes),
    image_path: z.string().startsWith("/"),
    details_url: z.string().startsWith("/"),
    amenities: z.array(z.enum(amenities)),
  })
  .strict();

export type CreatePropertyInput = z.infer<
  typeof CreatePropertySchema
>;