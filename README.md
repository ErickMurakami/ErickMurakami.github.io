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
npm run verify                 # sync tests, content checks, types, build, static links
npx playwright install chromium
npm run test:browser           # responsive, axe, keyboard, theme, no-JS checks
```

Linux CI installs browser system dependencies with `npx playwright install --with-deps chromium`. Dependency versions are locked; fonts are self-hosted. Runtime JavaScript is limited to theme initialization and its button; there is no React hydration, backend, external font request or analytics.

## Content and evidence

- `src/content/projects/*.md`: curated case studies. Required frontmatter: `title`, `repo`, `description`, `focus`, `stack`, `order`.
- `src/content/notes/*.md`: genuine technical writing. Required frontmatter: `title`, `description`, `date` (ISO date) and `category`. File names become routes. The index honestly starts empty; no placeholder articles are published.
- `research/projects.json`: public API metadata and inspected source revisions.
- `research/selection.md`: selection rationale and missing information.
- `research/design-system.md`: audit of the original Econolyze implementation.
- `data/github-projects.json`: validated, generated repository metadata only.

The four curated projects are Econolyze (reactive financial workflows), Logistic (domain transitions and after-commit events), Quarkus Rate Limiter (Redis/Lua window algorithms) and Schema per Tenant (JWT-selected PostgreSQL schemas). Claims link to inspected source revisions. Code-level diagrams deliberately show only implemented boundaries. Backend test files were reviewed, not executed here; no benchmarks or production deployment claims are made.

No verified LinkedIn, email address or resume was available. Contact links lead to the verified GitHub profile. Education, employment dates, certifications and achievements have not been invented.

## Add a repository

For an automatic basic listing, make the repository public, owned, non-fork and non-archived; approve its name in `data/publication.json`; add GitHub topic `portfolio`; run `npm run sync`. The weekly/manual workflow can persist the snapshot. No eligible topics were present at initial review, so the automated snapshot starts empty and the four curated studies remain separately available.

For a substantial case study, review the actual code, write Markdown in `src/content/projects`, add pinned evidence and public research metadata, then run validation. Automation never writes technical explanations or overwrites curated content. See [synchronization details](docs/synchronization.md), including failure and removal behavior.

## Delivery remains disabled

Nothing has been published or pushed by this implementation. Repository visibility is unchanged. The validation workflow builds and checks the site; it does not deploy. The Pages workflow has **only `workflow_dispatch`** and requires repository variable **`ENABLE_PAGES_DEPLOYMENT=true`**. Without that explicit opt-in, its jobs are skipped, even when manually triggered. The metadata workflow does not deploy.

When you intentionally decide to publish:

1. Push the reviewed commits to GitHub yourself.
2. In Settings → Pages, select **GitHub Actions** as the build/deployment source. Ensure Pages is available for the repository's chosen visibility; keep it private during development. GitHub's free public Pages option requires an intentionally public source repository.
3. Configure the `github-pages` environment with any desired required reviewers.
4. Add repository Actions variable `ENABLE_PAGES_DEPLOYMENT` with exact value `true`.
5. Manually run **Publish portfolio (opt-in only)** from `main`. It verifies and builds before uploading `dist/` and deploying.
6. Confirm the resulting URL is `https://erickmurakami.github.io/`. There is no repository-name base path for this user site.

To prevent future releases, remove/set the variable to `false`. This does not take down a version already published; unpublishing is a separate intentional GitHub Pages setting.

Canonical URLs, Open Graph PNG, robots.txt, sitemap.xml and `.nojekyll` are included. There are no secrets in the static build. See [verification report](docs/verification.md) for measured results and limits.
