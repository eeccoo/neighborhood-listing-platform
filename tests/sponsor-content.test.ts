import assert from "node:assert/strict";
import test from "node:test";

import approvedContent from
  "../content/sponsors/neighborhood-hardware-approved.json";

import {
  ApprovedSponsorContentSchema,
  getDisplayableSponsorContent,
} from "../src/schemas/sponsor-content";

test("accepts the human-approved sponsor record", () => {
  const result =
    ApprovedSponsorContentSchema.safeParse(
      approvedContent,
    );

  assert.equal(result.success, true);
});

test("approved copy stays within 120 characters", () => {
  assert.ok(
    approvedContent.approvedCopy.length <= 120,
  );
});

test("rejects draft content from display", () => {
  const draft = {
    ...approvedContent,
    status: "draft",
  };

  assert.equal(
    ApprovedSponsorContentSchema.safeParse(draft)
      .success,
    false,
  );
});

test("rejects copy longer than 120 characters", () => {
  const tooLong = {
    ...approvedContent,
    approvedCopy: "A".repeat(121),
  };

  assert.equal(
    ApprovedSponsorContentSchema.safeParse(tooLong)
      .success,
    false,
  );
});

test("hides an expired approved offer", () => {
  const afterExpiration = new Date(
    "2027-01-01T00:00:00.000Z",
  );

  assert.equal(
    getDisplayableSponsorContent(
      approvedContent,
      afterExpiration,
    ),
    null,
  );
});

test("displays approved content before expiration", () => {
  const beforeExpiration = new Date(
    "2026-12-31T23:59:59.999Z",
  );

  assert.ok(
    getDisplayableSponsorContent(
      approvedContent,
      beforeExpiration,
    ),
  );
});

test("rejects an image with the wrong aspect ratio", () => {
  const wrongRatio = {
    ...approvedContent,
    image: {
      ...approvedContent.image,
      width: 1000,
      height: 1000,
    },
  };

  assert.equal(
    ApprovedSponsorContentSchema.safeParse(
      wrongRatio,
    ).success,
    false,
  );
});

test("rejects an insecure destination", () => {
  const insecure = {
    ...approvedContent,
    destinationUrl: "http://example.com",
  };

  assert.equal(
    ApprovedSponsorContentSchema.safeParse(
      insecure,
    ).success,
    false,
  );
});