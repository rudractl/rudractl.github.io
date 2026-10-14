#!/usr/bin/env node
/**
 * npm run validate — checks every content file against the same Zod schemas
 * the site uses, plus cross-file rules (unique slugs, valid references).
 * Exits non-zero on any error so CI fails fast with a readable report.
 */
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { collections, dataFiles } from '../src/schemas/index.ts';
import { c, CONTENT, collectionFiles, entryId, readEntry, rel } from './lib/content.ts';

type Issue = { file: string; messages: string[] };
const errors: Issue[] = [];
const warnings: Issue[] = [];
let ok = 0;

const formatIssues = (issues: { path: PropertyKey[]; message: string }[]) =>
  issues.map((i) => `${c.bold(i.path.map(String).join('.') || '(root)')}: ${i.message}`);

/* 1 ── single-file documents ─────────────────────────────── */
for (const [file, schema] of Object.entries(dataFiles)) {
  const full = path.join(CONTENT, file);
  if (!fs.existsSync(full)) {
    if (file === 'profile.yaml' || file === 'experience.yaml')
      errors.push({ file: `content/${file}`, messages: ['File is required but missing.'] });
    continue;
  }
  try {
    const result = schema.safeParse(YAML.parse(fs.readFileSync(full, 'utf8')) ?? []);
    if (result.success) {
      ok++;
      console.log(`${c.green('✓')} ${c.dim('content/')}${file}`);
    } else errors.push({ file: `content/${file}`, messages: formatIssues(result.error.issues) });
  } catch (e) {
    errors.push({
      file: `content/${file}`,
      messages: [`YAML syntax error: ${(e as Error).message}`],
    });
  }
}

/* 2 ── directory collections ─────────────────────────────── */
const ids: Record<string, Map<string, string>> = {};
const postProjectRefs: { file: string; refs: string[] }[] = [];

for (const [name, def] of Object.entries(collections)) {
  ids[name] = new Map();
  for (const file of collectionFiles(name, def.extensions)) {
    const label = rel(file);
    try {
      const { data, body } = readEntry(file);
      const result = def.schema.safeParse(data);
      if (!result.success) {
        errors.push({ file: label, messages: formatIssues(result.error.issues) });
        continue;
      }
      const id = entryId(file, name, data);
      const dupe = ids[name]!.get(id);
      if (dupe) {
        errors.push({
          file: label,
          messages: [`Duplicate slug "${id}" — already used by ${dupe}.`],
        });
        continue;
      }
      ids[name]!.set(id, label);

      const parsed = result.data as Record<string, unknown>;
      if (name === 'blog') {
        postProjectRefs.push({ file: label, refs: (parsed['projects'] as string[]) ?? [] });
        if (parsed['status'] === 'published' && !parsed['external_url'] && body.trim().length < 50)
          warnings.push({ file: label, messages: ['Published post has almost no content.'] });
      }
      ok++;
      const suffix = parsed['status'] === 'draft' ? c.yellow(' (draft)') : '';
      console.log(
        `${c.green('✓')} ${c.dim(path.dirname(label) + '/')}${path.basename(label)}${suffix}`,
      );
    } catch (e) {
      errors.push({ file: label, messages: [(e as Error).message] });
    }
  }
}

/* 3 ── cross references ──────────────────────────────────── */
for (const { file, refs } of postProjectRefs) {
  const missing = refs.filter((r) => !ids['opensource']!.has(r));
  if (missing.length)
    errors.push({
      file,
      messages: missing.map(
        (m) =>
          `projects: "${m}" does not match any content/opensource entry (known: ${[...ids['opensource']!.keys()].join(', ') || 'none'}).`,
      ),
    });
}

/* 4 ── report ────────────────────────────────────────────── */
for (const w of warnings) {
  console.log(`\n${c.yellow('!')} ${w.file}`);
  for (const m of w.messages) console.log(`  ${c.yellow(m)}`);
}
for (const e of errors) {
  console.log(`\n${c.red('✗')} ${e.file}\n`);
  for (const m of e.messages) console.log(`  ${m}`);
}

console.log('');
if (errors.length) {
  console.log(c.red(`✗ ${errors.length} file(s) failed validation, ${ok} passed. Build failed.`));
  process.exit(1);
}
console.log(c.green(`✓ All ${ok} content files are valid.`));
