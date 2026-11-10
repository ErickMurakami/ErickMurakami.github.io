# Engineering portfolio redesign

The initial audit found an Astro static site with locally hosted Inter, reusable bilingual content, semantic routes, keyboard controls and a light/dark theme. The visual weaknesses were accumulated, conflicting homepage CSS, repeated rounded cards, weak differentiation between content types and a pinned expertise stack that prolonged mobile scrolling. The stack also required scroll geometry calculations and resize handling.

The redesign keeps Astro, all content collections, SEO, translations, resume and social destinations, and GitHub Pages configuration. It adds no dependencies. `engineering.css` supplies shared tokens, editorial project rows, restrained cobalt accents, responsive typography, a timeline and coherent route styling. Superseded homepage CSS was removed from `global.css`.

`CircuitField.astro` is an abstract SVG decoration, not a claimed production topology. Short CSS dash animations travel intermittently on three paths. Hover highlights nodes without pointer tracking. Supported browsers add a small CSS scroll-linked translation. IntersectionObserver pauses signals offscreen; hidden tabs pause them too. Reduced motion disables signals and reveals; content is available without JavaScript. `environment.ts` cleans up observers and listeners on Astro navigation.

Expertise content now follows the technology strip and remains available in full with native scrolling. The old stack synchronization export remains compatible with navigation code. Browser assertions tied to pinned cards, identical card heights and a fixed initial viewport composition were replaced with responsive, accessibility, content and animation lifecycle coverage in `redesign.spec.ts`.

Run `npm run verify` for content, type, build and generated-site checks, then `npm run test:browser` for Chromium checks. Publication remains the repository's existing GitHub Pages workflow; no alternate hosting was introduced.
