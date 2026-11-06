import assert from "node:assert/strict";
import { access, readFile, writeFile, unlink } from "node:fs/promises";
import { spawnSync } from "node:child_process";
const paths = [
  "src/content/certifications/portfolio-visibility-check.md",
  "src/content/certifications-pt/portfolio-visibility-check.md",
];
const exists = (path) =>
  access(path).then(
    () => true,
    () => false,
  );
const read = (path) => readFile(path, "utf8");
function build() {
  for (const command of ["build", "validate:site"]) {
    const result = spawnSync("npm", ["run", command], { encoding: "utf8" });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  }
}
const fixture = (draft, localOnly = false) =>
  `---\ntitle: "Temporary QA credential"\nissuer: "QA fixture"\ndate: 2026-01-01\ncredentialUrl: "https://example.org/credential"\ndraft: ${draft}\nlocalOnly: ${localOnly}\n---\n`;
for (const path of paths) assert.equal(await exists(path), false);
const created = [];
try {
  build();
  const baseline = await Promise.all(
    ["", "pt/"].map((prefix) =>
      exists(`dist/${prefix}certifications/index.html`),
    ),
  );
  for (const path of paths) {
    await writeFile(path, fixture(true), { flag: "wx" });
    created.push(path);
  }
  for (const [draft, localOnly] of [
    [true, false],
    [false, true],
  ]) {
    for (const path of paths) await writeFile(path, fixture(draft, localOnly));
    build();
    for (const prefix of ["", "pt/"])
      assert.ok(
        !(await read(`dist/${prefix}index.html`)).includes(
          "Temporary QA credential",
        ),
      );
    assert.deepEqual(
      await Promise.all(
        ["", "pt/"].map((prefix) =>
          exists(`dist/${prefix}certifications/index.html`),
        ),
      ),
      baseline,
    );
  }
  await writeFile(paths[1], fixture(false));
  build();
  assert.ok(
    !(await read("dist/pt/index.html")).includes('href="/pt/#certifications"'),
  );
  assert.ok(
    !(await read("dist/pt/projects/index.html")).includes(
      'href="/pt/certifications/"',
    ),
  );
  const ptPage = await read("dist/pt/certifications/index.html");
  assert.ok(ptPage.includes("Temporary QA credential"));
  assert.ok(!/rel="alternate"\s+hreflang="en"/.test(ptPage));
  assert.match(await read("dist/sitemap.xml"), /\/pt\/certifications\//);
  await writeFile(paths[0], fixture(false));
  build();
  assert.ok(
    !(await read("dist/index.html")).includes('href="/#certifications"'),
  );
  assert.match(
    await read("dist/certifications/index.html"),
    /href="\/pt\/certifications\/"/,
  );
  assert.match(
    await read("dist/pt/certifications/index.html"),
    /hreflang="en"/,
  );
  console.log(
    "Certifications passed: drafts/local-only excluded, conditional routes/menu/sitemap, independent languages, verified credential links.",
  );
} finally {
  for (const path of created) await unlink(path);
  build();
}
