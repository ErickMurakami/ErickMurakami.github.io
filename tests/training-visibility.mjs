import assert from "node:assert/strict";
import { access, readFile, writeFile, unlink } from "node:fs/promises";
import { spawnSync } from "node:child_process";
const files = [
  "src/content/learning/portfolio-training-qa-en.md",
  "src/content/learning/portfolio-training-qa-pt.md",
];
const read = (path) => readFile(path, "utf8");
const exists = (path) =>
  access(path).then(
    () => true,
    () => false,
  );
const created = [];
function build() {
  for (const command of ["build", "validate:site"]) {
    const result = spawnSync("npm", ["run", command], { encoding: "utf8" });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  }
}
function fixture(locale, approved, draft) {
  return `---\nlocale: ${locale}\nkind: course\ntitle: "Temporary training QA fixture"\ninstitution: "Local QA provider"\narea: "Backend architecture"\nstatus: ${locale === "en" ? "completed" : "in-progress"}\n${locale === "en" ? 'completionDate: 2026-01-01\ncertificateUrl: "https://example.org/qa-course"\n' : ""}approved: ${approved}\ndraft: ${draft}\n---\n`;
}
for (const file of files) assert.equal(await exists(file), false);
try {
  build();
  for (const prefix of ["", "pt/"])
    assert.ok(
      !(await read(`dist/${prefix}about/index.html`)).includes('id="training"'),
    );
  for (const [index, file] of files.entries()) {
    await writeFile(file, fixture(index ? "pt" : "en", false, false), {
      flag: "wx",
    });
    created.push(file);
  }
  for (const [approved, draft] of [
    [false, false],
    [true, true],
    [true, false],
  ]) {
    for (const [index, file] of files.entries())
      await writeFile(file, fixture(index ? "pt" : "en", approved, draft));
    build();
    for (const prefix of ["", "pt/"]) {
      const html = await read(`dist/${prefix}about/index.html`);
      assert.equal(html.includes('id="training"'), approved && !draft);
      assert.equal(
        html.includes("Temporary training QA fixture"),
        approved && !draft,
      );
      if (approved && !draft) {
        assert.ok(html.indexOf('id="courses"') < html.indexOf('id="training"'));
        assert.ok(html.includes(prefix ? "Em andamento" : "Completed"));
        assert.ok(
          html.includes(
            prefix ? "Cursos e Capacitação" : "Courses &amp; Training",
          ),
        );
        if (!prefix)
          assert.match(
            html,
            /href="https:\/\/example.org\/qa-course"\s+target="_blank"/,
          );
        else assert.ok(!html.includes("Ver certificado"));
      }
    }
  }
  for (const [index, file] of files.entries()) {
    await writeFile(
      file,
      fixture(index ? "pt" : "en", true, false).replace(
        "approved: true",
        "localOnly: true\napproved: true",
      ),
    );
  }
  build();
  for (const prefix of ["", "pt/"]) {
    assert.ok(
      !(await read(`dist/${prefix}about/index.html`)).includes('id="training"'),
    );
  }
  console.log(
    "Training visibility passed: empty, unapproved and draft courses hidden; approved courses localized with accurate status/date and optional certificate links.",
  );
} finally {
  for (const file of created) await unlink(file);
  build();
}
