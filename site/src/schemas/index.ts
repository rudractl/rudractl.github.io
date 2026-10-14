/**
 * Content schemas — the single source of truth for every piece of content.
 *
 * Used by:
 *   - src/content.config.ts   (Astro content collections, build-time validation)
 *   - src/lib/data.ts         (single-file YAML: profile, experience, ...)
 *   - scripts/validate.ts     (`npm run validate`, runs in plain Node)
 *
 * Keep this file free of Astro-only imports so it runs under plain Node.
 */
import { z } from 'astro/zod';

const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and dashes (kebab-case).');

const url = z.url();
const nonEmpty = z.string().trim().min(1);
const date = z.coerce.date();
const tags = z.array(nonEmpty).default([]);
/** A year (2024), month ("2024-03") or full date ("2024-03-15") — résumé-style precision. */
export const partialDate = z.union([
  z.number().int().min(1900).max(2100),
  z.string().regex(/^\d{4}(-\d{2}(-\d{2})?)?$/, 'Use YYYY, YYYY-MM or YYYY-MM-DD.'),
]);

/* ───────────────────────────── Open source ───────────────────────────── */

export const projectStatus = ['active', 'maintenance', 'experimental', 'archived'] as const;
export const projectRoles = ['creator', 'maintainer', 'contributor'] as const;

export const projectSchema = z.object({
  /** Optional — defaults to the GitHub repository name. */
  name: nonEmpty.optional(),
  slug: slug.optional(),
  /** GitHub `owner/repo`. Stars, forks, releases, etc. are fetched from it automatically. */
  repository: z
    .string()
    .regex(/^[\w.-]+\/[\w.-]+$/, 'Expected GitHub "owner/repo" (for example rudractl/avron).'),
  /** Optional — defaults to the GitHub repository description. */
  description: nonEmpty.optional(),
  long_description: z.string().optional(),
  featured: z.boolean().default(false),
  status: z.enum(projectStatus).default('active'),
  role: z.enum(projectRoles).default('creator'),
  technologies: tags,
  categories: tags,
  order: z.number().int().default(100),
  links: z
    .object({
      documentation: url.nullish(),
      website: url.nullish(),
    })
    .default({}),
  highlights: tags,
  /** Optional editorial sections rendered on the project page (Markdown supported). */
  why: z.string().optional(),
  architecture: z.string().optional(),
  decisions: z.string().optional(),
  learned: z.string().optional(),
});

/* ────────────────────────────────── Blog ─────────────────────────────── */

export const postStatus = ['draft', 'published'] as const;

export const postSchema = z.object({
  title: nonEmpty,
  slug: slug.optional(),
  description: nonEmpty,
  published: date,
  updated: date.optional(),
  status: z.enum(postStatus).default('published'),
  tags,
  series: z.string().nullish(),
  featured: z.boolean().default(false),
  /** `auto` computes it from the content; a number overrides it (minutes). */
  reading_time: z.union([z.literal('auto'), z.number().positive()]).default('auto'),
  /** Slugs of related open-source projects — cross-linked on both pages. */
  projects: z.array(slug).default([]),
  cover: z.string().optional(),
  /** Published elsewhere (e.g. Medium)? Listings link straight there and no local page is built. */
  external_url: url.optional(),
});

/* ────────────────────────────────── Lab ──────────────────────────────── */

export const labStatus = ['planned', 'active', 'complete', 'paused'] as const;

export const labSchema = z.object({
  name: nonEmpty,
  slug: slug.optional(),
  status: z.enum(labStatus).default('active'),
  technologies: tags,
  summary: nonEmpty,
  repository: z.string().nullish(),
  started: partialDate.optional(),
  featured: z.boolean().default(false),
  /** Free-form Markdown notes when the lab is a YAML file (Markdown labs use the body). */
  notes: z.string().optional(),
});

/* ─────────────────────────── Single-file content ─────────────────────── */

export const profileSchema = z.object({
  name: nonEmpty,
  handle: nonEmpty,
  role: nonEmpty,
  tagline: nonEmpty,
  location: z.string().optional(),
  availability: z.string().optional(),
  intro: nonEmpty,
  summary: nonEmpty,
  focus: z.array(nonEmpty).min(1),
  interests: z
    .array(z.object({ title: nonEmpty, description: nonEmpty, icon: z.string().optional() }))
    .default([]),
  contact: z.object({
    github: z.string().optional(),
    linkedin: z.string().optional(),
    email: z.email().optional(),
    medium: z.string().optional(),
    x: z.string().optional(),
    mastodon: url.optional(),
  }),
  achievements: z.array(z.object({ title: nonEmpty, issuer: z.string().optional() })).default([]),
  languages: z.array(z.object({ name: nonEmpty, level: z.string().optional() })).default([]),
  /** Life outside the terminal. */
  hobbies: tags,
  site: z
    .object({
      title: nonEmpty,
      description: nonEmpty,
      footer_message: z.string().default('Built with Astro, Git and too much YAML.'),
      /** Optional, free analytics. Leave out to disable. Only loaded in production builds. */
      analytics: z
        .object({
          google_analytics: z
            .string()
            .regex(/^G-[A-Z0-9]+$/, 'Expected a GA4 Measurement ID like G-ABC123XYZ.')
            .optional(),
          clarity: z
            .string()
            .regex(/^[a-z0-9]+$/, 'Expected a Microsoft Clarity project ID like abcd1234ef.')
            .optional(),
        })
        .strict()
        .nullish(),
    })
    .strict(),
});

export const experienceSchema = z.array(
  z.object({
    company: nonEmpty,
    role: nonEmpty,
    start: partialDate,
    end: z.union([partialDate, z.literal('present')]),
    location: z.string().optional(),
    summary: nonEmpty,
    areas: tags,
    highlights: tags,
  }),
);

export const educationSchema = z.array(
  z.object({
    institution: nonEmpty,
    degree: nonEmpty,
    field: z.string().optional(),
    start: partialDate.optional(),
    end: z.union([partialDate, z.literal('present')]).optional(),
    notes: z.string().optional(),
  }),
);

export const certificationsSchema = z.array(
  z.object({
    name: nonEmpty,
    issuer: nonEmpty,
    issued: partialDate,
    expires: partialDate.nullish(),
    credential_url: url.nullish(),
  }),
);

export const skillLevels = ['daily', 'experienced', 'exploring'] as const;

export const skillsSchema = z.array(
  z.object({
    group: nonEmpty,
    description: z.string().optional(),
    items: z
      .array(
        z.union([
          nonEmpty.transform((name) => ({
            name,
            level: undefined as (typeof skillLevels)[number] | undefined,
          })),
          z.object({ name: nonEmpty, level: z.enum(skillLevels).optional() }),
        ]),
      )
      .min(1),
  }),
);

export const usesSchema = z.array(
  z.object({
    group: nonEmpty,
    items: z
      .array(
        z.union([
          nonEmpty.transform((name) => ({ name, note: undefined as string | undefined })),
          z.object({ name: nonEmpty, note: z.string().optional() }),
        ]),
      )
      .min(1),
  }),
);

/** Single-file YAML documents under `content/`, keyed by file name. */
export const dataFiles = {
  'profile.yaml': profileSchema,
  'experience.yaml': experienceSchema,
  'education.yaml': educationSchema,
  'certifications.yaml': certificationsSchema,
  'skills.yaml': skillsSchema,
  'uses.yaml': usesSchema,
} as const;

/** List files under `content/` — one YAML list, one entry per item. */
export const listFiles = {
  'projects.yaml': projectSchema,
  'lab.yaml': labSchema,
} as const;

/** Directory-based collections under `content/` (one file per item). */
export const collections = {
  blog: { schema: postSchema, extensions: ['md', 'mdx'] },
} as const;

export type Project = z.infer<typeof projectSchema>;
export type Post = z.infer<typeof postSchema>;
export type Lab = z.infer<typeof labSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type Experience = z.infer<typeof experienceSchema>;
export type Education = z.infer<typeof educationSchema>;
export type Certification = z.infer<typeof certificationsSchema>[number];
export type SkillGroup = z.infer<typeof skillsSchema>[number];
export type UsesGroup = z.infer<typeof usesSchema>[number];
