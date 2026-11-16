import { createSupabaseServerClient } from
  "@/lib/supabase/server";

import type {
  SponsorCandidate,
  SponsorPlacement,
} from "@/lib/sponsors/select-sponsor";

interface SponsorRow {
  id: string;
  business_name: string;
  short_description: string;
  destination_url: string;
  is_approved: boolean;
  is_active: boolean;
  placement: SponsorPlacement;
  starts_at: string;
  ends_at: string;
  zip_codes: string[];
  nearby_zip_codes: string[];
  priority: number;
}

const PUBLIC_CAMPAIGN_COLUMNS = [
  "id",
  "business_name",
  "short_description",
  "destination_url",
  "is_approved",
  "is_active",
  "placement",
  "starts_at",
  "ends_at",
  "zip_codes",
  "nearby_zip_codes",
  "priority",
].join(",");

export async function queryEligibleSponsors(
  placement: SponsorPlacement,
  zipCode: string,
  now: Date,
): Promise<SponsorCandidate[]> {
  if (!/^\d{5}$/.test(zipCode)) {
    return [];
  }

  const supabase =
    await createSupabaseServerClient();

  const timestamp = now.toISOString();

  const { data, error } = await supabase
    .from("sponsors")
    .select(PUBLIC_CAMPAIGN_COLUMNS)
    .eq("is_approved", true)
    .eq("is_active", true)
    .eq("placement", placement)
    .lte("starts_at", timestamp)
    .gt("ends_at", timestamp)
    .or(
      `zip_codes.cs.{${zipCode}},nearby_zip_codes.cs.{${zipCode}}`,
    );

  if (error) {
    throw new Error(
      `Sponsor query failed: ${error.code}`,
    );
  }

  return (
    (data ?? []) as unknown as SponsorRow[]
  ).map((row) => ({
    id: row.id,
    businessName: row.business_name,
    shortDescription: row.short_description,
    destinationUrl: row.destination_url,
    approved: row.is_approved,
    active: row.is_active,
    placement: row.placement,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    zipCodes: row.zip_codes,
    nearbyZipCodes: row.nearby_zip_codes,
    priority: row.priority,
  }));
}