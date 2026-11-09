import { readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "parse5";
import assert from "node:assert/strict";
const root = "dist";
import { productionSite } from "../config/site.mjs";
const origin = productionSite();
async function walk(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(path)));
    else files.push(path);
  }
  return files;
}
function elements(node, all = []) {
  if (node.tagName) all.push(node);
  for (const child of node.childNodes ?? []) elements(child, all);
  return all;
}
const files = (await walk(root)).filter((p) => p.endsWith(".html"));
const documents = new Map();
for (const file of files)
  documents.set(file, elements(parse(await readFile(file, "utf8"))));
const attrs = (node) =>
  Object.fromEntries((node.attrs ?? []).map((a) => [a.name, a.value]));
for (const [file, nodes] of documents) {
  const path = file.slice(root.length).replace(/index.html$/, "");
  const canonical = nodes.find(
    (n) => n.tagName === "link" && attrs(n).rel === "canonical",
  );
  assert.equal(attrs(canonical).href, origin + path, `Canonical: ${file}`);
  assert.equal(
    attrs(
      nodes.find((n) => n.tagName === "meta" && attrs(n).property === "og:url"),
    ).content,
    origin + path,
    `Open Graph URL: ${file}`,
  );
  const imageUrl = attrs(
    nodes.find((n) => n.tagName === "meta" && attrs(n).property === "og:image"),
  ).content;
  assert.equal(
    new URL(imageUrl).origin,
    origin,
    `Open Graph image origin: ${file}`,
  );
  assert.equal(
    nodes.filter((n) => n.tagName === "h1").length,
    1,
    `Heading: ${file}`,
  );
  assert.ok(
    nodes.some((n) => n.tagName === "meta" && attrs(n).property === "og:image"),
    `Open Graph: ${file}`,
  );
  assert.equal(
    attrs(nodes.find((n) => n.tagName === "html")).lang,
    path.startsWith("/pt/") ? "pt-BR" : "en-GB",
  );
  for (const language of ["en-GB", "pt-BR"]) {
    const alternate = nodes.find(
      (n) =>
        n.tagName === "link" &&
        attrs(n).rel === "alternate" &&
        attrs(n).hreflang === language,
    );
    if (
      !alternate &&
      (path.includes("/blog/") || path.includes("/certifications/")) &&
      language !== (path.startsWith("/pt/") ? "pt-BR" : "en-GB")
    )
      continue;
    assert.ok(alternate, `Missing language alternate in ${file}`);
    const alternateUrl = new URL(attrs(alternate).href);
    assert.equal(alternateUrl.origin, origin, `Language origin: ${file}`);
    const alternatePath = join(
      root,
      alternateUrl.pathname,
      alternateUrl.pathname.endsWith("/") ? "index.html" : "",
    );
    assert.ok(
      documents.has(alternatePath),
      `Missing translated route ${alternateUrl.pathname}`,
    );
  }
  for (const node of nodes) {
    const a = attrs(node);
    const value =
      node.tagName === "a"
        ? a.href
        : ["script", "img"].includes(node.tagName)
          ? a.src
          : node.tagName === "link" && a.rel === "stylesheet"
            ? a.href
            : undefined;
    if (!value) continue;
    const url = new URL(value, origin + path);
    if (url.origin !== origin) continue;
    let target = join(root, decodeURIComponent(url.pathname));
    if (url.pathname.endsWith("/")) target = join(target, "index.html");
    assert.ok(
      (await stat(target).catch(() => null))?.isFile(),
      `Broken route/asset ${value} in ${file}`,
    );
    if (url.hash && target.endsWith(".html"))
      assert.ok(
        documents
          .get(target)
          ?.some((n) => attrs(n).id === decodeURIComponent(url.hash.slice(1))),
        `Broken anchor ${value} in ${file}`,
      );
  }
}
const sitemap = await readFile("dist/sitemap.xml", "utf8");
assert.ok(!sitemap.includes("404.html"));
assert.ok(sitemap.includes(origin + "/projects/econolyze/"));
for (const file of files.filter(
  (p) => !p.endsWith("404.html") && !p.endsWith("pt/404/index.html"),
))
  assert.ok(
    sitemap.includes(
      origin + file.slice(root.length).replace(/index.html$/, ""),
    ),
    `Missing sitemap route ${file}`,
  );
assert.ok((await stat("dist/.nojekyll")).isFile());
console.log(
  `${files.length} HTML routes: canonical URLs, headings, Open Graph, internal links, anchors, assets and sitemap passed.`,
);

// Publishing requires an intentional manual opt-in; validation never deploys.
const delivery = await readFile(".github/workflows/pages.yml", "utf8");
assert.ok(delivery.includes("workflow_dispatch:"));
assert.ok(!/^\s*(push|schedule|pull_request):/m.test(delivery));
assert.equal(
  (delivery.match(/vars\.ENABLE_PAGES_DEPLOYMENT == 'true'/g) ?? []).length,
  2,
);
const validation = await readFile(".github/workflows/validate.yml", "utf8");
assert.ok(!validation.includes("deploy-pages"));
console.log(
  "Pages publication requires manual dispatch and explicit ENABLE_PAGES_DEPLOYMENT opt-in.",
);

assert.ok(
  (await readFile("dist/robots.txt", "utf8")).includes(
    `Sitemap: ${origin}/sitemap.xml`,
  ),
);
for (const value of [
  "http://example.com",
  "https://example.com/path",
  "https://user:pass@example.com",
  "https://example.com/?x=1",
  "https://example.com/#hash",
])
  assert.throws(() => productionSite(value));
assert.equal(productionSite("https://erickkami.dev/"), "https://erickkami.dev");
console.log(
  "Configurable site origin, robots and metadata consistency passed.",
);
