import type { APIRoute } from 'astro';
import { absolute, json } from '@/lib/api.ts';
import { getProjects } from '@/lib/content.ts';

export const GET: APIRoute = async ({ site }) =>
  json(
    (await getProjects()).map(({ id, data, meta }) => ({
      slug: id,
      name: data.name,
      description: data.description.trim(),
      repository: data.repository,
      status: data.status,
      role: data.role,
      featured: data.featured,
      technologies: data.technologies,
      categories: data.categories,
      highlights: data.highlights,
      url: absolute(`/opensource/${id}/`, site),
      github: meta ?? null,
    })),
  );
