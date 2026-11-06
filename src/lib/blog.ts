import { getCollection } from "astro:content";
export async function getPublishedPosts(locale: "en" | "pt") {
  return (await getCollection(locale === "pt" ? "notesPt" : "notes"))
    .filter(
      (post) =>
        !post.data.draft && (!post.data.localOnly || import.meta.env.DEV),
    )
    .sort(
      (a, b) =>
        b.data.date.getTime() - a.data.date.getTime() ||
        a.id.localeCompare(b.id),
    );
}
