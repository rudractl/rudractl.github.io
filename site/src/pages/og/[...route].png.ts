import type { APIRoute, GetStaticPaths } from 'astro';
import { getLabs, getLocalPosts, getProjects } from '@/lib/content.ts';
import { getProfile } from '@/lib/data.ts';
import { renderOgImage, type OgCard } from '@/lib/og.ts';

type Card = Omit<OgCard, 'author' | 'role' | 'site'>;

export const getStaticPaths: GetStaticPaths = async () => {
  const profile = getProfile();
  const [posts, projects, labs] = await Promise.all([getLocalPosts(), getProjects(), getLabs()]);
  const cards: { route: string; card: Card }[] = [
    {
      route: 'default',
      card: {
        section: 'home',
        command: `${profile.handle} whoami`,
        title: profile.name,
        subtitle: `${profile.role}. ${profile.tagline.trim()}`,
        tags: profile.focus,
      },
    },
    ...posts.map((p) => ({
      route: `blog/${p.id}`,
      card: {
        section: 'blog',
        command: `${profile.handle} blog get ${p.id}`,
        title: p.data.title,
        subtitle: p.data.description.trim(),
        tags: p.data.tags,
      },
    })),
    ...projects.map((p) => ({
      route: `opensource/${p.id}`,
      card: {
        section: 'opensource',
        command: `${profile.handle} project describe ${p.id}`,
        title: p.data.name,
        subtitle: p.data.description.trim(),
        tags: p.data.technologies,
      },
    })),
    ...labs.map((l) => ({
      route: `lab/${l.id}`,
      card: {
        section: 'lab',
        command: `${profile.handle} lab describe ${l.id}`,
        title: l.data.name,
        subtitle: l.data.summary.trim(),
        tags: l.data.technologies,
      },
    })),
  ];
  return cards.map(({ route, card }) => ({ params: { route }, props: { card } }));
};

export const GET: APIRoute = async ({ props, site }) => {
  const profile = getProfile();
  const png = await renderOgImage({
    ...(props['card'] as Card),
    author: profile.name,
    role: profile.role,
    site: (site?.host ?? '').replace(/^www\./, ''),
  });
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
