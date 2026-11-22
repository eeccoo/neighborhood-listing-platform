import { z } from "zod";

const SponsorImageSchema = z
  .object({
    src: z.string().startsWith("/sponsors/"),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    alt: z.string().trim().min(10).max(180),
  })
  .strict()
  .refine(
    (image) =>
      Math.abs(
        image.width / image.height - 16 / 9,
      ) < 0.001,
    {
      message:
        "Sponsor image must use a 16:9 aspect ratio.",
    },
  );

export const ApprovedSponsorContentSchema = z
  .object({
    sponsorId: z.string().trim().min(1),
    status: z.literal("approved"),
    approvedCopy: z.string().trim().min(1).max(120),
    characterLimit: z.literal(120),
    approvedBy: z.string().trim().min(2),
    approvedAt: z.string().regex(
      /^\d{4}-\d{2}-\d{2}$/,
    ),
    offerEndsAt: z.string().refine(
      (value) =>
        Number.isFinite(Date.parse(value)),
      "Offer end date must be valid.",
    ),
    destinationUrl: z
      .string()
      .url()
      .refine(
        (value) => value.startsWith("https://"),
        "Sponsor URL must use HTTPS.",
      ),
    image: SponsorImageSchema,
    sourceBrief: z.string().trim().min(1),
    rawModelOutput: z.string().trim().min(1),
  })
  .strict();

export type ApprovedSponsorContent = z.infer<
  typeof ApprovedSponsorContentSchema
>;

export function getDisplayableSponsorContent(
  input: unknown,
  now: Date,
): ApprovedSponsorContent | null {
  const result =
    ApprovedSponsorContentSchema.safeParse(input);

  if (!result.success) {
    return null;
  }

  if (
    result.data.approvedCopy.length >
    result.data.characterLimit
  ) {
    return null;
  }

  if (
    now.getTime() >=
    Date.parse(result.data.offerEndsAt)
  ) {
    return null;
  }

  return result.data;
}