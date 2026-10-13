import type { APIRoute } from 'astro';
import { absolute, json } from '@/lib/api.ts';
import { getLabs } from '@/lib/content.ts';

export const GET: APIRoute = async ({ site }) =>
  json(
    (await getLabs()).map(({ id, data }) => ({
      slug: id,
      name: data.name,
      status: data.status,
      summary: data.summary.trim(),
      technologies: data.technologies,
      started: data.started?.toISOString() ?? null,
      repository: data.repository ?? null,
      url: absolute(`/lab/${id}/`, site),
    })),
  );
