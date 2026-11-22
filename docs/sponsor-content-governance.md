# Sponsor Content Governance and Performance

## Approval Workflow

Content moves through these states:

- `draft`: Raw AI output; never displayed.
- `approved`: Human-reviewed against the factual brief and eligible for
  display.
- `rejected`: Contains unsupported, unsafe, discriminatory, urgent, or
  prohibited language.
- `expired`: The offer end date has passed and the application must show
  the house fallback.

The raw model variants are stored separately from the approved JSON.
The application imports only the approved record.

## Current Approval

- Sponsor: Neighborhood Hardware
- Selected variant: Variant 2
- Status: Approved
- Approver: Giovanni Clara
- Approval date: November 21, 2026
- Expiration: January 1, 2027
- Maximum length: 120 characters

## Asset Optimization

| Asset | Dimensions | Publicly served | Size |
| --- | ---: | --- | ---: |
| Original source SVG | 2400×1350 | No | 1,156 bytes |
| Optimized derivative SVG | 1200×675 | Yes | 702 bytes |

The derivative is approximately 39% smaller. Both files retain a 16:9
aspect ratio. Explicit image dimensions and an aspect-ratio container
prevent layout movement.

## Performance Comparison

| Measurement | Before | After |
| --- | ---: | ---: |
| Lighthouse performance | 100 | Pending preview |
| Largest Contentful Paint | 0.6 s | Pending preview |
| Cumulative Layout Shift | 0 | Pending preview |
| Sponsor public image | No sponsor image | 702 bytes |

The baseline was measured on the deployed `main` application using
Chrome Lighthouse Desktop navigation mode. The after measurement will
use the pull-request Vercel preview with the same Lighthouse settings.

## Slow and Missing Image Verification

- Chrome Slow 3G displayed the amber loading placeholder.
- The 16:9 sponsor area retained its dimensions while loading.
- Content below the image did not shift.
- A deliberately missing image displayed `Sponsor image unavailable`.
- The approved image path was restored after the test.

## Content Correction and Unpublishing

1. A factual correction request is reported to the repository
   maintainer.
2. Giovanni Clara or an authorized team maintainer compares the claim
   with the approved factual brief.
3. If the claim is unsupported, set its status to `rejected` or
   `expired`, or remove it from the approved record immediately.
4. The application then displays the house fallback instead of the
   sponsor claim.
5. Correct the factual brief first, generate new draft variants, and
   repeat human approval before republishing.
6. Record the correction, reviewer, date, verification, and commit in
   `docs/ai-log.md`.
7. Push the correction through a reviewed pull request and verify the
   deployed preview.

The repository maintainer has authority to unpublish a claim. No AI
tool may approve or publish sponsor copy.