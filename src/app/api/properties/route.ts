import { NextRequest, NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { CreatePropertySchema } from "@/schemas/property";

function failure(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("properties")
      .select(`
        id,
        address,
        price,
        bedrooms,
        bathrooms,
        square_feet,
        property_sponsors!inner(
          sponsors!inner(active_status)
        )
      `)
      .eq("status", "approved")
      .eq("property_sponsors.sponsors.active_status", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Property query failed:", error.code);
      return failure("Unable to load properties.", 500);
    }

    const properties = (data ?? []).map((property) => ({
      id: property.id,
      address: property.address,
      price: property.price,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      square_feet: property.square_feet,
    }));

    return NextResponse.json(
      { properties },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch {
    return failure("Database service is unavailable.", 503);
  }
}

export async function POST(request: NextRequest) {
  let requestBody: unknown;

  try {
    requestBody = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: "Request body must contain valid JSON.",
        issues: [
          {
            path: "",
            code: "invalid_json",
            message: "Malformed JSON request body.",
          },
        ],
      },
      { status: 400 },
    );
  }

  const validation = CreatePropertySchema.safeParse(requestBody);

  if (!validation.success) {
    return NextResponse.json(
      {
        error: "Property data failed validation.",
        issues: validation.error.issues.map((issue) => ({
          path: issue.path.join("."),
          code: issue.code,
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
      return failure("Authentication is required.", 401);
    }

    const { data, error } = await supabase
      .from("properties")
      .insert({
        ...validation.data,
        owner_id: user.id,
        status: "draft",
      })
      .select(
        "id,owner_id,address,price,bedrooms,bathrooms,square_feet,status,created_at",
      )
      .single();

    if (error) {
      console.error("Property creation failed:", error.code);

      const status =
        error.code === "42501"
          ? 403
          : error.code.startsWith("22") ||
              error.code.startsWith("23")
            ? 400
            : 500;

      return failure("Unable to create property.", status);
    }

    return NextResponse.json(
      { property: data },
      {
        status: 201,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch {
    return failure("Database service is unavailable.", 503);
  }
}
