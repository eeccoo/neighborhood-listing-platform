"use client";

import { useState, type FormEvent } from "react";

import type {
  PropertyType,
  SearchFiltersProps,
} from "@/types";

const selectClasses =
  "mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2";

export default function SearchFilters({
  onSubmit,
  initialValues,
}: SearchFiltersProps) {
  const [propertyType, setPropertyType] = useState<PropertyType | "">(
    initialValues?.propertyType ?? "",
  );
  const [minPrice, setMinPrice] = useState(
    initialValues?.minPrice?.toString() ?? "",
  );
  const [bedrooms, setBedrooms] = useState(
    initialValues?.bedrooms?.toString() ?? "",
  );
  const [errorMessage, setErrorMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      propertyType === "" &&
      minPrice === "" &&
      bedrooms === ""
    ) {
      setErrorMessage(
        "Choose at least one search filter before submitting.",
      );
      return;
    }

    setErrorMessage("");

    onSubmit({
      propertyType: propertyType || undefined,
      minPrice:
        minPrice === "" ? undefined : Number(minPrice),
      bedrooms:
        bedrooms === "" ? undefined : Number(bedrooms),
    });
  }

  return (
    <section
      aria-labelledby="search-filters-heading"
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2
        id="search-filters-heading"
        className="text-2xl font-bold text-slate-950"
      >
        Search properties
      </h2>

      <form
        className="mt-5"
        onSubmit={handleSubmit}
        aria-describedby={
          errorMessage ? "search-filter-error" : undefined
        }
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label
              htmlFor="property-type"
              className="font-semibold text-slate-800"
            >
              Property type
            </label>

            <select
              id="property-type"
              name="propertyType"
              value={propertyType}
              onChange={(event) =>
                setPropertyType(
                  event.target.value as PropertyType | "",
                )
              }
              className={selectClasses}
            >
              <option value="">Any property type</option>
              <option value="single-family">
                Single-family home
              </option>
              <option value="condo">Condo</option>
              <option value="townhouse">Townhouse</option>
              <option value="multi-family">
                Multi-family home
              </option>
              <option value="apartment">Apartment</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="minimum-price"
              className="font-semibold text-slate-800"
            >
              Minimum price
            </label>

            <select
              id="minimum-price"
              name="minPrice"
              value={minPrice}
              onChange={(event) =>
                setMinPrice(event.target.value)
              }
              className={selectClasses}
            >
              <option value="">No minimum price</option>
              <option value="300000">$300,000</option>
              <option value="500000">$500,000</option>
              <option value="750000">$750,000</option>
              <option value="1000000">$1,000,000</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="bedroom-count"
              className="font-semibold text-slate-800"
            >
              Minimum bedrooms
            </label>

            <select
              id="bedroom-count"
              name="bedrooms"
              value={bedrooms}
              onChange={(event) =>
                setBedrooms(event.target.value)
              }
              className={selectClasses}
            >
              <option value="">Any bedroom count</option>
              <option value="0">Studio or larger</option>
              <option value="1">1 or more</option>
              <option value="2">2 or more</option>
              <option value="3">3 or more</option>
              <option value="4">4 or more</option>
            </select>
          </div>
        </div>

        {errorMessage && (
          <p
            id="search-filter-error"
            role="alert"
            className="mt-4 font-semibold text-red-700"
          >
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          className="mt-5 rounded-lg bg-blue-700 px-5 py-2.5 font-semibold text-white hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
        >
          Search properties
        </button>
      </form>
    </section>
  );
}