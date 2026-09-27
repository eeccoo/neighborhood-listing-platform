import Link from "next/link";

import type { SponsorBannerProps } from "@/types";

export default function SponsorBanner({
  sponsor,
}: SponsorBannerProps) {
  const sponsoredLabel = sponsor.sponsoredLabel ?? "Sponsored";

  return (
    <aside
      aria-label={`${sponsoredLabel}: ${sponsor.businessName}`}
      className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-slate-900"
    >
      <p className="text-sm font-bold uppercase tracking-wider text-amber-800">
        {sponsoredLabel}
      </p>

      <h2 className="mt-2 text-xl font-bold">
        {sponsor.businessName}
      </h2>

      <p className="mt-2 max-w-3xl text-slate-700">
        {sponsor.shortDescription}
      </p>

      <Link
        href={sponsor.destinationUrl}
        className="mt-4 inline-flex rounded-lg bg-amber-800 px-4 py-2 font-semibold text-white hover:bg-amber-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-800 focus-visible:ring-offset-2"
      >
        Visit {sponsor.businessName}
      </Link>
    </aside>
  );
}