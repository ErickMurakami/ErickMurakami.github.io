import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";
const projectSchema = z.object({
  title: z.string(),
  repo: z.string(),
  description: z.string(),
  focus: z.string(),
  stack: z.array(z.string()),
  order: z.number(),
});
const noteSchema = z.object({
  title: z.string(),
  description: z.string(),
  date: z.coerce.date(),
  category: z.string(),
});
export const collections = {
  projects: defineCollection({
    loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
    schema: projectSchema,
  }),
  projectsPt: defineCollection({
    loader: glob({ pattern: "**/*.md", base: "./src/content/projects-pt" }),
    schema: projectSchema,
  }),
  notes: defineCollection({
    loader: glob({ pattern: "**/*.md", base: "./src/content/notes" }),
    schema: noteSchema,
  }),
  notesPt: defineCollection({
    loader: glob({ pattern: "**/*.md", base: "./src/content/notes-pt" }),
    schema: noteSchema,
  }),
};
