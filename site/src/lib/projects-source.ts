/**
 * Which projects appear on /opensource.
 *
 *   every public repo of `github.owners`        (discovered automatically)
 *   + every repo listed under `projects:`      (extra detail, or repos from other owners)
 *   − anything in `github.hide`
 *   − forks (unless `github.include_forks: true`)
 *   − repos already shown as a Lab experiment
 *   − empty repos (nothing pushed yet)
 *
 * Plain Node — used by content.config.ts and by scripts/.
 */
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import type { GithubCache } from './github-cache.ts';

export interface ProjectsFile {
  github?: { owners?: string[]; include_forks?: boolean; hide?: string[] };
  projects?: ({ repository: string } & Record<string, unknown>)[];
}

const lc = (s: string) => s.trim().toLowerCase();
const repoKey = (s: string) => lc(s.replace(/^https?:\/\/github\.com\//i, '').replace(/\/$/, ''));

export const parseProjectsFile = (text: string): ProjectsFile =>
  (YAML.parse(text) ?? {}) as ProjectsFile;

/** Repositories referenced by content/lab.yaml (owner/repo or GitHub URL). */
export function labRepositories(contentDir: string): string[] {
  try {
    const labs = (YAML.parse(fs.readFileSync(path.join(contentDir, 'lab.yaml'), 'utf8')) ?? []) as {
      repository?: string | null;
    }[];
    return labs
      .map((l) => l.repository)
      .filter((r): r is string => !!r)
      .map(repoKey);
  } catch {
    return [];
  }
}

/** Owners to scan and explicitly listed repositories — what fetch-github needs to fetch. */
export function sources(cfg: ProjectsFile) {
  return {
    owners: (cfg.github?.owners ?? []).map(lc),
    listed: (cfg.projects ?? []).map((p) => p.repository).filter(Boolean),
  };
}

export function buildProjectList(cfg: ProjectsFile, cache: GithubCache, labRepos: string[]) {
  const owners = new Set((cfg.github?.owners ?? []).map(lc));
  const hide = new Set((cfg.github?.hide ?? []).map(lc));
  const lab = new Set(labRepos.map(repoKey));
  const isHidden = (full: string) =>
    hide.has(repoKey(full)) || hide.has(repoKey(full).split('/')[1] ?? '');
  const overrides = new Map((cfg.projects ?? []).map((p) => [repoKey(p.repository), p]));

  const out: ({ repository: string } & Record<string, unknown>)[] = [];
  for (const meta of Object.values(cache.repos)) {
    const key = repoKey(meta.repository);
    if (!owners.has(key.split('/')[0] ?? '') || overrides.has(key)) continue;
    if (isHidden(key) || lab.has(key) || (meta.fork && !cfg.github?.include_forks)) continue;
    if (meta.size === 0) continue; // empty repo — appears once code is pushed
    out.push({ repository: meta.repository });
  }
  for (const p of cfg.projects ?? []) if (!isHidden(p.repository)) out.push(p);
  return out;
}
