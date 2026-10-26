import { NextRequest, NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  CreateSponsorSchema,
  formatSponsorValidationError,
} from "@/schemas/sponsor-input";

const PUBLIC_SPONSOR_COLUMNS = [
  "id",
  "business_name",
  "short_description",
  "destination_url",
  "category",
  "is_active",
  "created_at",
].join(",");

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
    CreateSponsorSchema.safeParse(requestBody);

  if (!validationResult.success) {
    return NextResponse.json(
      formatSponsorValidationError(
        validationResult.error,
      ),
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
      .from("sponsors")
      .insert({
        ...validationResult.data,
        owner_id: user.id,
        is_active: false,
      })
      .select(PUBLIC_SPONSOR_COLUMNS)
      .single();

    if (error) {
      console.error(
        "Sponsor creation failed:",
        error.code,
      );

      const status =
        error.code === "42501" ? 403 : 500;

      return NextResponse.json(
        { error: "Unable to create sponsor." },
        { status },
      );
    }

    return NextResponse.json(
      { sponsor: data },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Database service is unavailable." },
      { status: 503 },
    );
  }
}