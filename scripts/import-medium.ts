#!/usr/bin/env node
/**
 * npm run import:medium — pull your Medium posts into the blog.
 *
 * Reads `contact.medium` from content/profile.yaml, fetches the public RSS feed
 * and writes one stub per post to content/blog/medium/<slug>.md with
 * `external_url` set: the post appears in listings, search, tags and RSS and
 * links straight to Medium. Existing files are never overwritten (edit them
 * freely) unless you pass --force.
 *
 * Runs on every deploy too, so new Medium posts show up automatically.
 * Never fails the build — if Medium is unreachable it just logs and exits.
 */
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { c, CONTENT, rel, slugify } from './lib/content.ts';

const force = process.argv.includes('--force');
const OUT = path.join(CONTENT, 'blog', 'medium');

const profile = YAML.parse(fs.readFileSync(path.join(CONTENT, 'profile.yaml'), 'utf8')) as {
  contact?: { medium?: string };
};
const user = profile.contact?.medium?.replace(/^@/, '');
if (!user) {
  console.log(c.dim('No contact.medium in profile.yaml — skipping Medium import.'));
  process.exit(0);
}

const decode = (s: string) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .trim();
const tag = (item: string, name: string) =>
  decode(item.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`))?.[1] ?? '');
const text = (html: string) =>
  decode(html.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, s.lastIndexOf(' ', n))}…` : s);

const ACRONYMS: Record<string, string> = {
  cncf: 'CNCF',
  ai: 'AI',
  llm: 'LLM',
  devops: 'DevOps',
  gitops: 'GitOps',
  kubernetes: 'Kubernetes',
  homelab: 'Homelab',
  k8s: 'Kubernetes',
  aws: 'AWS',
  gcp: 'GCP',
};
const tagName = (t: string) =>
  ACRONYMS[t.toLowerCase()] ??
  t.replace(/(^|[\s-])(\w)/g, (_, a: string, b: string) => a + b.toUpperCase());

let xml: string;
try {
  const res = await fetch(`https://medium.com/feed/@${user}`, {
    headers: { 'User-Agent': 'rudractl-portfolio-build' },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  xml = await res.text();
} catch (e) {
  console.log(
    `${c.yellow('!')} Medium feed unavailable (${(e as Error).message}) — keeping existing posts.`,
  );
  process.exit(0);
}

fs.mkdirSync(OUT, { recursive: true });
let created = 0;
let kept = 0;

for (const item of xml.match(/<item>[\s\S]*?<\/item>/g) ?? []) {
  const title = tag(item, 'title').replace(/\s+/g, ' ');
  const link = tag(item, 'link').split('?')[0] ?? '';
  const pub = new Date(tag(item, 'pubDate'));
  if (!title || !link || Number.isNaN(pub.valueOf())) continue;

  // Full article when Medium includes it; otherwise just the feed snippet.
  const full = tag(item, 'content:encoded');
  const html = full || tag(item, 'description');
  const firstParagraph = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)]
    .map((m) => text(m[1] ?? ''))
    .find((p) => p.length > 40);
  const words = full ? text(full).split(' ').length : 0;
  const tags = [...item.matchAll(/<category>([\s\S]*?)<\/category>/g)]
    .map((m) => tagName(decode(m[1] ?? '')))
    .slice(0, 5);
  const slug = slugify(title);
  const file = path.join(OUT, `${slug}.md`);

  if (fs.existsSync(file) && !force) {
    kept++;
    continue;
  }

  const front = {
    title,
    slug,
    description: clip(firstParagraph ?? title, 200),
    published: pub.toISOString().slice(0, 10),
    status: 'published',
    tags: tags.length ? tags : ['Engineering'],
    ...(words ? { reading_time: Math.max(1, Math.round(words / 230)) } : {}),
    external_url: link,
  };
  fs.writeFileSync(
    file,
    `---\n# Imported from Medium by \`npm run import:medium\`. Safe to edit — it won't be overwritten.\n${YAML.stringify(front, { lineWidth: 0 })}---\n\nOriginally published on [Medium](${link}).\n`,
  );
  created++;
  console.log(`${c.green('+')} ${rel(file)} ${c.dim(front.published)}`);
}

console.log(`${c.green('✓')} Medium @${user}: ${created} new, ${kept} already imported.`);
