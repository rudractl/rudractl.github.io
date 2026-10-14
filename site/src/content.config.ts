import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import YAML from 'yaml';
import { collections as defs, labSchema, postSchema, projectSchema } from './schemas/index.ts';
import { labId, projectId } from './lib/slug.ts';

/**
 * All content lives in ../content (outside this code folder):
 *   content/projects.yaml  → opensource   (one YAML list)
 *   content/lab.yaml       → lab          (one YAML list)
 *   content/blog/**.md     → blog         (one file per post; `_` prefix = ignored)
 */
const CONTENT = '../content';

const yamlList = <T>(name: string, idOf: (item: T) => string) =>
  file(`${CONTENT}/${name}`, {
    parser: (text) =>
      ((YAML.parse(text) ?? []) as T[]).map((item) => ({ ...(item as object), id: idOf(item) })),
  });

export const collections = {
  opensource: defineCollection({
    loader: yamlList<{ slug?: string; repository: string }>('projects.yaml', projectId),
    schema: projectSchema,
  }),
  lab: defineCollection({
    loader: yamlList<{ slug?: string; name: string }>('lab.yaml', labId),
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
