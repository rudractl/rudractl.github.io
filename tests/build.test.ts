/**
 * Smoke tests against the production build in dist/ (run `npm run build` first).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve('dist');
const skip = !fs.existsSync(dist) && 'dist/ not found — run `npm run build` first';
const read = (p: string) => fs.readFileSync(path.join(dist, p), 'utf8');
const exists = (p: string) => fs.existsSync(path.join(dist, p));

test('core pages are generated', { skip }, () => {
  for (const page of [
    'index.html',
    'opensource/index.html',
    'blog/index.html',
    'lab/index.html',
    'uses/index.html',
    'about/index.html',
    '404.html',
  ]) {
    assert.ok(exists(page), `missing ${page}`);
  }
});

test('SEO essentials exist', { skip }, () => {
  for (const file of [
    'sitemap-index.xml',
    'rss.xml',
    'robots.txt',
    'og/default.png',
    'favicon.svg',
  ])
    assert.ok(exists(file), `missing ${file}`);
  const home = read('index.html');
  for (const tag of [
    '<title>',
    'name="description"',
    'rel="canonical"',
    'property="og:image"',
    'name="twitter:card"',
  ]) {
    assert.ok(home.includes(tag), `homepage missing ${tag}`);
  }
});

test('drafts never reach production', { skip }, () => {
  const blog = JSON.parse(read('api/blog.json')) as { slug: string }[];
  const drafts = fs
    .readdirSync('content/blog')
    .filter(
      (f) =>
        !f.startsWith('_') &&
        /status:\s*draft/.test(fs.readFileSync(path.join('content/blog', f), 'utf8')),
    );
  for (const draft of drafts) {
    const slug = draft.replace(/\.mdx?$/, '');
    assert.ok(!exists(`blog/${slug}/index.html`), `draft ${slug} was built`);
    assert.ok(!blog.some((p) => p.slug === slug), `draft ${slug} in api/blog.json`);
    assert.ok(!read('rss.xml').includes(`/blog/${slug}/`), `draft ${slug} in rss`);
  }
});

test('static JSON API is valid and complete', { skip }, () => {
  const index = JSON.parse(read('api/index.json')) as { endpoints: { name: string }[] };
  for (const { name } of index.endpoints) {
    const data: unknown = JSON.parse(read(`api/${name}.json`));
    assert.ok(data && typeof data === 'object', `api/${name}.json is empty`);
  }
  const profile = JSON.parse(read('api/profile.json')) as { name: string; role: string };
  assert.ok(profile.name && profile.role);
});

test('missing GitHub metadata degrades gracefully', { skip }, () => {
  for (const dir of fs.readdirSync(path.join(dist, 'opensource'))) {
    const file = `opensource/${dir}/index.html`;
    if (!exists(file)) continue;
    const html = read(file);
    assert.ok(
      !/undefined|NaN/.test(html.replace(/<script[\s\S]*?<\/script>/g, '')),
      `${file} renders undefined/NaN`,
    );
  }
});
