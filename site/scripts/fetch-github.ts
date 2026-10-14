#!/usr/bin/env node
/**
 * npm run fetch:github — refresh src/generated/github.json:
 *
 *   • every public repo of the owners in content/projects.yaml (+ any repo listed there)
 *   • latest release for each repo that will actually be shown
 *   • your GitHub profile picture as coloured ASCII art (for the terminal)
 *
 * Runs before `npm run dev` / `npm run build`, and in CI twice a day with GITHUB_TOKEN.
 * Locally the cache is reused for 6 hours (pass --force to refetch).
 * Never fails the build: on any error the previous data is kept.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { c, CONTENT, readYaml } from './lib/content.ts';
import {
  CACHE_FILE,
  readGithubCache,
  type AsciiAvatar,
  type GithubCache,
  type RepoMeta,
} from '../src/lib/github-cache.ts';
import {
  buildProjectList,
  labRepositories,
  parseProjectsFile,
  sources,
} from '../src/lib/projects-source.ts';

const OUT = CACHE_FILE();
const token = process.env['GITHUB_TOKEN'] ?? process.env['GH_TOKEN'];
const force = process.argv.includes('--force') || Boolean(process.env['CI']);
const FRESH_MS = 6 * 60 * 60 * 1000;

const headers: Record<string, string> = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'rudractl-portfolio-build',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
};

let rateLimited = false;
async function gh<T>(url: string): Promise<T | null> {
  if (rateLimited) throw new Error('rate limited');
  const res = await fetch(`https://api.github.com${url}`, {
    headers,
    signal: AbortSignal.timeout(8_000),
  });
  if (res.status === 404) return null;
  if (
    (res.status === 403 || res.status === 429) &&
    res.headers.get('x-ratelimit-remaining') === '0'
  ) {
    rateLimited = true;
    const reset = new Date(Number(res.headers.get('x-ratelimit-reset')) * 1000);
    throw new Error(`GitHub rate limit reached — resets at ${reset.toLocaleTimeString()}`);
  }
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`);
  return (await res.json()) as T;
}

interface ApiRepo {
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  topics?: string[];
  license: { spdx_id: string | null; name: string } | null;
  pushed_at: string | null;
  homepage: string | null;
  archived: boolean;
  fork: boolean;
  size: number;
  private: boolean;
}

const toMeta = (r: ApiRepo, previous?: RepoMeta): RepoMeta => ({
  repository: r.full_name,
  url: r.html_url,
  description: r.description,
  stars: r.stargazers_count,
  forks: r.forks_count,
  openIssues: r.open_issues_count,
  language: r.language,
  topics: r.topics ?? [],
  license:
    r.license?.spdx_id && r.license.spdx_id !== 'NOASSERTION'
      ? r.license.spdx_id
      : (r.license?.name ?? null),
  latestRelease: previous?.latestRelease ?? null,
  pushedAt: r.pushed_at,
  homepage: r.homepage || null,
  archived: r.archived,
  fork: r.fork,
  size: r.size,
});

/**
 * Profile picture → coloured ASCII mosaic. Every cell is a dense character
 * (+ * # % @, by brightness) painted in that pixel's colour, so the photo reads
 * through the colours and the characters add terminal texture.
 */
async function asciiAvatar(url: string, cols = 48, rows = 24): Promise<AsciiAvatar> {
  const res = await fetch(`${url}${url.includes('?') ? '&' : '?'}s=160`, {
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) throw new Error(`avatar ${res.status}`);
  const { data } = await sharp(Buffer.from(await res.arrayBuffer()))
    .resize(cols, rows, { fit: 'cover' })
    .removeAlpha()
    .modulate({ saturation: 1.3 })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const ramp = '+*#%@';
  const LIFT = 60; // keep dark areas visible on the terminal's dark background
  const hex = (n: number) =>
    Math.min(255, n + LIFT)
      .toString(16)
      .padStart(2, '0');
  const lines: string[] = [];
  const colors: string[][] = [];
  for (let y = 0; y < rows; y++) {
    let line = '';
    const rowColors: string[] = [];
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 3;
      const [r = 0, g = 0, b = 0] = [data[i], data[i + 1], data[i + 2]];
      const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      line += ramp[Math.min(ramp.length - 1, Math.round(lum * (ramp.length - 1)))];
      rowColors.push(`#${hex(r)}${hex(g)}${hex(b)}`);
    }
    lines.push(line);
    colors.push(rowColors);
  }
  return { cols, rows, lines, colors };
}

/* ───────────────────────────── main ───────────────────────────── */

const cfg = parseProjectsFile(fs.readFileSync(path.join(CONTENT, 'projects.yaml'), 'utf8'));
const { owners, listed } = sources(cfg);
const previous = readGithubCache(OUT);
const profileUser = (
  (readYaml(path.join(CONTENT, 'profile.yaml')) ?? {}) as { contact?: { github?: string } }
).contact?.github;

const fresh =
  !force &&
  previous.fetchedAt &&
  Date.now() - Date.parse(previous.fetchedAt) < FRESH_MS &&
  owners.every((o) => previous.owners.includes(o)) &&
  listed.every((r) => previous.repos[r.toLowerCase()]);
if (fresh) {
  console.log(
    `${c.green('✓')} GitHub: ${Object.keys(previous.repos).length} repos ${c.dim('(cached — --force to refresh)')}`,
  );
  process.exit(0);
}

const next: GithubCache = {
  fetchedAt: new Date().toISOString(),
  owners,
  repos: {},
  avatar: previous.avatar,
};
let failed = false;

// 1. Every public repo of each owner
for (const owner of owners) {
  try {
    for (let page = 1; page < 10; page++) {
      const repos = await gh<ApiRepo[]>(
        `/users/${owner}/repos?per_page=100&type=owner&sort=pushed&page=${page}`,
      );
      if (!repos?.length) break;
      for (const r of repos.filter((x) => !x.private)) {
        const key = r.full_name.toLowerCase();
        next.repos[key] = toMeta(r, previous.repos[key]);
      }
      if (repos.length < 100) break;
    }
  } catch (e) {
    failed = true;
    console.log(`${c.yellow('!')} ${owner}: ${(e as Error).message}`);
  }
}

// 2. Repos listed in projects.yaml from other owners
for (const full of listed) {
  const key = full.toLowerCase();
  if (next.repos[key]) continue;
  try {
    const r = await gh<ApiRepo>(`/repos/${full}`);
    if (r) next.repos[key] = toMeta(r, previous.repos[key]);
    else console.log(`${c.yellow('!')} ${full} ${c.dim('— not found (private or deleted)')}`);
  } catch (e) {
    failed = true;
    if (!rateLimited) console.log(`${c.yellow('!')} ${full}: ${(e as Error).message}`);
  }
}

// Network trouble → keep everything we had, and don't mark the cache fresh (retry next run)
if (failed) {
  for (const [key, meta] of Object.entries(previous.repos)) next.repos[key] ??= meta;
  next.fetchedAt = previous.fetchedAt;
}

// 3. Latest release — only for repos that will be shown
const shown = buildProjectList(cfg, next, labRepositories(CONTENT)).map((p) =>
  p.repository.toLowerCase(),
);
await Promise.all(
  shown.map(async (key) => {
    const meta = next.repos[key];
    if (!meta) return;
    try {
      const rel = await gh<{ tag_name: string; html_url: string; published_at: string }>(
        `/repos/${meta.repository}/releases/latest`,
      );
      meta.latestRelease = rel
        ? { tag: rel.tag_name, url: rel.html_url, publishedAt: rel.published_at }
        : null;
    } catch {
      /* keep the previous value */
    }
  }),
);

// 4. Profile picture as ASCII art
if (profileUser) {
  try {
    const user = await gh<{ avatar_url: string }>(`/users/${profileUser}`);
    if (user?.avatar_url) next.avatar = await asciiAvatar(user.avatar_url);
  } catch (e) {
    if (!rateLimited)
      console.log(
        `${c.yellow('!')} avatar: ${(e as Error).message} ${c.dim('— keeping previous')}`,
      );
  }
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(next, null, 2) + '\n');
if (failed)
  console.log(
    c.yellow('! GitHub unreachable or rate-limited — kept previous data; will retry next run.'),
  );
console.log(
  `${c.green('✓')} GitHub: ${Object.keys(next.repos).length} repos found, ${shown.length} shown on /opensource` +
    c.dim(`${next.avatar ? ' · avatar ✓' : ''}${token ? '' : ' (anonymous)'}`),
);
