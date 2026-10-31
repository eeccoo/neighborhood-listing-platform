"use client";

import Image from "next/image";
import { useState } from "react";
import InquiryForm from "@/components/InquiryForm";
import PropertySponsors from "@/components/PropertySponsors";

export interface Listing {
  id: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
}

export default function PropertyCard({
  property,
  priority = false,
}: {
  property: Listing;
  priority?: boolean;
}) {
  const [isSaved, setIsSaved] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const headingId = `property-${property.id}-heading`;
  const detailsId = `property-${property.id}-details`;
  const focus =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2";

  const price = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(property.price);

  return (
    <article
      aria-labelledby={headingId}
      className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm"
    >
      <Image
        src="/property-home.svg"
        alt={`Property illustration for ${property.address}`}
        width={640}
        height={360}
        priority={priority}
        className="aspect-video w-full bg-slate-100 object-contain"
      />

      <div className="flex flex-1 flex-col p-5">
        <header>
          <h3 id={headingId} className="break-words text-xl font-bold">
            {property.address}
          </h3>
          <p className="mt-3 text-2xl font-bold text-blue-800">
            {price}
          </p>
        </header>

        <ul
          aria-label={`Specifications for ${property.address}`}
          className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-700"
        >
          <li>{property.bedrooms} bedrooms</li>
          <li>{property.bathrooms} bathrooms</li>
          <li>{property.square_feet.toLocaleString()} square feet</li>
        </ul>

        <PropertySponsors propertyId={property.id} address={property.address} />

        <div className="mt-auto flex flex-wrap gap-3 pt-6">
          <button
            type="button"
            aria-pressed={isSaved}
            aria-label={`${isSaved ? "Saved" : "Save property"} at ${property.address}`}
            onClick={() => setIsSaved((saved) => !saved)}
            className={`rounded-lg border border-blue-700 px-4 py-2 font-semibold text-blue-800 hover:bg-blue-50 ${focus}`}
          >
            {isSaved ? "Saved" : "Save property"}
          </button>

          <button
            type="button"
            aria-label={`${detailsOpen ? "Hide" : "View"} details for ${property.address}`}
            aria-expanded={detailsOpen}
            aria-controls={detailsId}
            onClick={() => setDetailsOpen((open) => !open)}
            className={`rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800 ${focus}`}
          >
            {detailsOpen ? "Hide details" : "View details"}
          </button>
        </div>

        {isSaved && (
          <p className="mt-3 text-sm text-slate-600" role="status">
            Saved for this page visit.
          </p>
        )}

        <div id={detailsId} hidden={!detailsOpen}>
          <p className="mt-4 border-t border-slate-200 pt-4 text-slate-700">
            Asking price per square foot:{" "}
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              maximumFractionDigits: 2,
            }).format(property.price / property.square_feet)}
          </p>
        <InquiryForm propertyId={property.id} address={property.address} />
        </div>
      </div>
    </article>
  );
}
