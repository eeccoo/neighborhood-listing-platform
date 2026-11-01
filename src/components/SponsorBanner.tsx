import Image from "next/image";
import Link from "next/link";

import type { SponsorBannerProps } from "@/types";

export default function SponsorBanner({
  sponsor,
}: SponsorBannerProps) {
  const sponsoredLabel =
    sponsor.sponsoredLabel ?? "Sponsored";

  const disclosureId =
    `sponsor-${sponsor.id}-disclosure`;

  return (
    <aside
      aria-label={`${sponsoredLabel}: ${sponsor.businessName}`}
      className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-slate-900"
    >
      <div className="grid gap-5 md:grid-cols-[20rem_1fr] md:items-center">
        <Image
          src="/sponsor-partner-banner.svg"
          alt={`Illustration accompanying the sponsored message from ${sponsor.businessName}`}
          width={800}
          height={320}
          sizes="(max-width: 767px) calc(100vw - 5.5rem), 320px"
          className="aspect-[5/2] w-full rounded-lg object-cover md:w-80"
        />

        <div>
          <p
            id={disclosureId}
            className="text-sm font-bold uppercase tracking-wider text-amber-800"
          >
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
            aria-describedby={disclosureId}
            className="mt-4 inline-flex rounded-lg bg-amber-800 px-4 py-2 font-semibold text-white hover:bg-amber-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-800 focus-visible:ring-offset-2"
          >
            Visit {sponsor.businessName}
          </Link>
        </div>
      </div>
    </aside>
  );
}