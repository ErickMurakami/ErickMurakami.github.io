import type { APIRoute } from "astro";
import { getPublishedCertifications } from "../lib/certifications";
import { getPublishedPosts } from "../lib/blog";
import { getCollection } from "astro:content";
export const GET: APIRoute = async ({ site }) => {
  const projects = await getCollection("projects");
  const notes = await getPublishedPosts("en");
  const routes = [
    "/",
    "/projects/",
    "/about/",
    "/courses/",
    "/contact/",
    ...projects.map((p) => `/projects/${p.id}/`),
    ...notes.map((n) => `/blog/${n.id}/`),
  ];
  routes.push(
    "/pt/",
    "/pt/projects/",
    "/pt/about/",
    "/pt/courses/",
    "/pt/contact/",
    ...(await getCollection("projectsPt")).map((p) => `/pt/projects/${p.id}/`),
    ...(await getPublishedPosts("pt")).map((n) => `/pt/blog/${n.id}/`),
  );
  if (notes.length) routes.push("/blog/");
  if ((await getPublishedPosts("pt")).length) routes.push("/pt/blog/");
  for (const locale of ["en", "pt"] as const) {
    if ((await getPublishedCertifications(locale)).length)
      routes.push(`${locale === "pt" ? "/pt" : ""}/certifications/`);
  }
  const escape = (value: string) =>
    value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll('"', "&quot;");
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map((path) => `<url><loc>${escape(new URL(path, site).href)}</loc></url>`).join("")}</urlset>`,
    { headers: { "Content-Type": "application/xml; charset=utf-8" } },
  );
};
