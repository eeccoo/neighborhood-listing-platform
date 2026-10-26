import { isIP } from "node:net";

import { z } from "zod";

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

export type SponsorInput = z.infer<
  typeof SponsorInputSchema
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