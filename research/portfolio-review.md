# Portfolio presentation review

## Changes and rationale

- **Hero:** the API → business rules → data diagram described almost any backend.
  Replaced it with an editorial Econolyze preview: payment recording and balance
  mutation within the reactive transaction, plus the outstanding rollback and
  concurrency tests. Its implementation link points to the same inspected
  revision as the case study (`f849783`, TransactionService lines 92–123).
  This is an explanation of code, not a claim that the financial invariants are
  already proven by tests. Removed the diagram's glow and pseudo-technical labels.
- **Cards:** removed ordinal “01 / CASE STUDY” labels and identical layers icons.
  Order is still curated through collection metadata; the number was not useful
  navigation. Retained focus labels, domain descriptions, relevant stack logos,
  explicit source links and case-study links. Descriptions now identify the
  domain and one implemented mechanism instead of listing abstract concerns.
- **Copy:** removed the hero's repeated technology caption and footer stack list;
  retained the introduction, technology strip and project-specific stacks because
  they serve different reading contexts. Removed duplicate Projects/About/Contact
  eyebrows. About now connects the projects through data changes and failure
  handling, without implying employment or production experience.
- **Translations:** mirrored these changes in English and Portuguese. Technical
  names, existing routes and evidence links remain unchanged.

## Intentionally preserved

Econolyze surfaces, dark/light tokens (including the requested white/black body
text), blue interactions, Inter, technology logos, responsive grids, semantic
headings, keyboard focus, reduced motion and sticky project reading header.
Case-study bodies and their source links are unchanged. RabbitMQ after-commit
limitations, reactive persistence, transaction consistency, Redis algorithms and
tenant isolation retain their technical detail. GitHub synchronization and
Markdown article publication behavior remain intact; the local test is excluded.

## Remaining limits

This is a source-backed portfolio, not proof of backend production operation.
Backend test suites and benchmarks were not run. Case studies retain their
explicit security, concurrency and delivery gaps. The hero highlights one
project; the gallery supplies breadth. There are no authored published articles
or invented employment claims to fill empty sections.

Domain preparation is separate from presentation: see
[the migration guide](../docs/domain-migration.md). No deployment or domain
cutover is part of this review.

## Validation

- `npm run verify`: six synchronization tests, article publication scenarios,
  content/evidence validation, strict Astro checks and production build passed.
- `npm run test:browser`: 13 passed, covering both languages, dark/light themes,
  responsive layouts, axe accessibility checks, keyboard navigation, no-JavaScript
  reading, reduced motion, project header, flags and conditional blog visibility.
- Inspected rendered desktop/mobile screenshots in both themes and languages.
- Built and validated with `PORTFOLIO_SITE_URL=https://erickkami.dev`, then rebuilt
  and validated the default github.io origin. Both produced 12 valid HTML routes.
- No deployment, push, DNS change or GitHub Pages settings change performed.
