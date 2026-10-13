#!/usr/bin/env node
/**
 * Post-build broken-link check for internal links and assets.
 * Crawls every HTML file in dist/ and verifies each local href/src resolves
 * to a built file — and that #fragments point at a real id.
 *
 *   node scripts/check-links.ts [distDir]
 */
import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve(process.argv[2] ?? 'dist');
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;

if (!fs.existsSync(dist)) {
  console.error(red(`✗ ${dist} does not exist — run the build first.`));
  process.exit(1);
}

const walk = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? walk(full) : [full];
  });

const htmlFiles = walk(dist).filter((f) => f.endsWith('.html'));
const idCache = new Map<string, Set<string>>();

const idsOf = (file: string) => {
  let ids = idCache.get(file);
  if (!ids) {
    const html = fs.readFileSync(file, 'utf8');
    ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1] ?? ''));
    idCache.set(file, ids);
  }
  return ids;
};

/** Map a URL path to the file Astro/GitHub Pages would serve. */
function resolveTarget(urlPath: string): string | undefined {
  const clean = decodeURIComponent(urlPath.split(/[?#]/)[0] ?? '');
  const candidates = [
    path.join(dist, clean),
    path.join(dist, clean, 'index.html'),
    path.join(dist, `${clean}.html`),
  ];
  return candidates.find((c) => fs.existsSync(c) && fs.statSync(c).isFile());
}

const broken: { from: string; link: string; reason: string }[] = [];
let checked = 0;

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const pageUrl =
    '/' +
    path
      .relative(dist, file)
      .replace(/\\/g, '/')
      .replace(/index\.html$/, '');
  for (const match of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    const raw = (match[1] ?? '').replace(/&amp;/g, '&');
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(raw) || raw === '') continue; // external, mailto:, data:, etc.
    checked++;
    const [target = '', hash] = raw.split('#');
    const absolute = target === '' ? pageUrl : new URL(target, `https://x${pageUrl}`).pathname;
    const resolved = resolveTarget(absolute);
    if (!resolved) {
      broken.push({ from: pageUrl, link: raw, reason: 'not found' });
    } else if (
      hash &&
      resolved.endsWith('.html') &&
      !idsOf(resolved).has(decodeURIComponent(hash))
    ) {
      broken.push({ from: pageUrl, link: raw, reason: `missing #${hash}` });
    }
  }
}

if (broken.length) {
  console.error(red(`\n✗ ${broken.length} broken internal link(s):\n`));
  for (const b of broken) console.error(`  ${b.from}  →  ${red(b.link)}  ${dim(`(${b.reason})`)}`);
  console.error('');
  process.exit(1);
}
console.log(
  green(`✓ links: ${checked} internal links across ${htmlFiles.length} pages — all resolve.`),
);
