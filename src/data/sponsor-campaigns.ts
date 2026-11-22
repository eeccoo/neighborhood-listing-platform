import approvedContentJson from
  "../../content/sponsors/neighborhood-hardware-approved.json";

import {
  getDisplayableSponsorContent,
} from "@/schemas/sponsor-content";

import type { SponsorCandidate } from
  "@/lib/sponsors/select-sponsor";

export const approvedNeighborhoodHardwareContent =
  getDisplayableSponsorContent(
    approvedContentJson,
    new Date(),
  );

export const sponsorCandidates:
  readonly SponsorCandidate[] = [
    {
      id: "sponsor-neighborhood-hardware",
      businessName: "Neighborhood Hardware",
      shortDescription:
        "Fictional local partner offering home-maintenance supplies.",
      destinationUrl:
        "https://example.com/neighborhood-hardware",
      approved: true,
      active: true,
      placement: "search-banner",
      startsAt: "2026-11-21T00:00:00.000Z",
      endsAt: "2027-01-01T00:00:00.000Z",
      zipCodes: ["90026"],
      nearbyZipCodes: ["90012", "90039"],
      priority: 20,
    },
    {
      id: "sponsor-community-repair",
      businessName:
        "Community Repair Cooperative",
      shortDescription:
        "Fictional cooperative sharing general home-repair resources.",
      destinationUrl:
        "https://example.org/community-repair",
      approved: true,
      active: true,
      placement: "search-banner",
      startsAt: "2026-01-01T00:00:00.000Z",
      endsAt: "2027-01-01T00:00:00.000Z",
      zipCodes: ["90012"],
      nearbyZipCodes: ["90026", "90039"],
      priority: 10,
    },
  ];

export const displayableSponsorCandidates:
  readonly SponsorCandidate[] =
    approvedNeighborhoodHardwareContent
      ? sponsorCandidates
          .filter(
            (candidate) =>
              candidate.id ===
              approvedNeighborhoodHardwareContent.sponsorId,
          )
          .map((candidate) => ({
            ...candidate,
            shortDescription:
              approvedNeighborhoodHardwareContent.approvedCopy,
            destinationUrl:
              approvedNeighborhoodHardwareContent.destinationUrl,
            endsAt:
              approvedNeighborhoodHardwareContent.offerEndsAt,
          }))
      : [];

export function findApprovedSponsor(
  sponsorId: string,
  placement: string,
): SponsorCandidate | null {
  return (
    displayableSponsorCandidates.find(
      (candidate) =>
        candidate.id === sponsorId &&
        candidate.placement === placement &&
        candidate.approved &&
        candidate.active,
    ) ?? null
  );
}

export function parseHttpsDestination(
  value: string,
): URL | null {
  try {
    const destination = new URL(value);

    return destination.protocol === "https:"
      ? destination
      : null;
  } catch {
    return null;
  }
}

export function getSafeSponsorDestination(
  sponsorId: string,
  placement: string,
): URL | null {
  const sponsor = findApprovedSponsor(
    sponsorId,
    placement,
  );

  if (!sponsor) {
    return null;
  }

  return parseHttpsDestination(
    sponsor.destinationUrl,
  );
}