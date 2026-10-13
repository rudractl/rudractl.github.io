import type { APIRoute } from 'astro';
import { json } from '@/lib/api.ts';
import { getLabs, getPosts, getProjects, getTags } from '@/lib/content.ts';
import { getUses } from '@/lib/data.ts';
import { formatDate, plainText } from '@/lib/format.ts';
import { NAV } from '@/lib/site.ts';

/** Static search index for the ⌘K palette. Small, cacheable, no backend. */
export const GET: APIRoute = async () => {
  const [posts, projects, labs, tags] = await Promise.all([
    getPosts(),
    getProjects(),
    getLabs(),
    getTags(),
  ]);
  const pageDescriptions: Record<string, string> = {
    home: 'Start here',
    opensource: 'Projects I build in public',
    blog: 'Engineering notes',
    lab: 'Experiments and prototypes',
    uses: 'Tools I use',
    about: 'Experience, skills and contact',
  };
  return json([
    ...NAV.map((n) => ({
      type: 'page',
      title: `~/${n.label === 'home' ? '' : n.label}`,
      url: n.href,
      description: pageDescriptions[n.label],
      keywords: n.label,
    })),
    ...posts.map((p) => ({
      type: 'post',
      title: p.data.title,
      url: `/blog/${p.id}/`,
      description: p.data.description.trim(),
      meta: formatDate(p.data.published),
      keywords: `${p.data.tags.join(' ')} ${plainText(p.body).slice(0, 3000)}`,
    })),
    ...projects.map((p) => ({
      type: 'project',
      title: p.data.name,
      url: `/opensource/${p.id}/`,
      description: p.data.description.trim(),
      meta: p.data.status,
      keywords: [
        ...p.data.technologies,
        ...p.data.categories,
        p.data.repository,
        ...(p.meta?.topics ?? []),
      ].join(' '),
    })),
    ...labs.map((l) => ({
      type: 'lab',
      title: l.data.name,
      url: `/lab/${l.id}/`,
      description: l.data.summary.trim(),
      meta: l.data.status,
      keywords: l.data.technologies.join(' '),
    })),
    ...tags.map((t) => ({
      type: 'tag',
      title: `#${t.tag}`,
      url: `/blog/tags/${t.slug}/`,
      meta: `${t.count} posts`,
      keywords: t.tag,
    })),
    {
      type: 'page',
      title: 'Uses',
      url: '/uses/',
      description: 'Tools I use',
      keywords: getUses()
        .flatMap((g) => g.items.map((i) => i.name))
        .join(' '),
    },
  ]);
};
