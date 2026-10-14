/** Shared helpers for content scripts (plain Node — no Astro runtime). Run from <repo>/site. */
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

export { slugify, projectId, labId } from '../../src/lib/slug.ts';

/** <repo>/site — where package.json lives and every npm script runs. */
export const ROOT = process.cwd();
/** <repo>/content — everything you edit. */
export const CONTENT = path.resolve(ROOT, '..', 'content');
export const REPO_ROOT = path.resolve(ROOT, '..');

export const c = {
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
};

/** Path relative to the repo root, e.g. "content/projects.yaml". */
export const rel = (file: string) => path.relative(REPO_ROOT, file).replace(/\\/g, '/');

export const readYaml = (file: string): unknown =>
  YAML.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''));

/** Parse the front matter + body of a Markdown file. */
export function readMarkdown(file: string): { data: unknown; body: string } {
  const text = fs.readFileSync(file, 'utf8').replace(/^﻿/, '');
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match)
    throw new Error('Missing front matter (expected a --- block at the top of the file).');
  return { data: YAML.parse(match[1] ?? '') ?? {}, body: match[2] ?? '' };
}

/** Files of a directory collection (ignores `_`-prefixed files and folders). */
export function collectionFiles(dir: string, extensions: readonly string[]): string[] {
  const full = path.join(CONTENT, dir);
  if (!fs.existsSync(full)) return [];
  const out: string[] = [];
  const walk = (d: string) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.name.startsWith('_') || e.name.startsWith('.')) continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (extensions.includes(path.extname(e.name).slice(1))) out.push(p);
    }
  };
  walk(full);
  return out.sort();
}

/** Same id Astro's glob loader assigns: front-matter `slug`, else the file name. */
export function postId(file: string, data: unknown): string {
  const slug = (data as { slug?: unknown } | null)?.slug;
  if (typeof slug === 'string' && slug) return slug;
  return path
    .relative(path.join(CONTENT, 'blog'), file)
    .replace(/\\/g, '/')
    .replace(/\.[^.]+$/, '')
    .toLowerCase();
}

/** Repositories listed in content/projects.yaml. */
export function listedRepositories(): string[] {
  const file = path.join(CONTENT, 'projects.yaml');
  if (!fs.existsSync(file)) return [];
  const list = (readYaml(file) ?? []) as { repository?: unknown }[];
  return list
    .map((p) => p.repository)
    .filter((r): r is string => typeof r === 'string' && r.includes('/'));
}
