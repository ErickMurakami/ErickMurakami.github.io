import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
export const GET: APIRoute = async ({ site }) => {
  const projects = await getCollection("projects");
  const notes = await getCollection("notes");
  const routes = [
    "/",
    "/projects/",
    "/notes/",
    "/about/",
    "/contact/",
    ...projects.map((p) => `/projects/${p.id}/`),
    ...notes.map((n) => `/notes/${n.id}/`),
  ];
  routes.push(
    "/pt/",
    "/pt/projects/",
    "/pt/notes/",
    "/pt/about/",
    "/pt/contact/",
    ...(await getCollection("projectsPt")).map((p) => `/pt/projects/${p.id}/`),
    ...(await getCollection("notesPt")).map((n) => `/pt/notes/${n.id}/`),
  );
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
