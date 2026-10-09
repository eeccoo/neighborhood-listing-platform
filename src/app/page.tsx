"use client";

import { useState } from "react";

import PropertyCard from "@/components/PropertyCard";
import SearchFilters from "@/components/SearchFilters";
import SponsorBanner from "@/components/SponsorBanner";
import { properties, sponsor } from "@/data/properties";
import type { SearchFilterValues } from "@/types";

export default function Home() {
  const [filters, setFilters] =
    useState<SearchFilterValues>({});

  const filteredProperties = properties.filter(
    (property) => {
      const matchesType =
        filters.propertyType === undefined ||
        property.propertyType === filters.propertyType;

      const matchesPrice =
        filters.minPrice === undefined ||
        property.price >= filters.minPrice;

      const matchesBedrooms =
        filters.bedrooms === undefined ||
        property.bedrooms >= filters.bedrooms;

      return (
        matchesType &&
        matchesPrice &&
        matchesBedrooms
      );
    },
  );

  function handleFilterSubmit(
    submittedFilters: SearchFilterValues,
  ) {
    setFilters(submittedFilters);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950">
      <div className="mx-auto max-w-7xl">
        <header className="max-w-3xl">
          <p className="font-semibold uppercase tracking-widest text-blue-700">
            Welcome to your neighborhood
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Neighborhood Property Listing Platform
          </h1>

          <p className="mt-6 text-lg leading-8 text-slate-600">
            Explore local properties, connect with
            neighborhood sponsors, and use accessible
            search tools.
          </p>
        </header>

        <div className="mt-10">
          <SearchFilters
            onSubmit={handleFilterSubmit}
          />
        </div>

        <div className="mt-8">
          <SponsorBanner sponsor={sponsor} />
        </div>

        <section
          id="listings"
          aria-labelledby="property-listings-heading"
          className="mt-12"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2
              id="property-listings-heading"
              className="text-3xl font-bold tracking-tight"
            >
              Property listings
            </h2>

            <p
              aria-live="polite"
              className="text-slate-600"
            >
              Showing {filteredProperties.length} of{" "}
              {properties.length} properties
            </p>
          </div>

          {filteredProperties.length > 0 ? (
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredProperties.map(
                (property, index) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    priority={index === 0}
                  />
                ),
              )}
            </div>
          ) : (
            <p
              role="status"
              className="mt-6 rounded-lg border border-slate-300 bg-white p-5"
            >
              No properties match the selected filters.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}