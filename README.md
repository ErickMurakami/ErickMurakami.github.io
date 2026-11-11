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

Linux CI uses Ubuntu 24.04's preinstalled Chromium system libraries and downloads the locked browser with `npx playwright install chromium`. This avoids fetching optional font packages from Ubuntu mirrors during validation. Dependency versions are locked; Inter fonts are self-hosted. Runtime JavaScript handles theme behavior, section navigation, scroll reveals, a project hover cursor and the compact sticky project heading; there is no React hydration, backend, external font request or analytics.

## Navigation and reading

Each language has one main page with Projects, About and Contact sections. Case studies keep dedicated URLs alongside two localized error pages. The Blog menu, listing and article routes appear only when there are published articles in that language. A project title and return link stay in the sticky header, with a smaller title after scrolling. Reduced-motion preferences disable the size transition. Technology logos are served locally from Devicon v2.17.0; the upstream license is included in `public/technologies/LICENSE.txt`.

Case studies start with the project's README and business context, then explain verified implementation details and limits. If a future project has no README, use its actual source and technical context and state the documentation gap.

The homepage separates engineering focus, projects, professional background and contact into numbered sections. Near-black, muted cobalt and grey surfaces blend between chapters, with light-theme equivalents and checked text contrast. A small scroll-driven tilt and fade adds depth without changing native scrolling. The hero emphasizes a music waveform, with a few circuit connections attached to its fixed centre line. Scrolling briefly increases its height by up to 14%, then it settles; motion pauses offscreen and stays static with reduced motion. Groq and Spotify technology labels use local SVGs, with sources and licensing recorded in `public/technologies/SOURCES.md`.

Buttons, links and blue chapter surfaces use a muted grey-and-cobalt mix across the site. The dark slate surfaces are close to `#111540` with less blue saturation, with a main project surface of `#191d30`. Darker buttons keep a visible slate outline; the dot in the EM brand retains the original cobalt. Inner pages share those surfaces: projects and case studies use slate blue, About uses grey, education uses charcoal, and contact uses a deeper slate blue. Articles and certifications inherit their chapter colours when published. Each page fades from the shared header colour into its reading surface, using the matching light palette when selected. The hero waveform pulses from grey-blue to cobalt and back to grey-blue, with staggered bar timing and quieter circuit connections.

Normal homepage section clicks scroll without adding a fragment to the URL. Native anchor links remain available without JavaScript. Desktop uses local, cool-grey SVG cursors: a filled arrow angled toward the upper left, a thin angular eye across project cards, and a smaller beveled hand on clickable controls. The hand's filled area is balanced against the arrow; all three share one renderer and a subtle 120ms fade between states. Hit testing runs on scrolling as well as pointer movement, keeping the eye across the entire card on both the homepage and Projects page. The whole card opens its case study; GitHub controls independently use the hand. Touch devices keep the platform pointer; reduced-motion preferences use static content and the platform pointer. Borderless language and theme controls retain 44px hit areas and keyboard focus outlines. The light/dark toggle keeps its selected state across navigation and refresh, with distinct sun and moon icons.

To preview every homepage section locally, run `npm run preview:content`, then `npm run dev`. This creates clearly labelled mock articles, certifications and courses in both languages. The generated Markdown files are ignored by Git and marked `localOnly: true`, so production builds omit them. `npm run preview:content:clear` removes only unchanged generated fixtures.

The desktop arrow steers separately from its momentum: lateral velocity briefly carries it through turns, like a car drifting, with a bounded trail and a smooth return to rest. While scrolling, it turns up or down. The hand and eye stay aligned with the actual mouse position. Native SVGs provide a fallback before the pointer moves or when animation is unavailable. Direction feedback follows wheel, trackpad and keyboard scrolling; it resets on navigation, hidden tabs and reduced-motion changes.

Cursor shapes share one vector source in `src/data/cursor-shapes.json`; `npm run generate:cursors` rebuilds the native SVGs and hotspots at 28, 32 and 40px. Size follows the screen's CSS resolution, with larger cursors at 1600px and 2400px screen widths; CSS pixels preserve browser and operating-system display scaling. Monitor, zoom and density changes update the size automatically. The drifting arrow uses the same outline, rotates its vector path directly and snaps its position to physical pixels. Websites cannot read the operating system's separate cursor-size preference.

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

The owner authorized the first public release and making only this repository public on 2026-11-06. The validation workflow builds and checks the site; it does not deploy. Validation and Pages builds pin Ubuntu 24.04 to keep browser dependencies on a fixed runner release. The Pages workflow has **only `workflow_dispatch`** and requires repository variable **`ENABLE_PAGES_DEPLOYMENT=true`**. Without that explicit opt-in, its jobs are skipped, even when manually triggered. The metadata workflow does not deploy.

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
