import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import type { z } from 'astro/zod';
import { dataFiles } from '../schemas/index.ts';

export const CONTENT_DIR = path.resolve(process.cwd(), 'content');

type DataFile = keyof typeof dataFiles;
type DataOf<K extends DataFile> = z.output<(typeof dataFiles)[K]>;

const OPTIONAL: DataFile[] = ['education.yaml', 'certifications.yaml', 'skills.yaml', 'uses.yaml'];
const cache = new Map<DataFile, unknown>();

/**
 * Load and validate a single-file YAML document from `content/`.
 * Re-read on every call in dev (edit → refresh), cached for production builds.
 */
export function loadData<K extends DataFile>(file: K): DataOf<K> {
  if (import.meta.env.PROD && cache.has(file)) return cache.get(file) as DataOf<K>;
  const full = path.join(CONTENT_DIR, file);
  if (!fs.existsSync(full)) {
    if (OPTIONAL.includes(file)) return [] as DataOf<K>;
    throw new Error(`Missing required content file: content/${file}`);
  }
  const raw = YAML.parse(fs.readFileSync(full, 'utf8')) ?? [];
  const result = dataFiles[file].safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  • ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid content/${file}\n${issues}\nRun \`npm run validate\` for details.`);
  }
  cache.set(file, result.data);
  return result.data as DataOf<K>;
}

export const getProfile = () => loadData('profile.yaml');
export const getExperience = () => loadData('experience.yaml');
export const getEducation = () => loadData('education.yaml');
export const getCertifications = () => loadData('certifications.yaml');
export const getSkills = () => loadData('skills.yaml');
export const getUses = () => loadData('uses.yaml');
