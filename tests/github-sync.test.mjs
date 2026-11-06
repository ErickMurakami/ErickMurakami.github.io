import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  selectRepositories,
  validateSnapshot,
  validatePublication,
  fetchPublicRepositories,
  synchronize,
} from "../scripts/github-sync.mjs";
const policy = { owner: "ErickMurakami", approved: ["Example"] };
const repo = {
  name: "Example",
  html_url: "https://github.com/ErickMurakami/Example",
  description: "Example",
  language: "Java",
  topics: ["portfolio"],
  updated_at: "2026-11-06T12:00:00Z",
  private: false,
  visibility: "public",
  owner: { login: "ErickMurakami" },
  fork: false,
  archived: false,
};
test("publication requires public ownership, topic and approval", () => {
  assert.equal(selectRepositories([repo], policy).projects.length, 1);
  for (const patch of [
    { private: true },
    { visibility: "private" },
    { owner: { login: "another" } },
    { topics: [] },
    { name: "Unapproved" },
    { fork: true },
    { archived: true },
  ])
    assert.equal(
      selectRepositories([{ ...repo, ...patch }], policy).projects.length,
      0,
    );
});
test("only approved metadata fields are serialized", () => {
  const result = selectRepositories(
    [{ ...repo, token: "secret", permissions: { admin: true } }],
    policy,
  );
  assert.ok(!JSON.stringify(result).includes("secret"));
  assert.equal(Object.keys(result.projects[0]).length, 6);
});
test("rejects invalid URLs, dates, duplicates, oversized data and schema versions", () => {
  const valid = selectRepositories([repo], policy);
  for (const patch of [
    { url: "https://evil.example" },
    { updatedAt: "invalid" },
    { description: "a".repeat(2001) },
    { topics: ["portfolio", "INVALID"] },
  ])
    assert.throws(() =>
      validateSnapshot(
        { version: 1, projects: [{ ...valid.projects[0], ...patch }] },
        policy.owner,
      ),
    );
  assert.throws(() =>
    validateSnapshot({ version: 2, projects: [] }, policy.owner),
  );
  assert.throws(() =>
    validateSnapshot(
      { version: 1, projects: [valid.projects[0], valid.projects[0]] },
      policy.owner,
    ),
  );
  assert.throws(() => validatePublication({ owner: "../bad", approved: [] }));
});
test("paginates without trusting external next URLs", async () => {
  let calls = 0;
  const request = async (url) => {
    calls++;
    assert.ok(String(url).startsWith("https://api.github.com/users/"));
    return new Response(
      JSON.stringify(calls === 1 ? Array(100).fill(repo) : [repo]),
    );
  };
  assert.equal(
    (await fetchPublicRepositories(policy.owner, request)).length,
    101,
  );
  assert.equal(calls, 2);
});
test("API errors, malformed responses and low rate limits reject", async () => {
  for (const response of [
    new Response("", { status: 403 }),
    new Response("", { status: 500 }),
    new Response("{}"),
    new Response("[]", { headers: { "x-ratelimit-remaining": "0" } }),
  ])
    await assert.rejects(
      fetchPublicRepositories(policy.owner, async () => response),
    );
});
test("failed sync leaves last snapshot byte-for-byte intact; success removes unavailable repos", async () => {
  const dir = await mkdtemp(join(tmpdir(), "portfolio-sync-"));
  const policyPath = join(dir, "policy.json");
  const snapshotPath = join(dir, "snapshot.json");
  await writeFile(policyPath, JSON.stringify(policy));
  const old = JSON.stringify(selectRepositories([repo], policy));
  await writeFile(snapshotPath, old);
  await assert.rejects(
    synchronize({
      policyPath,
      snapshotPath,
      request: async () => {
        throw new Error("offline");
      },
    }),
  );
  assert.equal(await readFile(snapshotPath, "utf8"), old);
  assert.equal(
    await synchronize({
      policyPath,
      snapshotPath,
      request: async () => new Response("[]"),
    }),
    true,
  );
  assert.deepEqual(JSON.parse(await readFile(snapshotPath, "utf8")), {
    version: 1,
    projects: [],
  });
  assert.equal(
    await synchronize({
      policyPath,
      snapshotPath,
      request: async () => new Response("[]"),
    }),
    false,
  );
});
