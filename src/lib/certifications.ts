import { getCollection } from "astro:content";
export async function getPublishedCertifications(locale: "en" | "pt") {
  return (
    await getCollection(locale === "pt" ? "certificationsPt" : "certifications")
  )
    .filter(
      (entry) =>
        !entry.data.draft && (!entry.data.localOnly || import.meta.env.DEV),
    )
    .sort(
      (a, b) =>
        b.data.date.getTime() - a.data.date.getTime() ||
        a.id.localeCompare(b.id),
    );
}
