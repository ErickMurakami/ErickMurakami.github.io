import raw from "../../data/github-projects.json";
import publication from "../../data/publication.json";
import {
  validateSnapshot,
  validatePublication,
} from "../../scripts/github-sync.mjs";
const policy = validatePublication(publication);
export const githubProjects = validateSnapshot(
  raw,
  policy.owner,
).projects.filter((project) => policy.approved.includes(project.name));
