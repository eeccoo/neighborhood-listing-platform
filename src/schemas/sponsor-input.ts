import { isIP } from "node:net";

import { z } from "zod";

const sponsorCategories = [
  "community",
  "finance",
  "food-and-drink",
  "health-and-wellness",
  "home-services",
] as const;

const SponsorDestinationUrlSchema = z
  .string()
  .trim()
  .url("Sponsor destination URL must be a valid URL.")
  .superRefine((value, context) => {
    let parsedUrl: URL;

    try {
      parsedUrl = new URL(value);
    } catch {
      return;
    }

    if (parsedUrl.protocol !== "https:") {
      context.addIssue({
        code: "custom",
        message:
          "Sponsor destination URL must use HTTPS.",
      });
    }

    if (isIP(parsedUrl.hostname) !== 0) {
      context.addIssue({
        code: "custom",
        message:
          "Sponsor destination URL must use a public DNS hostname, not an IP address.",
      });
    }

    if (parsedUrl.username || parsedUrl.password) {
      context.addIssue({
        code: "custom",
        message:
          "Sponsor destination URL must not contain embedded credentials.",
      });
    }
  });

export const SponsorInputSchema = z
  .object({
    destination_url: SponsorDestinationUrlSchema,
  })
  .strict();

export const CreateSponsorSchema = z
  .object({
    business_name: z.string().trim().min(2).max(100),
    short_description: z
      .string()
      .trim()
      .min(10)
      .max(500),
    destination_url: SponsorDestinationUrlSchema,
    category: z.enum(sponsorCategories),
  })
  .strict();

export type SponsorInput = z.infer<
  typeof SponsorInputSchema
>;

export type CreateSponsorInput = z.infer<
  typeof CreateSponsorSchema
>;

export function formatSponsorValidationError(
  error: z.ZodError,
) {
  return {
    error: "Invalid sponsor input.",
    issues: error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    })),
  };
}