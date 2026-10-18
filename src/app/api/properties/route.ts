import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const PUBLIC_PROPERTY_COLUMNS = [
  "id",
  "title",
  "street_address",
  "city",
  "state",
  "zip_code",
  "price",
  "bedrooms",
  "bathrooms",
  "square_feet",
  "property_type",
  "image_path",
  "details_url",
  "amenities",
  "created_at",
].join(",");

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("properties")
      .select(PUBLIC_PROPERTY_COLUMNS)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Property query failed:", error.code);

      return NextResponse.json(
        { error: "Unable to load properties." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { properties: data },
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