import {
  NextRequest,
  NextResponse,
} from "next/server";

import { findApprovedSponsor } from
  "@/data/sponsor-campaigns";

const ALLOWED_CONTEXTS = new Set([
  "property-search:90026",
  "property-search:90012",
  "property-search:90039",
]);

export async function POST(
  request: NextRequest,
) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON." },
      { status: 400 },
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("sponsorId" in body) ||
    !("placement" in body) ||
    !("pageContext" in body) ||
    typeof body.sponsorId !== "string" ||
    typeof body.placement !== "string" ||
    typeof body.pageContext !== "string" ||
    !findApprovedSponsor(
      body.sponsorId,
      body.placement,
    ) ||
    !ALLOWED_CONTEXTS.has(body.pageContext)
  ) {
    return NextResponse.json(
      { error: "Invalid impression event." },
      { status: 400 },
    );
  }

  // No IP, user ID, phone number, or exact address.
  console.info("sponsor_impression", {
    sponsorId: body.sponsorId,
    placement: body.placement,
    timestamp: new Date().toISOString(),
    pageContext: body.pageContext,
  });

  return new NextResponse(null, {
    status: 204,
  });
}