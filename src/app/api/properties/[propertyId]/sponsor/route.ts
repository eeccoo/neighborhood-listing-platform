import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SponsorInputSchema } from "@/schemas/sponsor-input";

const PropertyIdSchema = z.string().uuid();

interface SponsorRouteContext {
  params: Promise<{
    propertyId: string;
  }>;
}

interface SelectedSponsorRecord {
  id: string;
  business_name: string;
  short_description: string;
  destination_url: string;
  sponsored_label: string;
  tier: "SILVER" | "GOLD" | "PLATINUM";
  distance_miles: number | string;
  impressions: number | string;
}

export async function GET(
  _request: Request,
  context: SponsorRouteContext,
) {
  const { propertyId } = await context.params;

  const propertyIdResult =
    PropertyIdSchema.safeParse(propertyId);

  if (!propertyIdResult.success) {
    return NextResponse.json(
      { error: "Property ID must be a valid UUID." },
      { status: 400 },
    );
  }

  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .rpc("select_sponsor_for_property", {
        requested_property_id: propertyIdResult.data,
      })
      .maybeSingle();

    if (error) {
      console.error(
        "Sponsor selection failed:",
        error.code,
      );

      return NextResponse.json(
        { error: "Unable to select a sponsor." },
        { status: 500 },
      );
    }

    const selectedSponsor =
      data as SelectedSponsorRecord | null;

    if (!selectedSponsor) {
      return NextResponse.json(
        { sponsor: null },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    const destinationValidation =
      SponsorInputSchema.safeParse({
        destination_url:
          selectedSponsor.destination_url,
      });

    if (!destinationValidation.success) {
      console.error(
        "Selected sponsor has an unsafe destination URL.",
      );

      return NextResponse.json(
        { sponsor: null },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    return NextResponse.json(
      {
        sponsor: {
          id: selectedSponsor.id,
          businessName:
            selectedSponsor.business_name,
          shortDescription:
            selectedSponsor.short_description,
          destinationUrl:
            destinationValidation.data.destination_url,
          sponsoredLabel:
            selectedSponsor.sponsored_label,
          tier: selectedSponsor.tier,
          distanceMiles: Number(
            selectedSponsor.distance_miles,
          ),
          impressions: Number(
            selectedSponsor.impressions,
          ),
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "Database service is unavailable." },
      { status: 503 },
    );
  }
}