import { NextRequest, NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CreatePropertySchema } from "@/schemas/property-input";

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

export async function POST(request: NextRequest) {
  let requestBody: unknown;

  try {
    requestBody = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must contain valid JSON." },
      { status: 400 },
    );
  }

  const validationResult =
    CreatePropertySchema.safeParse(requestBody);

  if (!validationResult.success) {
    return NextResponse.json(
      {
        error: "Property data failed validation.",
        issues: validationResult.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: authenticationError,
    } = await supabase.auth.getUser();

    if (authenticationError || !user) {
      return NextResponse.json(
        { error: "Authentication is required." },
        { status: 401 },
      );
    }

    const { data, error } = await supabase
      .from("properties")
      .insert({
        ...validationResult.data,
        owner_id: user.id,
        is_approved: false,
      })
      .select(PUBLIC_PROPERTY_COLUMNS)
      .single();

    if (error) {
      console.error("Property creation failed:", error.code);

      const status = error.code === "42501" ? 403 : 500;

      return NextResponse.json(
        { error: "Unable to create property." },
        { status },
      );
    }

    return NextResponse.json(
      { property: data },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Database service is unavailable." },
      { status: 503 },
    );
  }
}