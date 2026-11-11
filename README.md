# Erick Murakami · Backend Engineering

A static, evidence-based engineering portfolio built with Astro, strict TypeScript, Tailwind CSS and Markdown Content Collections. Econolyze V1 supplies the design foundation: blue hue-240 tokens, Inter, subtle borders, rounded cards, restrained hover states and a translucent sticky header. The portfolio adapts the layout and content to backend engineering.

## Run locally

Use **Node >=22.23.4** (`.node-version` specifies the minimum), then:

```sh
npm ci
npm run dev
```

Open the Local URL printed by Astro (normally `http://localhost:4321`). No GitHub token or live API access is needed. `npm run build` writes static files to `dist/`; `npm run preview` serves that build.

```sh
npm run verify                 # sync/blog tests, content checks, types, build, static links
npx playwright install chromium
npm run test:browser           # responsive, axe, keyboard, theme, no-JS checks
```

Linux CI installs browser system dependencies with `npx playwright install --with-deps chromium`. Dependency versions are locked; fonts are self-hosted. Runtime JavaScript is limited to theme behavior, section navigation and the compact sticky project heading; there is no React hydration, backend, external font request or analytics.

## Navigation and reading

Each language has one main page with Projects, About and Contact sections. Case studies keep dedicated URLs alongside two localized error pages. The Blog menu, listing and article routes appear only when there are published articles in that language. A project title and return link stay in the sticky header, with a smaller title after scrolling. Reduced-motion preferences disable the size transition. Technology logos are served locally from Devicon v2.17.0; the upstream license is included in `public/technologies/LICENSE.txt`.

Case studies start with the project's README and business context, then explain verified implementation details and limits. If a future project has no README, use its actual source and technical context and state the documentation gap.

The homepage separates engineering focus, projects, professional background and contact into numbered sections. Full-width surfaces and divider lines use the existing background, card, secondary and border colors in both themes. Section introductions share the existing scroll-reveal observer; native scrolling, reduced-motion support and no-JavaScript content remain available. Groq and Spotify technology labels use local SVGs, with sources and licensing recorded in `public/technologies/SOURCES.md`.

## Languages

English is served at `/`; Brazilian Portuguese is served at `/pt/`. The language control shows one destination flag: the United Kingdom on Portuguese pages, or Brazil on English pages. Clicking it changes language and swaps the flag, preserving the equivalent route, including project case studies and Home sections. Flags are local SVG assets from flag-icons v7.5.0 with their upstream license included. Each page declares its language, canonical URL and alternate-language links. The sitemap includes both language trees. Portuguese writing lives in `src/content/projects-pt/` and `src/content/notes-pt/`; schemas are shared and validation checks case-study parity and identical source evidence. Articles can be published independently in Portuguese or English. Use the same filename in both collections if you later add a translation.

The Home primary resume download follows the current language. The Contact section offers both original PDFs.

## Content and evidence

- `src/content/projects/*.md`: curated case studies. Required frontmatter: `title`, `repo`, `description`, `focus`, `stack`, `order`.
- `src/content/notes/*.md`: genuine technical writing. Required frontmatter: `title`, `description`, `date` (ISO date) and `category`; optional `draft` controls publication. Portuguese articles go in `src/content/notes-pt/`. Published files become `/blog/<filename>/` or `/pt/blog/<filename>/`. Drafts are excluded from navigation, pages and the sitemap. See [how to write and publish an article](docs/writing.md).
- `research/projects.json`: public API metadata and inspected source revisions.
- `research/selection.md`: selection rationale and missing information.
- `research/design-system.md`: audit of the original Econolyze implementation.
- `data/github-projects.json`: validated, generated repository metadata only.

The five curated projects are Econolyze (reactive financial workflows), Logistic (domain transitions and after-commit events), Quarkus Rate Limiter (Redis/Lua window algorithms), Schema per Tenant (JWT-selected PostgreSQL schemas) and RoastMyTaste (Spotify OAuth2 and structured multilingual AI). Claims link to inspected source revisions. Code-level diagrams deliberately show only implemented boundaries. Backend test files were reviewed, not executed here; no benchmarks or production deployment claims are made.

RoastMyTaste is available at `/projects/roast-my-taste/` and `/pt/projects/roast-my-taste/`. Both case studies share three original repository screenshots stored in `public/projects/roast-my-taste/`, copied unchanged from revision `917bcfc` and checked against their Git blob hashes. Images have localized alternative text and captions, explicit dimensions and lazy loading, and link to the original-size local files. Its publication approval and GitHub `portfolio` topic were already present when the case study was added.

LinkedIn and both original resume PDFs were supplied by the owner on 2026-11-06. The files are served from `public/resume/`, with English and Portuguese downloads. No additional employment or performance claims have been added to the site.

## Add a repository

For an automatic basic listing, make the repository public, owned, non-fork and non-archived; approve its name in `data/publication.json`; add GitHub topic `portfolio`; run `npm run sync`. The weekly/manual workflow can persist the snapshot. Curated studies remain available independently of the metadata snapshot; matching repositories are excluded from the additional-project listing to avoid duplicate cards.

For a substantial case study, review the actual code, write Markdown in `src/content/projects`, add pinned evidence and public research metadata, then run validation. Automation never writes technical explanations or overwrites curated content. See [synchronization details](docs/synchronization.md), including failure and removal behavior.

## GitHub Pages delivery

The owner authorized the first public release and making only this repository public on 2026-11-06. The validation workflow builds and checks the site; it does not deploy. The Pages workflow has **only `workflow_dispatch`** and requires repository variable **`ENABLE_PAGES_DEPLOYMENT=true`**. Without that explicit opt-in, its jobs are skipped, even when manually triggered. The metadata workflow does not deploy.

For the authorized first release and future updates:

1. Push the reviewed commits to GitHub yourself.
2. In Settings → Pages, select **GitHub Actions** as the build/deployment source. Ensure Pages is available for the repository's chosen visibility; keep it private during development. GitHub's free public Pages option requires an intentionally public source repository.
3. Configure the `github-pages` environment with any desired required reviewers.
4. Add repository Actions variable `ENABLE_PAGES_DEPLOYMENT` with exact value `true`.
5. Manually run **Publish portfolio** from `main`. It verifies and builds before uploading `dist/` and deploying.
6. Confirm the resulting URL is `https://erickmurakami.github.io/`. There is no repository-name base path for this user site.

To prevent future releases, remove/set the variable to `false`. This does not take down a version already published; unpublishing is a separate intentional GitHub Pages setting.

Canonical URLs, Open Graph PNG, robots.txt, sitemap.xml and `.nojekyll` are included. There are no secrets in the static build. See [verification report](docs/verification.md) for measured results and limits.

Custom domain preparation: see [the manual migration guide](docs/domain-migration.md).
The default origin remains GitHub Pages. No domain cutover is automatic.

Navigation and home listing limits: [navigation guide](docs/navigation.md).
To add a verified certification: [certifications guide](docs/certifications.md). The section stays hidden until a credential is published.

Education and courses from the supplied resumes: [content guide](docs/education.md).

About now brings together resume-backed professional experience, education and certifications. See [content evidence and remaining gaps](docs/about.md). The header About link always opens the full profile; the home keeps backward-compatible anchors and expandable position details.

Technical education and manually approved professional training are documented in [the education guide](docs/education.md). Empty training sections stay hidden.
