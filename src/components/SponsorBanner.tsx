import Link from "next/link";

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
}: SponsorBannerProps) {
  if (!sponsor) {
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
      className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-slate-900"
    >
      <p className="text-sm font-bold uppercase tracking-wider text-amber-800">
        {disclosure}
      </p>

      <SponsorImpression
        sponsorId={sponsor.id}
        placement={placement}
        pageContext={pageContext}
      />

      <h2 className="mt-2 text-xl font-bold">
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
    </aside>
  );
}