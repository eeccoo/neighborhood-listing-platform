"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";

import PropertyCard, { type Listing } from "@/components/PropertyCard";
import { CreatePropertySchema } from "@/schemas/property";

const ListingsSchema = z.array(
  CreatePropertySchema.extend({ id: z.uuid() }),
);

const focus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2";

export default function Home() {
  const [properties, setProperties] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [minPrice, setMinPrice] = useState(0);
  const [minBedrooms, setMinBedrooms] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const response = await fetch("/api/properties", {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Unable to load listings.");
        }

        const payload = await response.json();
        const validated = ListingsSchema.parse(payload.properties);

        if (!controller.signal.aborted) {
          setProperties(validated);
        }
      } catch {
        if (!controller.signal.aborted) {
          setLoadError("Property listings are temporarily unavailable.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void load();
    return () => controller.abort();
  }, []);

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setMinPrice(Number(values.get("minPrice") || 0));
    setMinBedrooms(Number(values.get("bedrooms") || 0));
  }

  const visible = properties.filter(
    (property) =>
      property.price >= minPrice && property.bedrooms >= minBedrooms,
  );

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950">
      <div className="mx-auto max-w-7xl">
        <header>
          <h1 className="text-4xl font-bold">Neighborhood Property Listings</h1>
          <p className="mt-4 text-lg text-slate-700">
            Explore approved properties supported by active neighborhood sponsors.
          </p>
          <Link
            href="/login"
            className={`mt-5 inline-block rounded underline ${focus}`}
          >
            Property owner sign in
          </Link>
        </header>

        <section
          aria-labelledby="search-heading"
          className="mt-8 rounded-xl border border-slate-300 bg-white p-6"
        >
          <h2 id="search-heading" className="text-2xl font-bold">
            Search properties
          </h2>

          <form onSubmit={applyFilters} className="mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="min-price" className="block font-semibold">
                  Minimum price
                </label>
                <select
                  id="min-price"
                  name="minPrice"
                  className={`mt-2 w-full rounded border border-slate-500 p-3 ${focus}`}
                >
                  <option value="0">Any price</option>
                  <option value="300000">$300,000</option>
                  <option value="500000">$500,000</option>
                  <option value="750000">$750,000</option>
                  <option value="1000000">$1,000,000</option>
                </select>
              </div>

              <div>
                <label htmlFor="min-bedrooms" className="block font-semibold">
                  Minimum bedrooms
                </label>
                <select
                  id="min-bedrooms"
                  name="bedrooms"
                  className={`mt-2 w-full rounded border border-slate-500 p-3 ${focus}`}
                >
                  <option value="0">Any bedroom count</option>
                  <option value="1">1 or more</option>
                  <option value="2">2 or more</option>
                  <option value="3">3 or more</option>
                  <option value="4">4 or more</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className={`mt-4 rounded bg-blue-700 px-5 py-3 font-semibold text-white ${focus}`}
            >
              Search properties
            </button>

            <button
              type="reset"
              onClick={() => {
                setMinPrice(0);
                setMinBedrooms(0);
              }}
              className={`ml-3 mt-4 rounded border border-slate-500 px-5 py-3 ${focus}`}
            >
              Reset filters
            </button>
          </form>
        </section>

        <section
          aria-labelledby="listings-heading"
          aria-busy={isLoading}
          className="mt-10"
        >
          <h2 id="listings-heading" className="text-3xl font-bold">
            Property listings
          </h2>

          {isLoading ? (
            <p role="status" className="mt-5">Loading property listings…</p>
          ) : loadError ? (
            <p role="alert" className="mt-5 text-red-800">{loadError}</p>
          ) : (
            <>
              <p role="status" className="mt-3 text-slate-700">
                Showing {visible.length} of {properties.length} properties
              </p>

              {visible.length > 0 ? (
                <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {visible.map((property, index) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      priority={index === 0}
                    />
                  ))}
                </div>
              ) : (
                <p className="mt-5">No properties match the selected filters.</p>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
