import type { APIRoute } from 'astro';
import { absolute, json } from '@/lib/api.ts';
import { getPosts } from '@/lib/content.ts';

export const GET: APIRoute = async ({ site }) =>
  json(
    (await getPosts()).map(({ id, data, minutes }) => ({
      slug: id,
      title: data.title,
      description: data.description.trim(),
      published: data.published.toISOString(),
      updated: data.updated?.toISOString() ?? null,
      tags: data.tags,
      series: data.series ?? null,
      featured: data.featured,
      reading_time: minutes,
      url: absolute(`/blog/${id}/`, site),
    })),
  );
