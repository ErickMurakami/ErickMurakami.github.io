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
  draft: z.boolean().default(false),
  localOnly: z.boolean().default(false),
});
const certificationSchema = z.object({
  title: z.string().min(1),
  issuer: z.string().min(1),
  date: z.coerce.date(),
  credentialUrl: z
    .url()
    .refine(
      (value) => new URL(value).protocol === "https:",
      "Use an HTTPS credential verification URL",
    ),
  draft: z.boolean().default(true),
  localOnly: z.boolean().default(false),
});
export const collections = {
  certifications: defineCollection({
    loader: glob({ pattern: "**/*.md", base: "./src/content/certifications" }),
    schema: certificationSchema,
  }),
  certificationsPt: defineCollection({
    loader: glob({
      pattern: "**/*.md",
      base: "./src/content/certifications-pt",
    }),
    schema: certificationSchema,
  }),
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
