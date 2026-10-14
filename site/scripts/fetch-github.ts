#!/usr/bin/env node
/**
 * npm run fetch:github — pulls repository metadata for every project in
 * content/opensource and writes src/generated/github.json.
 *
 *  - Runs before `npm run dev` / `npm run build`, and in CI (daily) with GITHUB_TOKEN.
 *  - Locally, repos fetched in the last 6 hours are skipped (pass --force to refetch).
 *  - Never fails the build: if GitHub is unreachable, the previous cached
 *    values are kept, and pages fall back to "metadata temporarily unavailable".
 */
import fs from 'node:fs';
import path from 'node:path';
import { c, listedRepositories, ROOT } from './lib/content.ts';
import type { RepoMeta } from '../src/lib/github.ts';

const OUT = path.join(ROOT, 'src/generated/github.json');
const token = process.env['GITHUB_TOKEN'] ?? process.env['GH_TOKEN'];

const headers: Record<string, string> = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'rudractl-portfolio-build',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
};

async function gh<T>(url: string): Promise<T | null> {
  const res = await fetch(`https://api.github.com${url}`, {
    headers,
    signal: AbortSignal.timeout(6_000),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}

interface ApiRepo {
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  subscribers_count?: number;
  watchers_count: number;
  open_issues_count: number;
  language: string | null;
  topics?: string[];
  license: { spdx_id: string | null; name: string } | null;
  pushed_at: string | null;
  homepage: string | null;
  archived: boolean;
}
interface ApiRelease {
  tag_name: string;
  html_url: string;
  published_at: string;
}

const repos = [...new Set(listedRepositories().map((r) => r.toLowerCase()))];

const previous: Record<string, RepoMeta> = fs.existsSync(OUT)
  ? JSON.parse(fs.readFileSync(OUT, 'utf8'))
  : {};
const next: Record<string, RepoMeta> = {};

const force = process.argv.includes('--force') || Boolean(process.env['CI']);
const FRESH_MS = 6 * 60 * 60 * 1000;
let skipped = 0;

for (const repo of repos) {
  const cached = previous[repo];
  if (!force && cached && Date.now() - Date.parse(cached.fetchedAt) < FRESH_MS) {
    next[repo] = cached;
    skipped++;
    continue;
  }
  try {
    const data = await gh<ApiRepo>(`/repos/${repo}`);
    if (!data) {
      console.log(
        `${c.yellow('!')} ${repo} ${c.dim('— not found (private or not created yet); page shows a fallback')}`,
      );
      continue;
    }
    const release = await gh<ApiRelease>(`/repos/${repo}/releases/latest`).catch(() => null);
    next[repo] = {
      repository: data.full_name,
      url: data.html_url,
      description: data.description,
      stars: data.stargazers_count,
      forks: data.forks_count,
      watchers: data.subscribers_count ?? data.watchers_count,
      openIssues: data.open_issues_count,
      language: data.language,
      topics: data.topics ?? [],
      license:
        data.license?.spdx_id && data.license.spdx_id !== 'NOASSERTION'
          ? data.license.spdx_id
          : (data.license?.name ?? null),
      latestRelease: release
        ? { tag: release.tag_name, url: release.html_url, publishedAt: release.published_at }
        : null,
      pushedAt: data.pushed_at,
      homepage: data.homepage || null,
      archived: data.archived,
      fetchedAt: new Date().toISOString(),
    };
    console.log(
      `${c.green('✓')} ${repo} ${c.dim(`★ ${data.stargazers_count}  ⑂ ${data.forks_count}${release ? `  ${release.tag_name}` : ''}`)}`,
    );
  } catch (e) {
    if (cached) next[repo] = cached;
    console.log(
      `${c.yellow('!')} ${repo} ${c.dim(`— ${(e as Error).message}; ${cached ? 'kept cached data' : 'no cache available'}`)}`,
    );
  }
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(next, null, 2) + '\n');
console.log(
  `${c.green('✓')} GitHub: ${Object.keys(next).length}/${repos.length} repositories` +
    c.dim(skipped ? ` (${skipped} cached — --force to refresh)` : token ? '' : ' (anonymous)'),
);
