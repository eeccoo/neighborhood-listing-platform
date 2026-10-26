import assert from "node:assert/strict";
import test from "node:test";

import {
  formatSponsorValidationError,
  SponsorInputSchema,
} from "../src/schemas/sponsor-input";

test("accepts a valid HTTPS sponsor destination URL", () => {
  const input = {
    destination_url:
      "https://sponsor.example/offers",
  };

  const result = SponsorInputSchema.safeParse(input);

  assert.equal(result.success, true);

  if (result.success) {
    assert.equal(
      result.data.destination_url,
      "https://sponsor.example/offers",
    );
  }
});

test("rejects a sponsor URL using a raw IP address", () => {
  const input = {
    destination_url:
      "https://127.0.0.1/admin",
  };

  const result = SponsorInputSchema.safeParse(input);

  assert.equal(result.success, false);

  if (result.success) {
    assert.fail(
      "Expected the raw IP sponsor URL to be rejected.",
    );
  }

  assert.deepEqual(
    formatSponsorValidationError(result.error),
    {
      error: "Invalid sponsor input.",
      issues: [
        {
          path: "destination_url",
          message:
            "Sponsor destination URL must use a public DNS hostname, not an IP address.",
        },
      ],
    },
  );
});