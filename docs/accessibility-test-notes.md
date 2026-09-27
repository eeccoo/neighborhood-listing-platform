# Accessibility Test Notes

## Manual Keyboard Test

**Date tested:** September 26, 2026  
**Environment:** Google Chrome at `http://localhost:3000`  
**Input methods:** Tab, Shift+Tab, Enter, and Space only

### Tab Sequence

1. Property type select
2. Minimum price select
3. Minimum bedrooms select
4. Search properties button
5. Visit Neighborhood Hardware link
6. Save Maple Street Craftsman button
7. View details for 124 Maple Street link
8. Save Sunset View Condo button
9. View details for 808 Sunset Avenue link
10. Save Echo Park Townhouse button
11. View details for 451 Lakeview Terrace link

### Results

- Tab moved forward through every interactive control in a logical order.
- Shift+Tab moved backward through the controls.
- Every interactive control displayed a visible focus indicator.
- Enter activated buttons and links.
- Space activated the Save property buttons.
- Each Save property button communicated its selected state.
- Submitting the form without selecting any filters displayed an error message.
- No keyboard traps were encountered.

### Failures Found

No keyboard-access failures were found during this test.

## Responsive Layout Test

The page was inspected using Chrome responsive-design mode.

| Viewport width | Expected result | Actual result |
| --- | --- | --- |
| 375 px | One property card per row | Passed |
| 768 px | Two property cards per row | Passed |
| 1280 px | Three property cards per row | Passed |

No horizontal content overflow or unusable controls were observed at the tested widths.

## Browser Console

No red application errors were observed. Chrome displayed a Next.js performance warning recommending eager or priority loading for the Largest Contentful Paint image. This was not an accessibility failure and will be reviewed separately.

## Lighthouse Accessibility Audit

**Date tested:** September 26, 2026  
**URL tested:** `http://localhost:3000`  
**Mode:** Navigation  
**Device:** Desktop  
**Category:** Accessibility

### Results

- Accessibility score: **100**
- Automated accessibility issues reported: **None**
- Additional items requiring manual review: **10**
- Lighthouse displayed a notice that stored IndexedDB data could affect loading performance.

The stored-data notice was not reported as an accessibility failure. Lighthouse also noted that automated testing detects only a subset of accessibility concerns, so the manual keyboard and responsive tests were retained as separate evidence.

### Verification

The Lighthouse result was compared with the manual keyboard test. Keyboard navigation, visible focus indicators, semantic headings, descriptive control names, explicit form labels, form error messaging, and responsive layouts were manually inspected.

A Lighthouse score of 100 was recorded as automated evidence, but it was not treated as proof of complete WCAG compliance.