import data from '../generated/github.json';
import { normaliseCache, type AsciiAvatar, type RepoMeta } from './github-cache.ts';

export type { RepoMeta, AsciiAvatar };

const cache = normaliseCache(data);

/** Returns metadata, or `undefined` when GitHub data is unavailable — never throws. */
export function getRepoMeta(repository: string): RepoMeta | undefined {
  const meta = cache.repos[repository.toLowerCase()];
  return meta && typeof meta.stars === 'number' ? meta : undefined;
}

/** Profile picture as coloured ASCII art, or null if it couldn't be fetched. */
export const getAvatar = (): AsciiAvatar | null => cache.avatar;

export const repoUrl = (repository: string) => `https://github.com/${repository}`;

export function formatCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k` : String(n);
}
