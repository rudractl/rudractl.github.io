#!/usr/bin/env node
/**
 * npm run new — add content in one command (run from the `site` folder).
 *
 *   npm run new                                         interactive
 *   npm run new post "Debugging Cilium" -- --tags Cilium,Networking
 *   npm run new project rudradevpal/avron               appended to content/projects.yaml
 *   npm run new lab "eBPF tracing"                      appended to content/lab.yaml
 *
 * You can always skip this and edit the files in content/ by hand.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';
import { parseArgs } from 'node:util';
import { c, CONTENT, labId, projectId, readYaml, rel, slugify } from './lib/content.ts';

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    tags: { type: 'string', short: 't' },
    mdx: { type: 'boolean', default: false },
    featured: { type: 'boolean', short: 'f', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
});

const today = new Date().toLocaleDateString('sv'); // YYYY-MM-DD, local time
const quote = (s: string) => JSON.stringify(s);
const inline = (items: string[]) =>
  `[${items.map((i) => (/[,:[\]{}#&*!|>'"%@`]/.test(i) ? quote(i) : i)).join(', ')}]`;
const usage = () =>
  console.log(`
${c.bold('rudractl content scaffolder')}

  npm run new                                   ${c.dim('# interactive')}
  npm run new post "Title" -- --tags k8s,cilium ${c.dim('# new file in content/blog (draft)')}
  npm run new project owner/repo                ${c.dim('# add details for a repo in content/projects.yaml')}
  npm run new lab "Name"                        ${c.dim('# adds to content/lab.yaml')}

  Options: --mdx (post as .mdx), --featured
`);

let rl: ReturnType<typeof createInterface> | undefined;
let stdinClosed: Promise<string> | undefined;
async function ask(question: string, fallback = ''): Promise<string> {
  if (!rl) {
    rl = createInterface({ input: process.stdin, output: process.stdout });
    stdinClosed = new Promise((resolve) => rl!.once('close', () => resolve('')));
  }
  try {
    const prompt = `${c.cyan('?')} ${question}${fallback ? c.dim(` (${fallback})`) : ''} `;
    const answer = (await Promise.race([rl.question(prompt), stdinClosed!])).trim();
    return answer || fallback;
  } catch {
    return fallback; // stdin closed (CI / piped input) — use the default
  }
}

const tagsFrom = (s: string) =>
  s
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

function nextSteps(file: string) {
  console.log(c.dim('\n  next:'));
  console.log(`    ${c.cyan('npm run dev')}        ${c.dim('# preview at http://localhost:4321')}`);
  console.log(`    ${c.cyan('npm run validate')}   ${c.dim('# check it')}`);
  console.log(
    `    ${c.cyan(`git add ../${rel(file)} && git commit -m "Update ${path.basename(file)}" && git push`)}\n`,
  );
}

/** Append one entry to a YAML list file, keeping every existing comment and entry intact. */
function appendToList(file: string, block: string) {
  const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  fs.writeFileSync(file, `${current.replace(/\s*$/, '\n')}\n${block.trimEnd()}\n`);
  console.log(`\n${c.green('✓')} added to ${c.bold(rel(file))}`);
  nextSteps(file);
}

/* ───────────── post ───────────── */
async function newPost(title: string) {
  title ||= await ask('Post title:');
  if (!title) throw new Error('A title is required.');
  const tags = tagsFrom(values.tags ?? (await ask('Tags (comma separated):', 'Kubernetes')));
  const description = await ask(
    'One-line description:',
    'TODO: describe this post in a sentence or two.',
  );
  const file = path.join(CONTENT, 'blog', `${slugify(title)}.${values.mdx ? 'mdx' : 'md'}`);
  if (fs.existsSync(file)) throw new Error(`${rel(file)} already exists — pick another title.`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(
    file,
    `---
title: ${quote(title)}
description: >
  ${description}
published: ${today}
status: draft # change to "published" when it's ready
tags: ${inline(tags)}
featured: ${values.featured}
# series: Kubernetes Internals
# projects: [avron]   # cross-link projects by id
---

Start with the problem you were solving and why it was interesting.

## Context

## What I tried

## What I learned
`,
  );
  console.log(`\n${c.green('✓')} created ${c.bold(rel(file))}`);
  nextSteps(file);
}

/* ───────────── project ───────────── */
interface Repo {
  name: string;
  description: string | null;
  topics?: string[];
  language: string | null;
}

async function newProject(repository: string) {
  repository ||= await ask('GitHub repository (owner/repo):');
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository)) throw new Error('Expected "owner/repo".');

  const file = path.join(CONTENT, 'projects.yaml');
  const cfg = ((fs.existsSync(file) ? readYaml(file) : {}) ?? {}) as {
    projects?: { repository: string; slug?: string }[] | null;
  };
  const existing = cfg.projects ?? [];
  const id = projectId({ repository });
  if (
    existing.some(
      (p) => p.repository.toLowerCase() === repository.toLowerCase() || projectId(p) === id,
    )
  )
    throw new Error(`${repository} is already in ${rel(file)}.`);

  let repo: Repo | null = null;
  try {
    const res = await fetch(`https://api.github.com/repos/${repository}`, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'rudractl-new' },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) repo = (await res.json()) as Repo;
  } catch {
    /* offline is fine */
  }
  console.log(
    repo
      ? c.green(
          `✓ found ${repository} on GitHub — name, description, stars and topics come from there`,
        )
      : c.yellow(`! couldn't reach ${repository} on GitHub — add details by hand`),
  );

  const technologies = [
    ...new Set(
      [repo?.language, ...(repo?.topics ?? []).slice(0, 4)].filter((t): t is string => !!t),
    ),
  ];
  const description = repo?.description
    ? ''
    : await ask('Short description (GitHub has none):', '');
  const lines = [
    `- repository: ${repository}`,
    ...(description ? [`  description: >`, `    ${description}`] : []),
    ...(values.featured ? ['  featured: true'] : []),
    ...(technologies.length ? [`  technologies: ${inline(technologies)}`] : []),
    `  # status: active        # active | maintenance | experimental | archived`,
    `  # highlights: [...]     # optional bullet points for the project page`,
  ];
  appendToList(file, lines.join('\n'));
}

/* ───────────── lab ───────────── */
async function newLab(name: string) {
  name ||= await ask('Experiment name:');
  if (!name) throw new Error('A name is required.');
  const file = path.join(CONTENT, 'lab.yaml');
  const existing = ((fs.existsSync(file) ? readYaml(file) : []) ?? []) as {
    name: string;
    slug?: string;
  }[];
  if (existing.some((l) => labId(l) === labId({ name })))
    throw new Error(`"${name}" is already in ${rel(file)}.`);

  const summary = await ask('One-line summary:', 'TODO: what are you testing?');
  const tech = tagsFrom(
    values.tags ?? (await ask('Technologies (comma separated):', 'Kubernetes')),
  );
  const repository = await ask('Repository (owner/repo, optional):', '');
  appendToList(
    file,
    [
      `- name: ${quote(name)}`,
      `  status: active`,
      `  started: ${today.slice(0, 7)}`,
      ...(values.featured ? ['  featured: true'] : []),
      `  technologies: ${inline(tech)}`,
      `  summary: >`,
      `    ${summary}`,
      ...(repository ? [`  repository: ${repository}`] : []),
    ].join('\n'),
  );
}

/* ───────────── main ───────────── */
try {
  if (values.help) {
    usage();
    process.exit(0);
  }
  let [type = '', ...rest] = positionals;
  if (!type) {
    usage();
    type = await ask('What do you want to add? [post / project / lab]:', 'post');
  }
  const arg = rest[0] ?? '';
  switch (type.toLowerCase()) {
    case 'post':
    case 'blog':
      await newPost(arg);
      break;
    case 'project':
    case 'opensource':
    case 'oss':
      await newProject(arg);
      break;
    case 'lab':
    case 'experiment':
      await newLab(arg);
      break;
    default:
      usage();
      throw new Error(`Unknown content type "${type}".`);
  }
} catch (e) {
  console.error(c.red(`✗ ${(e as Error).message}`));
  process.exitCode = 1;
} finally {
  rl?.close();
}
