import assert from "node:assert/strict";
import { access, readFile, writeFile, unlink } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const slug = "portfolio-visibility-check";
const files = {
  en: `src/content/notes/${slug}.md`,
  pt: `src/content/notes-pt/${slug}.md`,
};
const exists = async (path) =>
  access(path).then(
    () => true,
    () => false,
  );
const read = (path) => readFile(path, "utf8");
function build() {
  for (const command of ["build", "validate:site"]) {
    const result = spawnSync("npm", ["run", command], {
      encoding: "utf8",
      env: process.env,
    });
    assert.equal(
      result.status,
      0,
      `${command} failed:\n${result.stdout}\n${result.stderr}`,
    );
  }
}
function fixture(draft) {
  return `---\ntitle: "Visibility test article"\ndescription: "Temporary content used only during verification."\ndate: 2026-01-01\ncategory: Java\ndraft: ${draft}\n---\n\n## Storage\n\n| Key | Value |\n| --- | --- |\n| language | Java |\n\n\`\`\`java\nString language = "Java";\n\`\`\`\n`;
}
for (const file of Object.values(files))
  assert.equal(
    await exists(file),
    false,
    `Reserved test fixture already exists: ${file}`,
  );
const created = [];
try {
  build();
  const baseline = {
    en: await exists("dist/blog/index.html"),
    pt: await exists("dist/pt/blog/index.html"),
  };
  for (const file of Object.values(files)) {
    await writeFile(file, fixture(true), { flag: "wx" });
    created.push(file);
  }
  build();
  for (const [locale, prefix] of [
    ["en", ""],
    ["pt", "pt/"],
  ]) {
    assert.equal(
      await exists(`dist/${prefix}blog/index.html`),
      baseline[locale],
    );
    assert.equal(await exists(`dist/${prefix}blog/${slug}/index.html`), false);
    assert.ok(
      !(await read(`dist/${prefix}index.html`)).includes(
        "Visibility test article",
      ),
    );
  }
  assert.ok(!(await read("dist/sitemap.xml")).includes(slug));

  await writeFile(files.pt, fixture(false));
  build();
  const ptHome = await read("dist/pt/index.html");
  assert.ok(
    ptHome.includes('id="blog"') && ptHome.includes('href="/pt/blog/"'),
  );
  assert.equal(await exists("dist/blog/index.html"), baseline.en);
  const article = await read(`dist/pt/blog/${slug}/index.html`);
  assert.ok(article.includes("<table>") && article.includes("<pre"));
  assert.match(article, /<a\s+class="language-toggle"\s+href="\/"/);
  assert.ok(!/rel="alternate"\s+hreflang="en"/.test(article));
  assert.ok((await read("dist/sitemap.xml")).includes(`/pt/blog/${slug}/`));

  await writeFile(files.en, fixture(false));
  build();
  assert.equal(await exists(`dist/blog/${slug}/index.html`), true);
  assert.ok((await read("dist/index.html")).includes('id="blog"'));
  const translated = await read(`dist/pt/blog/${slug}/index.html`);
  assert.ok(translated.includes(`href="/blog/${slug}/"`));
  assert.ok(/rel="alternate"\s+hreflang="en"/.test(translated));
  console.log(
    "Blog visibility passed: drafts hidden, published routes listed, independent languages, translated links and Markdown rendering.",
  );
} finally {
  for (const file of created) await unlink(file);
  build();
}
