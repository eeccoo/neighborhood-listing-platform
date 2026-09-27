# AI Collaboration Log

| Tool | Prompt | Output used | Output rejected | Verification | Commit |
| --- | --- | --- | --- | --- | --- |
| ChatGPT | In plain language, explain the proposed technology stack for a neighborhood property listing platform using Next.js App Router, TypeScript, Tailwind CSS, GitHub, and Vercel. Explain the purpose of each tool, how they work together, and why this stack is appropriate for a beginner. Do not include secrets or invent command results. | Used the explanations that Next.js organizes pages and layouts, TypeScript detects mistakes, Tailwind supplies styling utilities, GitHub records project history, and Vercel hosts the application. | No generated code was used because this prompt requested only a plain-language explanation. | Compared the explanation with the official documentation and tested the stack locally. | Set up Next.js project foundation |
| Gemini | In plain language, explain the proposed technology stack for a neighborhood property listing platform using Next.js App Router, TypeScript, Tailwind CSS, GitHub, and Vercel. Explain the purpose of each tool, how they work together, and why this stack is appropriate for a beginner. Do not include secrets or invent command results. | Used the property-price example to explain how TypeScript can identify missing data fields. Also used its descriptions of Next.js, Tailwind CSS, and GitHub. | Rejected the statement that Vercel publishes whenever code is saved. A connected Vercel project normally deploys after changes are pushed to GitHub, not merely saved locally. | Compared the response with ChatGPT and the documented GitHub-to-Vercel workflow. | Set up Next.js project foundation |
| Google AI Studio | Act as a senior teaching assistant. Propose a minimal Next.js App Router, TypeScript, and Tailwind CSS starter for a neighborhood property platform. Include terminal commands, a short file plan, accessibility requirements, and a verification checklist. Do not provide a giant code dump or use secrets. | Used the recommended page structure, three feature areas, semantic headings, responsive layout, focus checks, screen-reader checks, and build verification. | Did not directly copy the entire generated application. The assignment required a minimal app shell and asked for a plan rather than a giant code dump. | Manually inspected the page and browser console. Both npm run lint and npm run build completed successfully. | Add accessible neighborhood app shell |

## Comparison Notes

1. Gemini used a property-specific example about a missing price field, while ChatGPT described TypeScript error detection more generally.
2. ChatGPT correctly connected deployment with changes being pushed to GitHub. Gemini’s wording suggested that merely saving code would publish an update, so that wording was rejected.
3. Google AI Studio emphasized accessibility checks such as heading order, keyboard focus, screen-reader behavior, and responsive reflow.

## Reusable Components: Semantic and Accessibility Review

### ChatGPT Semantic Review

**Prompt:**

> Review this React property-listing interface for semantic HTML, WCAG-oriented keyboard access, responsive behavior, and TypeScript safety. Return: issue, why it matters, smallest change, and a manual test. Do not claim compliance from code alone.

**Useful output accepted:**

- The address-only property image alternative did not adequately explain what the image represented.
- ChatGPT recommended describing the image truthfully without implying that the reusable SVG was a real property photograph.
- The alternative text was changed from an address-only value to a dynamic description:
  `Illustration representing [property title] at [street address], [city], [state]`.
- ChatGPT recommended preserving the logical `h1` → `h2` → `h3` heading hierarchy.
- ChatGPT recommended keeping each `<article>` noninteractive instead of making the complete card clickable.

**Output rejected:**

- No complete AI-generated component replacement was accepted.
- Making the entire card clickable was rejected because the card already contains separate Save and View details controls. A clickable container could create confusing nested interactions.
- Automated accessibility results were not accepted as proof of WCAG compliance.

**Verification:**

- The rendered `<img>` contained the updated dynamic alternative text.
- Property images continued to render.
- The page returned `GET / 200`.
- The existing keyboard tab order and visible focus styles remained functional.
- Lighthouse and manual keyboard results were retained as separate forms of evidence.

**Related commit:** `b555a02`

### Gemini Accessibility Review

**Prompt:**

> Review the following React components for WCAG-oriented keyboard accessibility, accessible names, form labeling, error messaging, heading structure, responsive behavior, and TypeScript safety. Return a table containing issue, why it matters, smallest change, and manual test. Separate confirmed code issues from optional improvements. Do not claim WCAG compliance from code alone. Do not rewrite the entire components or invent browser-test results.

**Useful output accepted:**

- Gemini identified a label-in-name mismatch on the Save property toggle. When selected, the visible text said `Saved`, but the accessible name began with `Remove`.
- The accessible name was corrected so it begins with the visible text in both states while `aria-pressed` communicates the toggle state.
- Gemini identified that the sponsor `<aside>` landmark was named only with the business name.
- The aside now has a dynamic accessible name in the format `Sponsored: [business name]`.
- The inaccurate phrase `sponsor website` was removed from the internal sponsor link. Its visible text, `Visit [business name]`, supplies its accessible name.

**Output rejected:**

- Automatic focus movement to the form error was not added because the manual test did not demonstrate an announcement or navigation failure, and forced focus can interrupt expected navigation.
- Empty image alt text was rejected because the assignment requires purposeful dynamic alternative text and the current image conveys listing context.
- External-link disclosure was rejected because the current sponsor destination is an internal page destination.
- A configurable heading-level property was rejected because the current page deliberately maintains an `h1` → `h2` → `h3` hierarchy.
- State synchronization for changing `initialValues` was rejected because the current parent does not dynamically replace those values after mounting.
- A fieldset and legend were treated as optional because each select already has an explicit visible label and the form has a descriptive heading.

**Verification:**

- The Save property control retained keyboard operation using Enter and Space.
- The control changed visibly between `Save property` and `Saved`.
- Its visible focus ring remained present.
- The sponsor link remained keyboard accessible and visibly focused.
- The page returned `GET / 200`.
- No red application errors appeared during the browser test.

**Related commit:** `b555a02`

### Review Decision

AI output was treated as draft feedback. Suggestions were accepted only when they addressed the implemented code and could be checked against browser behavior. Unsupported, unnecessary, or assignment-conflicting recommendations were documented and rejected.