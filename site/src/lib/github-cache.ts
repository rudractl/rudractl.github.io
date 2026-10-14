/**
 * Shape of src/generated/github.json — written by scripts/fetch-github.ts,
 * read by the site and by the content scripts. Plain Node, no Astro imports.
 */
import fs from 'node:fs';
import path from 'node:path';

/** Normalised repository metadata. */
export interface RepoMeta {
  repository: string;
  url: string;
  description: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  language: string | null;
  topics: string[];
  license: string | null;
  latestRelease: { tag: string; url: string; publishedAt: string } | null;
  pushedAt: string | null;
  homepage: string | null;
  archived: boolean;
  fork: boolean;
  /** Repo size in KB — 0 means nothing has been pushed yet. */
  size: number;
}

/** GitHub avatar rendered as coloured ASCII (one hex colour per character). */
export interface AsciiAvatar {
  cols: number;
  rows: number;
  lines: string[];
  colors: string[][];
}

export interface GithubCache {
  fetchedAt: string | null;
  owners: string[];
  repos: Record<string, RepoMeta>;
  avatar: AsciiAvatar | null;
}

export const emptyCache = (): GithubCache => ({
  fetchedAt: null,
  owners: [],
  repos: {},
  avatar: null,
});

export const CACHE_FILE = () => path.resolve(process.cwd(), 'src/generated/github.json');

/** Normalise whatever is on disk (tolerates older formats and missing files). */
export function normaliseCache(raw: unknown): GithubCache {
  if (!raw || typeof raw !== 'object') return emptyCache();
  const r = raw as Partial<GithubCache> & Record<string, unknown>;
  if (r.repos && typeof r.repos === 'object') {
    return { ...emptyCache(), ...r, repos: r.repos as Record<string, RepoMeta> };
  }
  // v1: a flat map of repo → meta
  return { ...emptyCache(), repos: r as unknown as Record<string, RepoMeta> };
}

export function readGithubCache(file = CACHE_FILE()): GithubCache {
  try {
    return normaliseCache(JSON.parse(fs.readFileSync(file, 'utf8')));
  } catch {
    return emptyCache();
  }
}
