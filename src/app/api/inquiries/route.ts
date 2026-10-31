import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabaseServer";

const InquirySchema = z
  .object({
    property_id: z.uuid(),
    inquirer_email: z.string().trim().max(254).regex(
      /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
      "Enter a valid email address.",
    ),
    message: z.string().trim().min(10).max(2000),
  })
  .strict();

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must contain valid JSON." },
      { status: 400 },
    );
  }

  const validation = InquirySchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      {
        error: "Inquiry data failed validation.",
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

    // Accept website inquiries only for publicly listed properties.
    const { data: property, error: lookupError } = await supabase
      .from("properties")
      .select("id,property_sponsors!inner(sponsors!inner(active_status))")
      .eq("id", validation.data.property_id)
      .eq("status", "approved")
      .eq("property_sponsors.sponsors.active_status", true)
      .maybeSingle();

    if (lookupError) {
      console.error("Inquiry property lookup failed:", lookupError.code);
      return NextResponse.json(
        { error: "Unable to process inquiry." },
        { status: 500 },
      );
    }

    if (!property) {
      return NextResponse.json(
        { error: "This property is unavailable for inquiries." },
        { status: 404 },
      );
    }

    // Do not request a returned record: inquirers cannot read inquiries.
    const { error } = await supabase
      .from("inquiries")
      .insert(validation.data);

    if (error) {
      console.error("Inquiry insertion failed:", error.code);
      return NextResponse.json(
        { error: "Unable to save inquiry." },
        { status: error.code === "42501" ? 403 : 500 },
      );
    }

    return NextResponse.json(
      { message: "Your inquiry has been sent." },
      {
        status: 201,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "Inquiry service is unavailable." },
      { status: 503 },
    );
  }
}
