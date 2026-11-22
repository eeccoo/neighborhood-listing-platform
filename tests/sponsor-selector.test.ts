import assert from "node:assert/strict";
import test from "node:test";

import {
  parseHttpsDestination,
  sponsorCandidates,
} from "../src/data/sponsor-campaigns";

import {
  selectSponsor,
  type SponsorCandidate,
  type SponsorSelectionContext,
} from "../src/lib/sponsors/select-sponsor";

const context: SponsorSelectionContext = {
  zipCode: "90026",
  placement: "search-banner",
  now: new Date("2026-12-15T12:00:00.000Z"),
  rotationKey: "fixed-seed",
};

function makeSponsor(
  changes: Partial<SponsorCandidate> = {},
): SponsorCandidate {
  return {
    id: "sponsor-a",
    businessName: "Sponsor A",
    shortDescription: "Fictional test sponsor.",
    destinationUrl: "https://example.com",
    approved: true,
    active: true,
    placement: "search-banner",
    startsAt: "2026-01-01T00:00:00.000Z",
    endsAt: "2027-01-01T00:00:00.000Z",
    zipCodes: ["90026"],
    nearbyZipCodes: [],
    priority: 10,
    ...changes,
  };
}

test("selects an exact ZIP before a nearby ZIP", () => {
  const exact = makeSponsor({
    id: "exact",
    priority: 1,
  });

  const nearby = makeSponsor({
    id: "nearby",
    zipCodes: [],
    nearbyZipCodes: ["90026"],
    priority: 100,
  });

  assert.equal(
    selectSponsor(context, [nearby, exact])?.id,
    "exact",
  );
});

test("selects a nearby ZIP match", () => {
  const nearby = makeSponsor({
    id: "nearby",
    zipCodes: [],
    nearbyZipCodes: ["90026"],
  });

  assert.equal(
    selectSponsor(context, [nearby])?.id,
    "nearby",
  );
});

test("rejects an inactive sponsor", () => {
  assert.equal(
    selectSponsor(context, [
      makeSponsor({ active: false }),
    ]),
    null,
  );
});

test("rejects an expired campaign", () => {
  assert.equal(
    selectSponsor(context, [
      makeSponsor({
        endsAt: context.now.toISOString(),
      }),
    ]),
    null,
  );
});

test("resolves ties deterministically", () => {
  const first = makeSponsor({
    id: "tie-a",
    priority: 20,
  });

  const second = makeSponsor({
    id: "tie-b",
    priority: 20,
  });

  const forward = selectSponsor(context, [
    first,
    second,
  ]);

  const reversed = selectSponsor(context, [
    second,
    first,
  ]);

  assert.equal(forward?.id, reversed?.id);
});

test("returns null when no sponsor matches", () => {
  const unmatched = makeSponsor({
    zipCodes: ["10001"],
  });

  assert.equal(
    selectSponsor(context, [unmatched]),
    null,
  );

  assert.equal(selectSponsor(context, []), null);
});

test("rejects unsafe destination URLs", () => {
  assert.equal(
    parseHttpsDestination("http://example.com"),
    null,
  );

  assert.equal(
    parseHttpsDestination("javascript:alert(1)"),
    null,
  );

  assert.equal(
    parseHttpsDestination("not-a-url"),
    null,
  );
});

test("three ZIP contexts are predictable", () => {
  function contextFor(
    zipCode: string,
  ): SponsorSelectionContext {
    return {
      ...context,
      zipCode,
      rotationKey: `demo:${zipCode}`,
    };
  }

  assert.equal(
    selectSponsor(
      contextFor("90026"),
      sponsorCandidates,
    )?.id,
    "sponsor-neighborhood-hardware",
  );

  assert.equal(
    selectSponsor(
      contextFor("90012"),
      sponsorCandidates,
    )?.id,
    "sponsor-community-repair",
  );

  assert.equal(
    selectSponsor(
      contextFor("10001"),
      sponsorCandidates,
    ),
    null,
  );
});

test("includes the exact campaign start boundary", () => {
  const startTime =
    "2026-06-15T12:00:00.000Z";

  const startContext = {
    ...context,
    now: new Date(startTime),
  };

  const result = selectSponsor(startContext, [
    makeSponsor({
      startsAt: startTime,
    }),
  ]);

  assert.equal(result?.id, "sponsor-a");
});

test("rejects unapproved, wrong placement, and inverted dates", () => {
  const candidates = [
    makeSponsor({
      id: "unapproved",
      approved: false,
    }),
    makeSponsor({
      id: "wrong-placement",
      placement: "property-card",
    }),
    makeSponsor({
      id: "inverted-dates",
      startsAt: "2027-01-01T00:00:00.000Z",
      endsAt: "2026-01-01T00:00:00.000Z",
    }),
  ];

  assert.equal(
    selectSponsor(context, candidates),
    null,
  );
});

test("preserves leading zeros in ZIP strings", () => {
  const leadingZeroContext = {
    ...context,
    zipCode: "02138",
  };

  const result = selectSponsor(
    leadingZeroContext,
    [
      makeSponsor({
        id: "leading-zero",
        zipCodes: ["02138"],
      }),
    ],
  );

  assert.equal(result?.id, "leading-zero");
});