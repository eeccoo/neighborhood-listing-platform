import Link from "next/link";

import SponsorImage from
  "@/components/SponsorImage";
import SponsorImpression from
  "@/components/SponsorImpression";

import { HOUSE_SPONSOR_MESSAGE } from
  "@/lib/sponsors/select-sponsor";

import type { SponsorBannerProps } from
  "@/types";

export default function SponsorBanner({
  sponsor,
  placement,
  pageContext,
  currentTime,
}: SponsorBannerProps) {
  const offerEnd = sponsor
    ? Date.parse(sponsor.offerEndsAt)
    : Number.NaN;

  const contentIsDisplayable =
    sponsor !== null &&
    sponsor.shortDescription.length <= 120 &&
    Number.isFinite(offerEnd) &&
    Date.parse(currentTime) < offerEnd;

  if (!contentIsDisplayable || !sponsor) {
    return (
      <aside
        aria-label="Neighborhood resource information"
        className="rounded-xl border border-slate-300 bg-white p-5 text-slate-900"
      >
        <p className="text-sm font-bold uppercase tracking-wider text-blue-800">
          Neighborhood resource
        </p>

        <p className="mt-2 text-slate-700">
          {HOUSE_SPONSOR_MESSAGE}
        </p>
      </aside>
    );
  }

  const disclosure =
    sponsor.sponsoredLabel ?? "Sponsored";

  const clickUrl =
    `/api/sponsor-click?sponsorId=${encodeURIComponent(
      sponsor.id,
    )}&placement=${encodeURIComponent(placement)}`;

  return (
    <aside
      aria-label={`${disclosure}: ${sponsor.businessName}`}
      className="overflow-hidden rounded-xl border border-amber-300 bg-amber-50 text-slate-900"
    >
      <div className="p-5">
        <p className="text-sm font-bold uppercase tracking-wider text-amber-800">
          {disclosure}
        </p>
      </div>

      <SponsorImage
        src={sponsor.image.src}
        width={sponsor.image.width}
        height={sponsor.image.height}
        alt={sponsor.image.alt}
      />

      <div className="p-5">
        <SponsorImpression
          sponsorId={sponsor.id}
          placement={placement}
          pageContext={pageContext}
        />

        <h2 className="text-xl font-bold">
          {sponsor.businessName}
        </h2>

        <p className="mt-2 max-w-3xl text-slate-700">
          {sponsor.shortDescription}
        </p>

        <Link
          href={clickUrl}
          className="mt-4 inline-flex rounded-lg bg-amber-800 px-4 py-2 font-semibold text-white hover:bg-amber-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-800 focus-visible:ring-offset-2"
        >
          Visit {sponsor.businessName}
        </Link>
      </div>
    </aside>
  );
}