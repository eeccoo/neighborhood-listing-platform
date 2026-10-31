import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET(
  _request: Request,
  context: { params: Promise<{ propertyId: string }> },
) {
  const { propertyId } = await context.params;

  if (!z.uuid().safeParse(propertyId).success) {
    return NextResponse.json(
      { error: "Invalid property ID." },
      { status: 400 },
    );
  }

  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("sponsors")
      .select(`
        id,
        name,
        tier,
        property_sponsors!inner(
          property_id,
          properties!inner(status)
        )
      `)
      .eq("active_status", true)
      .eq("property_sponsors.property_id", propertyId)
      .eq("property_sponsors.properties.status", "approved");

    if (error) {
      console.error("Sponsor query failed:", error.code);
      return NextResponse.json(
        { error: "Unable to load sponsors." },
        { status: 500 },
      );
    }

    const tierOrder: Record<string, number> = {
      gold: 0,
      silver: 1,
      bronze: 2,
    };

    const sponsors = (data ?? [])
      .map((sponsor) => ({
        id: sponsor.id,
        name: sponsor.name,
        tier: sponsor.tier,
      }))
      .sort((a, b) => tierOrder[a.tier] - tierOrder[b.tier]);

    return NextResponse.json(
      { sponsors },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "Sponsor service is unavailable." },
      { status: 503 },
    );
  }
}
