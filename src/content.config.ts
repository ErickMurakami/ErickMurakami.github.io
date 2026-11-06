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
const certificationSchema = z
  .object({
    status: z.enum(["earned", "in-progress"]).default("earned"),
    title: z.string().min(1),
    issuer: z.string().min(1),
    date: z.coerce.date(),
    credentialUrl: z
      .url()
      .refine(
        (value) => new URL(value).protocol === "https:",
        "Use an HTTPS credential verification URL",
      )
      .optional(),
    draft: z.boolean().default(true),
    localOnly: z.boolean().default(false),
  })
  .superRefine((entry, context) => {
    if (entry.status === "earned" && !entry.credentialUrl)
      context.addIssue({
        code: "custom",
        path: ["credentialUrl"],
        message: "Earned certifications require a credential verification URL",
      });
  });
export const collections = {
  learning: defineCollection({
    loader: glob({ pattern: "**/*.md", base: "./src/content/learning" }),
    schema: z
      .object({
        locale: z.enum(["en", "pt"]),
        kind: z.enum(["education", "course"]),
        title: z.string().min(1),
        institution: z.string().min(1),
        location: z.string().optional(),
        period: z.string().min(1).optional(),
        background: z.array(z.string().min(1)).optional(),
        finalProject: z.string().min(1).optional(),
        area: z.string().min(1).optional(),
        completionDate: z.coerce.date().optional(),
        certificateUrl: z
          .url()
          .refine(
            (value) => new URL(value).protocol === "https:",
            "Use an HTTPS certificate URL",
          )
          .optional(),
        status: z.enum(["completed", "in-progress"]).default("in-progress"),
        approved: z.boolean().default(false),
        order: z.number().default(0),
        draft: z.boolean().default(false),
      })
      .superRefine((entry, context) => {
        if (entry.kind === "education" && !entry.period)
          context.addIssue({
            code: "custom",
            path: ["period"],
            message: "Education requires a verified period",
          });
        if (entry.kind === "course" && !entry.area)
          context.addIssue({
            code: "custom",
            path: ["area"],
            message: "Courses require a relevant technical area",
          });
      }),
  }),
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
