import data from '../generated/github.json';

/** Normalised repository metadata written by `npm run fetch:github`. */
export interface RepoMeta {
  repository: string;
  url: string;
  description: string | null;
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  language: string | null;
  topics: string[];
  license: string | null;
  latestRelease: { tag: string; url: string; publishedAt: string } | null;
  pushedAt: string | null;
  homepage: string | null;
  archived: boolean;
  fetchedAt: string;
}

const repos = data as Record<string, RepoMeta | undefined>;

/** Returns metadata, or `undefined` when GitHub data is unavailable — never throws. */
export function getRepoMeta(repository: string): RepoMeta | undefined {
  const meta = repos[repository.toLowerCase()];
  return meta && typeof meta.stars === 'number' ? meta : undefined;
}

export const repoUrl = (repository: string) => `https://github.com/${repository}`;

export function formatCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k` : String(n);
}
