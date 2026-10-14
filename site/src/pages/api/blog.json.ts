import type { APIRoute } from 'astro';
import { absolute, json } from '@/lib/api.ts';
import { getPosts, postUrl } from '@/lib/content.ts';

export const GET: APIRoute = async ({ site }) =>
  json(
    (await getPosts()).map((post) => ({
      slug: post.id,
      title: post.data.title,
      description: post.data.description.trim(),
      published: post.data.published.toISOString(),
      updated: post.data.updated?.toISOString() ?? null,
      tags: post.data.tags,
      series: post.data.series ?? null,
      featured: post.data.featured,
      reading_time: post.minutes,
      url: absolute(postUrl(post), site),
      external: Boolean(post.data.external_url),
    })),
  );
