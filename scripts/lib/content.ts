/** Shared helpers for content scripts (plain Node — no Astro runtime). */
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

export const ROOT = process.cwd();
export const CONTENT = path.join(ROOT, 'content');

export const c = {
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
};

export const rel = (file: string) => path.relative(ROOT, file).replace(/\\/g, '/');

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

/** Parse a YAML file, or the front matter of a Markdown file. */
export function readEntry(file: string): { data: unknown; body: string } {
  const text = fs.readFileSync(file, 'utf8').replace(/^﻿/, '');
  if (/\.mdx?$/.test(file)) {
    const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!match)
      throw new Error('Missing front matter (expected a --- block at the top of the file).');
    return { data: YAML.parse(match[1] ?? '') ?? {}, body: match[2] ?? '' };
  }
  return { data: YAML.parse(text) ?? {}, body: '' };
}

/** Files that belong to a directory collection (ignores `_`-prefixed files). */
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

/** Same id Astro's glob loader assigns: front-matter `slug`, else the file path without extension. */
export function entryId(file: string, dir: string, data: unknown): string {
  const slug = (data as { slug?: unknown } | null)?.slug;
  if (typeof slug === 'string' && slug) return slug;
  return rel(file)
    .replace(new RegExp(`^content/${dir}/`), '')
    .replace(/\.[^.]+$/, '')
    .split('/')
    .map(slugify)
    .join('/');
}
