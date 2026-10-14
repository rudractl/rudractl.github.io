import type { APIRoute } from 'astro';
import { absolute, json } from '@/lib/api.ts';

export const GET: APIRoute = ({ site }) =>
  json({
    version: 1,
    generated: new Date().toISOString(),
    endpoints: ['profile', 'projects', 'blog', 'lab', 'search'].map((name) => ({
      name,
      url: absolute(`/api/${name}.json`, site),
    })),
  });
