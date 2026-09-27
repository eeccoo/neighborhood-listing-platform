"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import type { PropertyCardProps } from "@/types";

export default function PropertyCard({
  property,
  priority = false,
}: PropertyCardProps) {
  const [isSaved, setIsSaved] = useState(false);

  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(property.price);

  const headingId = `property-${property.id}-title`;

  function handleFavoriteClick() {
    setIsSaved((currentValue) => !currentValue);
  }

  return (
    <article
      aria-labelledby={headingId}
      className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      <Image
        src={property.imagePath}
        alt={`${property.streetAddress}, ${property.city}, ${property.state}`}
        width={640}
        height={360}
        priority={priority}
        className="aspect-video w-full object-cover"
      />

      <div className="flex flex-1 flex-col p-5">
        <h3
          id={headingId}
          className="text-xl font-bold tracking-tight text-slate-950"
        >
          {property.title}
        </h3>

        <address className="mt-2 not-italic text-slate-600">
          {property.streetAddress}, {property.city}, {property.state}
        </address>

        <p className="mt-4 text-2xl font-bold text-blue-800">
          {formattedPrice}
        </p>

        <ul
          aria-label={`Property facts for ${property.streetAddress}`}
          className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-700"
        >
          <li>{property.bedrooms} bedrooms</li>
          <li>{property.bathrooms} bathrooms</li>
          <li>{property.squareFootage.toLocaleString()} square feet</li>
        </ul>

        <div className="mt-auto flex flex-wrap gap-3 pt-6">
          <button
            type="button"
            onClick={handleFavoriteClick}
            aria-pressed={isSaved}
            aria-label={`${isSaved ? "Remove" : "Save"} ${property.title} at ${property.streetAddress} ${
              isSaved ? "from" : "to"
            } favorites`}
            className="rounded-lg border border-blue-700 px-4 py-2 font-semibold text-blue-800 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
          >
            {isSaved ? "Saved" : "Save property"}
          </button>

          <Link
            href={property.detailsUrl}
            className="rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
          >
            View details for {property.streetAddress}
          </Link>
        </div>
      </div>
    </article>
  );
}