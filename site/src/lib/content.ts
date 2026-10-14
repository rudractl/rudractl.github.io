import { getCollection, type CollectionEntry } from 'astro:content';
import readingTime from 'reading-time';
import { getRepoMeta, type RepoMeta } from './github.ts';
import { partialToDate } from './format.ts';

/** Drafts are visible in `npm run dev` and never shipped to production. */
const SHOW_DRAFTS = !import.meta.env.PROD;

export type PostEntry = CollectionEntry<'blog'> & { minutes: number | null };
type Base<T> = Omit<T, 'data'>;

/** A project with name/description resolved (YAML first, then GitHub) and GitHub stats attached. */
export type ProjectEntry = Base<CollectionEntry<'opensource'>> & {
  data: CollectionEntry<'opensource'>['data'] & {
    name: string;
    description: string;
  };
  meta: RepoMeta | undefined;
};
export type LabEntry = CollectionEntry<'lab'>;

export const hasBody = (entry: { body?: string | undefined }) => Boolean(entry.body?.trim());

/* ─────────────── Blog ─────────────── */

export async function getPosts(): Promise<PostEntry[]> {
  const posts = await getCollection('blog', (p) => SHOW_DRAFTS || p.data.status === 'published');
  return posts
    .map((p) => ({
      ...p,
      minutes:
        p.data.reading_time !== 'auto'
          ? p.data.reading_time
          : p.data.external_url
            ? null // body is just a stub — the real length lives elsewhere
            : Math.max(1, Math.round(readingTime(p.body ?? '').minutes)),
    }))
    .sort((a, b) => b.data.published.valueOf() - a.data.published.valueOf());
}

/** Where a post lives: its own page, or the external site it was published on. */
export const postUrl = (post: { id: string; data: { external_url?: string | undefined } }) =>
  post.data.external_url ?? `/blog/${post.id}/`;

/** Posts that get a page on this site (external ones link out instead). */
export async function getLocalPosts(): Promise<PostEntry[]> {
  return (await getPosts()).filter((p) => !p.data.external_url);
}

export async function getTags(): Promise<{ tag: string; slug: string; count: number }[]> {
  const counts = new Map<string, number>();
  for (const post of await getPosts()) {
    for (const tag of post.data.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts]
    .map(([tag, count]) => ({ tag, slug: tagSlug(tag), count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export const tagSlug = (tag: string) =>
  tag
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/* ─────────────── Open source ─────────────── */

const statusRank = { active: 0, experimental: 1, maintenance: 2, archived: 3 } as const;

export async function getProjects(): Promise<ProjectEntry[]> {
  const projects = await getCollection('opensource');
  return projects
    .map((p) => {
      const meta = getRepoMeta(p.data.repository);
      const name = p.data.name ?? p.data.repository.split('/')[1] ?? p.data.repository;
      const description = p.data.description ?? meta?.description ?? '';
      return { ...p, data: { ...p.data, name, description }, meta };
    })
    .sort(
      (a, b) =>
        Number(b.data.featured) - Number(a.data.featured) ||
        a.data.order - b.data.order ||
        statusRank[a.data.status] - statusRank[b.data.status] ||
        // most recently pushed first, so new repos surface near the top
        Date.parse(b.meta?.pushedAt ?? '1970') - Date.parse(a.meta?.pushedAt ?? '1970') ||
        a.data.name.localeCompare(b.data.name),
    );
}

/* ─────────────── Lab ─────────────── */

const labRank = { active: 0, complete: 1, paused: 2, planned: 3 } as const;

export async function getLabs(): Promise<LabEntry[]> {
  const labs = await getCollection('lab');
  return labs.sort(
    (a, b) =>
      labRank[a.data.status] - labRank[b.data.status] ||
      (b.data.started ? partialToDate(b.data.started).valueOf() : 0) -
        (a.data.started ? partialToDate(a.data.started).valueOf() : 0) ||
      a.data.name.localeCompare(b.data.name),
  );
}

/* ─────────────── Cross references ─────────────── */

export async function getPostsForProject(slug: string) {
  return (await getPosts()).filter((p) => p.data.projects.includes(slug));
}
