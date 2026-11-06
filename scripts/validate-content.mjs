import { readFile, readdir } from "node:fs/promises";
import { validatePublication, validateSnapshot } from "./github-sync.mjs";
const policy = validatePublication(
  JSON.parse(await readFile("data/publication.json", "utf8")),
);
const snapshot = validateSnapshot(
  JSON.parse(await readFile("data/github-projects.json", "utf8")),
  policy.owner,
);
if (snapshot.projects.some((r) => !policy.approved.includes(r.name)))
  throw new Error("Snapshot contains an unapproved repository");
const research = JSON.parse(await readFile("research/projects.json", "utf8"));
const required = [
  "Overview",
  "Problem",
  "Architecture",
  "Key technical decisions",
  "Implementation details",
  "Trade-offs",
  "Testing and quality",
  "Improvements",
  "Source evidence",
];
for (const file of await readdir("src/content/projects")) {
  if (!file.endsWith(".md")) continue;
  const body = await readFile(`src/content/projects/${file}`, "utf8");
  const name = JSON.parse(body.match(/^repo: (.+)$/m)?.[1] ?? "null");
  const evidence = research.find((r) => r.name === name && r.public === true);
  if (!evidence || !policy.approved.includes(name))
    throw new Error(`Unapproved curated project: ${file}`);
  for (const heading of required)
    if (!body.includes(`## ${heading}\n`))
      throw new Error(`Missing ${heading}: ${file}`);
  if (
    !body.includes(
      `https://github.com/${policy.owner}/${name}/blob/${evidence.revision}/`,
    )
  )
    throw new Error(`Missing pinned source: ${file}`);
}
console.log(
  "Publication policy, metadata snapshot and curated evidence validated.",
);
