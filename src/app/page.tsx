"use client";

import { useEffect, useState } from "react";

import PropertyCard from "@/components/PropertyCard";
import SearchFilters from "@/components/SearchFilters";
import SponsorBanner from "@/components/SponsorBanner";
import { sponsor } from "@/data/properties";
import type {
  Property,
  SearchFilterValues,
} from "@/types";

interface PropertyApiRecord {
  id: string;
  title: string;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  property_type: Property["propertyType"];
  image_path: string;
  details_url: string;
  amenities: string[];
  created_at: string;
}

interface PropertyApiResponse {
  properties: PropertyApiRecord[];
}

function mapApiProperty(
  property: PropertyApiRecord,
): Property {
  return {
    id: property.id,
    title: property.title,
    streetAddress: property.street_address,
    city: property.city,
    state: property.state,
    price: Number(property.price),
    bedrooms: property.bedrooms,
    bathrooms: Number(property.bathrooms),
    squareFootage: property.square_feet,
    imagePath: property.image_path,
    detailsUrl: property.details_url,
    propertyType: property.property_type,
  };
}

export default function Home() {
  const [properties, setProperties] = useState<Property[]>(
    [],
  );
  const [filters, setFilters] =
    useState<SearchFilterValues>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<
    string | null
  >(null);

  useEffect(() => {
    const abortController = new AbortController();

    async function loadProperties() {
      try {
        setIsLoading(true);
        setLoadError(null);

        const response = await fetch("/api/properties", {
          cache: "no-store",
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error("Property request failed.");
        }

        const payload =
          (await response.json()) as PropertyApiResponse;

        setProperties(
          payload.properties.map(mapApiProperty),
        );
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        setLoadError(
          "Property listings are temporarily unavailable.",
        );
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadProperties();

    return () => {
      abortController.abort();
    };
  }, []);

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
          aria-busy={isLoading}
          className="mt-12"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2
              id="property-listings-heading"
              className="text-3xl font-bold tracking-tight"
            >
              Property listings
            </h2>

            {!isLoading && !loadError && (
              <p
                aria-live="polite"
                className="text-slate-600"
              >
                Showing {filteredProperties.length} of{" "}
                {properties.length} properties
              </p>
            )}
          </div>

          {isLoading ? (
            <p
              role="status"
              className="mt-6 rounded-lg border border-slate-300 bg-white p-5"
            >
              Loading property listings…
            </p>
          ) : loadError ? (
            <p
              role="alert"
              className="mt-6 rounded-lg border border-red-300 bg-red-50 p-5 text-red-900"
            >
              {loadError}
            </p>
          ) : filteredProperties.length > 0 ? (
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