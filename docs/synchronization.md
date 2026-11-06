# Curated GitHub synchronization

`src/content/projects/` is manually curated technical writing. `data/github-projects.json` is a versioned public metadata snapshot; it does not contain source code or technical explanations. Builds never call GitHub. The initial snapshot is empty because no inspected repository has the `portfolio` topic; the four explicitly curated case studies are published independently of topic selection.

To add automatic listings:

1. Make sure the repository is owned by ErickMurakami and already public, not a fork or archived.
2. Add its exact name to `data/publication.json` after reviewing it for publication.
3. Add the `portfolio` topic on GitHub.
4. Run `npm run sync`, or manually trigger **Synchronize public project metadata**. Its weekly schedule runs Mondays at 09:20 UTC (06:20 São Paulo).
5. Commit the snapshot locally. The workflow commits only the snapshot automatically. Builds show approved metadata-only projects on `/projects/`; they do not pretend those projects have a case study.

Removing the topic, approval, or public availability removes an automatic listing after the next successful sync. A failed API request leaves the previous snapshot unchanged and exits unsuccessfully. No stale status is presented as a fresh fetch. To remove information immediately, remove its snapshot entry and build again. Curated case studies are intentional editorial publications: remove their Markdown separately if a source repository becomes private or should no longer be featured. Automated sync never modifies them.

Only the public user-repositories endpoint is called. Every response is filtered again for visibility, owner, approval, fork, archive status and topic. No private endpoint is queried. At most ten pages are fetched, with a timeout and a rate-limit floor; partial or malformed results do not replace a valid snapshot. A temporary file plus rename replaces the snapshot only after validation. Output fields are explicitly projected; tokens, permissions and other API properties are excluded.

`GITHUB_TOKEN` is optional for local synchronization. Never commit it or use a public client environment variable. The workflow token is passed only to the Node process, never to an Astro build or browser. Only the synchronization job has `contents: write`, to commit metadata. Repository rules can block that push; in that case, run synchronization locally and submit the resulting snapshot through the normal review process. This workflow neither enables Pages nor deploys the site.

The six deterministic tests cover publication guards, field projection, invalid metadata, pagination, API/rate-limit failure and atomic preservation/removal behavior. `npm run validate:content` also checks editorial approval and pinned evidence links.
