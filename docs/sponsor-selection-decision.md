# Contextual Sponsor Selection Decision

## Eligibility Rules

A sponsor is eligible only when:

1. The sponsor is approved and active.
2. Its placement matches the requested placement.
3. The campaign satisfies `startsAt <= now < endsAt`.
4. The property ZIP appears in the exact or approved nearby ZIP list.

The system does not use caller identity, user accounts, IP addresses,
browsing history, inferred income, protected traits, or other sensitive
information.

## Deterministic Selection

Eligible sponsors are ranked in this order:

1. Exact ZIP before nearby ZIP.
2. Higher campaign priority.
3. Stable rotation using `rotationKey:sponsorId`.
4. Sponsor ID as the final tie-breaker.

The clock and rotation key can be fixed during tests, making the result
repeatable and explainable.

## Safe Query and Redirect

The Supabase query selects only approved display and campaign fields.
It does not select internal notes.

The click route accepts only a sponsor ID and placement. It looks up the
approved sponsor on the server and redirects only to its stored HTTPS
destination. A browser-supplied destination URL is never trusted.

## Fallback and Disclosure

If no sponsor is eligible, the interface displays:

> Explore neighborhood resources and housing-support information.

Every eligible sponsor placement displays `Sponsored` adjacent to the
sponsor content.

## Impression Event

The impression event contains only:

- Sponsor ID
- Placement
- Server timestamp
- Coarse page context

It intentionally excludes user ID, IP storage, phone number, email,
exact address, transcript, and protected characteristics.

## Predictable Demonstration

Using the fixed test clock:

| ZIP | Expected result |
| --- | --- |
| 90026 | Neighborhood Hardware |
| 90012 | Community Repair Cooperative |
| 10001 | House fallback message |

## AI Adversarial Review Prompt

> Act as an adversarial tester for this contextual sponsor-selection
> function. Generate boundary cases involving dates, ZIP codes, empty
> data, ties, unapproved records, and unsafe URLs. Do not propose user
> profiling.

Useful cases added to the tests included an exclusive campaign end
timestamp, reversed tie order, empty candidates, unmatched ZIP codes,
inactive records, and unsafe destination protocols.

Suggestions involving identity, click history, inferred demographics,
protected traits, unseeded randomness, or browser-provided redirect
destinations were rejected.