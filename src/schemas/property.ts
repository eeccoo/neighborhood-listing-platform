import { z } from "zod";

export const CreatePropertySchema = z
  .object({
    address: z.string().trim().min(5),
    price: z.number().nonnegative(),
    bedrooms: z.number().int().nonnegative(),
    bathrooms: z.number().nonnegative(),
    square_feet: z.number().int().positive(),
  })
  .strict();

export type CreatePropertyInput = z.infer<
  typeof CreatePropertySchema
>;