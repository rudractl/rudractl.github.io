import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getPosts } from '@/lib/content.ts';
import { getProfile } from '@/lib/data.ts';

export const GET: APIRoute = async ({ site }) => {
  const profile = getProfile();
  const posts = (await getPosts()).filter((p) => p.data.status === 'published');
  return rss({
    title: `${profile.name} — Engineering Notes`,
    description: profile.site.description.trim(),
    site: site!,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description.trim(),
      pubDate: post.data.published,
      link: `/blog/${post.id}/`,
      categories: post.data.tags,
    })),
    customData: '<language>en</language>',
  });
};
