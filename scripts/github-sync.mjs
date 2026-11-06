// @ts-check
import { readFile, writeFile, rename } from "node:fs/promises";
import { pathToFileURL } from "node:url";
/** @typedef {import('../src/lib/github-schema').RepositoryMetadata} RepositoryMetadata */
/** @typedef {import('../src/lib/github-schema').Snapshot} Snapshot */
/** @typedef {import('../src/lib/github-schema').Publication} Publication */
const namePattern = /^[a-zA-Z0-9_.-]{1,100}$/;
/** @param {unknown} input @returns {Publication} */
export function validatePublication(input) {
  const p = /** @type {Publication} */ (input);
  if (
    !p ||
    typeof p.owner !== "string" ||
    !namePattern.test(p.owner) ||
    !Array.isArray(p.approved) ||
    p.approved.some((n) => typeof n !== "string" || !namePattern.test(n)) ||
    new Set(p.approved.map((n) => n.toLowerCase())).size !== p.approved.length
  )
    throw new Error("Invalid publication policy");
  return p;
}
/** @param {unknown} input @param {string} owner @returns {Snapshot} */
export function validateSnapshot(input, owner) {
  const s = /** @type {Snapshot} */ (input);
  if (!s || s.version !== 1 || !Array.isArray(s.projects))
    throw new Error("Unsupported snapshot");
  const seen = new Set();
  for (const r of s.projects) {
    if (
      !r ||
      typeof r.name !== "string" ||
      !namePattern.test(r.name) ||
      seen.has(r.name.toLowerCase()) ||
      r.url !== `https://github.com/${owner}/${r.name}` ||
      !(
        r.description === null ||
        (typeof r.description === "string" && r.description.length <= 2000)
      ) ||
      !(
        r.language === null ||
        (typeof r.language === "string" && r.language.length <= 100)
      ) ||
      !Array.isArray(r.topics) ||
      r.topics.some(
        (t) => typeof t !== "string" || !/^[a-z0-9-]{1,50}$/.test(t),
      ) ||
      !r.topics.includes("portfolio") ||
      typeof r.updatedAt !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T/.test(r.updatedAt) ||
      !Number.isFinite(Date.parse(r.updatedAt))
    )
      throw new Error("Invalid repository metadata");
    seen.add(r.name.toLowerCase());
  }
  return s;
}
/** Public metadata is projected explicitly; never serialize the API response.
 * @param {unknown[]} repos @param {Publication} policy @returns {Snapshot} */
export function selectRepositories(repos, policy) {
  const approved = new Set(policy.approved.map((n) => n.toLowerCase()));
  const projects = [];
  for (const raw of repos) {
    const r = /** @type {Record<string, any>} */ (raw);
    if (
      !r ||
      r.private !== false ||
      r.visibility !== "public" ||
      r.owner?.login?.toLowerCase() !== policy.owner.toLowerCase() ||
      r.fork !== false ||
      r.archived !== false ||
      typeof r.name !== "string" ||
      !approved.has(r.name.toLowerCase()) ||
      !Array.isArray(r.topics) ||
      !r.topics.includes("portfolio")
    )
      continue;
    projects.push({
      name: r.name,
      description: r.description,
      url: r.html_url,
      language: r.language,
      topics: r.topics,
      updatedAt: r.updated_at,
    });
  }
  return validateSnapshot(
    {
      version: 1,
      projects: projects.sort((a, b) => a.name.localeCompare(b.name)),
    },
    policy.owner,
  );
}
/** @param {string} owner @param {typeof fetch} request @param {string | undefined} token */
export async function fetchPublicRepositories(
  owner,
  request = fetch,
  token = undefined,
) {
  /** @type {unknown[]} */ const repos = [];
  for (let page = 1; page <= 10; page++) {
    const response = await request(
      `https://api.github.com/users/${encodeURIComponent(owner)}/repos?type=owner&per_page=100&page=${page}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "erick-portfolio-sync",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        signal: AbortSignal.timeout(20000),
        redirect: "error",
      },
    );
    if (!response.ok)
      throw new Error(`GitHub returned ${response.status}; snapshot preserved`);
    if (Number(response.headers.get("x-ratelimit-remaining") ?? 100) < 2)
      throw new Error("GitHub rate limit nearly exhausted; snapshot preserved");
    const batch = await response.json();
    if (!Array.isArray(batch) || batch.length > 100)
      throw new Error("Invalid GitHub response");
    repos.push(...batch);
    if (batch.length < 100) return repos;
  }
  throw new Error("Pagination limit exceeded; snapshot preserved");
}
/** @param {{ policyPath?:string, snapshotPath?:string, request?:typeof fetch, token?:string }} options */
export async function synchronize({
  policyPath = "data/publication.json",
  snapshotPath = "data/github-projects.json",
  request = fetch,
  token = process.env.GITHUB_TOKEN,
} = {}) {
  const policy = validatePublication(
    JSON.parse(await readFile(policyPath, "utf8")),
  );
  const old = validateSnapshot(
    JSON.parse(await readFile(snapshotPath, "utf8")),
    policy.owner,
  );
  const next = selectRepositories(
    await fetchPublicRepositories(policy.owner, request, token),
    policy,
  );
  if (JSON.stringify(old) === JSON.stringify(next)) return false;
  const temporary = `${snapshotPath}.tmp`;
  await writeFile(temporary, JSON.stringify(next, null, 2) + "\n", {
    mode: 0o600,
  });
  await rename(temporary, snapshotPath);
  return true;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  synchronize()
    .then((changed) =>
      console.log(
        changed
          ? "Public metadata snapshot updated."
          : "Public metadata snapshot unchanged.",
      ),
    )
    .catch(() => {
      console.error(
        "GitHub synchronization failed. Previous snapshot preserved. Check API availability, rate limits and publication policy.",
      );
      process.exitCode = 1;
    });
}
