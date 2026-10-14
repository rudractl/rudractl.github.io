#!/usr/bin/env node
/**
 * npm run validate — checks every content file against the same Zod schemas
 * the site uses, plus cross-file rules (unique ids, valid references).
 * Exits non-zero on any error so CI fails fast with a readable report.
 */
import fs from 'node:fs';
import path from 'node:path';
import { collections, dataFiles, listFiles } from '../src/schemas/index.ts';
import {
  c,
  CONTENT,
  collectionFiles,
  labId,
  postId,
  projectId,
  readMarkdown,
  readYaml,
  rel,
  ROOT,
} from './lib/content.ts';

type Issue = { file: string; messages: string[] };
const errors: Issue[] = [];
const warnings: Issue[] = [];
let ok = 0;

const formatIssues = (issues: { path: PropertyKey[]; message: string }[], prefix = '') =>
  issues.map((i) => `${c.bold(prefix + (i.path.map(String).join('.') || '(root)'))}: ${i.message}`);
const pass = (label: string, suffix = '') => {
  ok++;
  console.log(
    `${c.green('✓')} ${c.dim(path.dirname(label) + '/')}${path.basename(label)}${suffix}`,
  );
};

/* 1 ── single documents (profile, experience, …) ─────────── */
for (const [name, schema] of Object.entries(dataFiles)) {
  const file = path.join(CONTENT, name);
  const label = rel(file);
  if (!fs.existsSync(file)) {
    if (name === 'profile.yaml')
      errors.push({ file: label, messages: ['File is required but missing.'] });
    continue;
  }
  try {
    const result = schema.safeParse(readYaml(file) ?? []);
    if (result.success) pass(label);
    else errors.push({ file: label, messages: formatIssues(result.error.issues) });
  } catch (e) {
    errors.push({ file: label, messages: [`YAML syntax error: ${(e as Error).message}`] });
  }
}

/* 2 ── lists (projects.yaml, lab.yaml) ───────────────────── */
const ids: Record<string, Set<string>> = { 'projects.yaml': new Set(), 'lab.yaml': new Set() };
const github = (() => {
  const f = path.join(ROOT, 'src/generated/github.json');
  return fs.existsSync(f)
    ? (JSON.parse(fs.readFileSync(f, 'utf8')) as Record<string, { description?: string | null }>)
    : {};
})();

for (const [name, schema] of Object.entries(listFiles)) {
  const file = path.join(CONTENT, name);
  const label = rel(file);
  if (!fs.existsSync(file)) continue;
  let list: unknown;
  try {
    list = readYaml(file) ?? [];
  } catch (e) {
    errors.push({ file: label, messages: [`YAML syntax error: ${(e as Error).message}`] });
    continue;
  }
  if (!Array.isArray(list)) {
    errors.push({ file: label, messages: ['Expected a list (each entry starts with "- ").'] });
    continue;
  }
  const messages: string[] = [];
  const notes: string[] = [];
  list.forEach((raw, i) => {
    const result = schema.safeParse(raw);
    const who =
      (raw as { repository?: string; name?: string })?.repository ??
      (raw as { name?: string })?.name ??
      `#${i + 1}`;
    if (!result.success) {
      messages.push(...formatIssues(result.error.issues, `[${who}] `));
      return;
    }
    const data = result.data as {
      slug?: string;
      repository?: string;
      name?: string;
      description?: string;
    };
    const id =
      name === 'projects.yaml'
        ? projectId(data as { repository: string })
        : labId(data as { name: string });
    if (ids[name]!.has(id))
      messages.push(`${c.bold(`[${who}]`)} duplicate id "${id}" — add a unique \`slug:\`.`);
    ids[name]!.add(id);
    if (
      name === 'projects.yaml' &&
      !data.description &&
      !github[data.repository!.toLowerCase()]?.description
    )
      notes.push(
        `[${who}] has no description here or on GitHub — add \`description:\` (or set the repo's About on GitHub).`,
      );
  });
  if (messages.length) errors.push({ file: label, messages });
  else pass(label, c.dim(` (${list.length} entries)`));
  if (notes.length) warnings.push({ file: label, messages: notes });
}

/* 3 ── blog posts (one file each) ────────────────────────── */
const postIds = new Map<string, string>();
const postRefs: { file: string; refs: string[] }[] = [];
for (const file of collectionFiles('blog', collections.blog.extensions)) {
  const label = rel(file);
  try {
    const { data, body } = readMarkdown(file);
    const result = collections.blog.schema.safeParse(data);
    if (!result.success) {
      errors.push({ file: label, messages: formatIssues(result.error.issues) });
      continue;
    }
    const id = postId(file, data);
    const dupe = postIds.get(id);
    if (dupe) {
      errors.push({ file: label, messages: [`Duplicate slug "${id}" — already used by ${dupe}.`] });
      continue;
    }
    postIds.set(id, label);
    postRefs.push({ file: label, refs: result.data.projects });
    if (result.data.status === 'published' && !result.data.external_url && body.trim().length < 50)
      warnings.push({ file: label, messages: ['Published post has almost no content.'] });
    pass(label, result.data.status === 'draft' ? c.yellow(' (draft)') : '');
  } catch (e) {
    errors.push({ file: label, messages: [(e as Error).message] });
  }
}

/* 4 ── cross references ──────────────────────────────────── */
for (const { file, refs } of postRefs) {
  const missing = refs.filter((r) => !ids['projects.yaml']!.has(r));
  if (missing.length)
    errors.push({
      file,
      messages: missing.map(
        (m) =>
          `projects: "${m}" is not in content/projects.yaml (known: ${[...ids['projects.yaml']!].join(', ') || 'none'}).`,
      ),
    });
}

/* 5 ── report ────────────────────────────────────────────── */
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
