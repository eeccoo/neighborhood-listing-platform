import {
  NextRequest,
  NextResponse,
} from "next/server";

import { getSafeSponsorDestination } from
  "@/data/sponsor-campaigns";

export function GET(request: NextRequest) {
  const sponsorId =
    request.nextUrl.searchParams.get("sponsorId");

  const placement =
    request.nextUrl.searchParams.get("placement");

  if (!sponsorId || !placement) {
    return NextResponse.json(
      {
        error:
          "Sponsor and placement are required.",
      },
      { status: 400 },
    );
  }

  const destination =
    getSafeSponsorDestination(
      sponsorId,
      placement,
    );

  if (!destination) {
    return NextResponse.json(
      {
        error:
          "Approved sponsor destination not found.",
      },
      { status: 404 },
    );
  }

  return NextResponse.redirect(destination, 302);
}