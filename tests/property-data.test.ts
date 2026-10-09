import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  PropertyCollectionSchema,
  PropertySchema,
} from "../src/schemas/property-data";

const rawData: unknown = JSON.parse(
  readFileSync(
    "data/generated/properties.raw.json",
    "utf8",
  ),
);

const validCollection =
  PropertyCollectionSchema.parse(rawData);

const validProperty = validCollection[0];

test("accepts a valid property record", () => {
  const result = PropertySchema.safeParse(validProperty);

  assert.equal(result.success, true);
});

test("rejects a property with a missing ID", () => {
  const invalidProperty = structuredClone(
    validProperty,
  ) as Record<string, unknown>;

  delete invalidProperty.property_id;

  const result =
    PropertySchema.safeParse(invalidProperty);

  assert.equal(result.success, false);
});

test("rejects a property with a negative price", () => {
  const invalidProperty = {
    ...validProperty,
    price: -1000,
  };

  const result =
    PropertySchema.safeParse(invalidProperty);

  assert.equal(result.success, false);
});

test("rejects a property with an invalid ZIP code", () => {
  const invalidProperty = {
    ...validProperty,
    zip_code: "ABC12",
  };

  const result =
    PropertySchema.safeParse(invalidProperty);

  assert.equal(result.success, false);
});

test("rejects an unknown property field", () => {
  const invalidProperty = {
    ...validProperty,
    private_owner_note: "Do not expose this field",
  };

  const result =
    PropertySchema.safeParse(invalidProperty);

  assert.equal(result.success, false);
});