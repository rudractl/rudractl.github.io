import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import YAML from 'yaml';
import { collections as defs, labSchema, postSchema, projectSchema } from './schemas/index.ts';
import { labId, projectId } from './lib/slug.ts';
import { readGithubCache } from './lib/github-cache.ts';
import { buildProjectList, labRepositories, parseProjectsFile } from './lib/projects-source.ts';

/**
 * All content lives in ../content (outside this code folder):
 *   content/projects.yaml  → opensource  (GitHub repos discovered automatically + your extra detail)
 *   content/lab.yaml       → lab         (one YAML list)
 *   content/blog/**.md     → blog        (one file per post; `_` prefix = ignored)
 */
const CONTENT = '../content';

export const collections = {
  opensource: defineCollection({
    loader: file(`${CONTENT}/projects.yaml`, {
      parser: (text) =>
        buildProjectList(parseProjectsFile(text), readGithubCache(), labRepositories(CONTENT)).map(
          (p) => ({ ...p, id: projectId(p as { repository: string; slug?: string }) }),
        ),
    }),
    schema: projectSchema,
  }),
  lab: defineCollection({
    loader: file(`${CONTENT}/lab.yaml`, {
      parser: (text) =>
        ((YAML.parse(text) ?? []) as { slug?: string; name: string }[]).map((l) => ({
          ...l,
          id: labId(l),
        })),
    }),
    schema: labSchema,
  }),
  blog: defineCollection({
    loader: glob({
      base: `${CONTENT}/blog`,
      pattern: `**/[^_]*.{${defs.blog.extensions.join(',')}}`,
    }),
    schema: postSchema,
  }),
};
