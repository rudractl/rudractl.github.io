import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { collections as defs, labSchema, postSchema, projectSchema } from './schemas/index.ts';

/**
 * Every directory under `content/` is a collection. Drop a file in, it shows up.
 * Files starting with `_` are ignored (handy for templates and parking ideas).
 */
const loader = (name: keyof typeof defs) =>
  glob({ base: `./content/${name}`, pattern: `**/[^_]*.{${defs[name].extensions.join(',')}}` });

export const collections = {
  opensource: defineCollection({ loader: loader('opensource'), schema: projectSchema }),
  blog: defineCollection({ loader: loader('blog'), schema: postSchema }),
  lab: defineCollection({ loader: loader('lab'), schema: labSchema }),
};
