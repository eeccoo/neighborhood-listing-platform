export type SponsorPlacement =
  | "search-banner"
  | "property-card";

export interface SponsorSelectionContext {
  zipCode: string;
  placement: SponsorPlacement;
  now: Date;
  rotationKey: string;
}

export interface SponsorCandidate {
  id: string;
  businessName: string;
  shortDescription: string;
  destinationUrl: string;
  approved: boolean;
  active: boolean;
  placement: SponsorPlacement;
  startsAt: string;
  endsAt: string;
  zipCodes: readonly string[];
  nearbyZipCodes: readonly string[];
  priority: number;
}

interface RankedCandidate {
  candidate: SponsorCandidate;
  geographyRank: number;
  rotationRank: number;
}

function stableHash(value: string): number {
  let hash = 2166136261;

  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function rankCandidate(
  context: SponsorSelectionContext,
  candidate: SponsorCandidate,
): RankedCandidate | null {
  const startsAt = Date.parse(candidate.startsAt);
  const endsAt = Date.parse(candidate.endsAt);
  const now = context.now.getTime();

  if (
    !candidate.approved ||
    !candidate.active ||
    candidate.placement !== context.placement ||
    !Number.isFinite(startsAt) ||
    !Number.isFinite(endsAt) ||
    now < startsAt ||
    now >= endsAt
  ) {
    return null;
  }

  const exactZip = candidate.zipCodes.includes(
    context.zipCode,
  );

  const nearbyZip =
    candidate.nearbyZipCodes.includes(
      context.zipCode,
    );

  if (!exactZip && !nearbyZip) {
    return null;
  }

  return {
    candidate,
    geographyRank: exactZip ? 0 : 1,
    rotationRank: stableHash(
      `${context.rotationKey}:${candidate.id}`,
    ),
  };
}

export function selectSponsor(
  context: SponsorSelectionContext,
  candidates: readonly SponsorCandidate[],
): SponsorCandidate | null {
  const eligible = candidates
    .map((candidate) =>
      rankCandidate(context, candidate),
    )
    .filter(
      (candidate): candidate is RankedCandidate =>
        candidate !== null,
    );

  eligible.sort((left, right) => {
    return (
      left.geographyRank - right.geographyRank ||
      right.candidate.priority -
        left.candidate.priority ||
      left.rotationRank - right.rotationRank ||
      left.candidate.id.localeCompare(
        right.candidate.id,
      )
    );
  });

  return eligible[0]?.candidate ?? null;
}

export const HOUSE_SPONSOR_MESSAGE =
  "Explore neighborhood resources and housing-support information.";