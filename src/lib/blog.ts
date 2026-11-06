import { getCollection } from "astro:content";
export async function getPublishedPosts(locale: "en" | "pt") {
  return (await getCollection(locale === "pt" ? "notesPt" : "notes"))
    .filter((post) => !post.data.draft)
    .sort(
      (a, b) =>
        b.data.date.getTime() - a.data.date.getTime() ||
        a.id.localeCompare(b.id),
    );
}
