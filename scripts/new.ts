#!/usr/bin/env node
/**
 * npm run new — scaffold content in one command.
 *
 *   npm run new                                   interactive
 *   npm run new post "Debugging Cilium" -- --tags Cilium,Networking
 *   npm run new project rudractl/avron            prefilled from the GitHub API
 *   npm run new lab "eBPF tracing"
 *
 * No application code changes are ever needed — drop the file in, commit, push.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';
import { parseArgs } from 'node:util';
import { c, CONTENT, rel, slugify } from './lib/content.ts';

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    tags: { type: 'string', short: 't' },
    mdx: { type: 'boolean', default: false },
    yaml: { type: 'boolean', default: false },
    featured: { type: 'boolean', short: 'f', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
});

const today = new Date().toLocaleDateString('sv'); // YYYY-MM-DD, local time
const list = (items: string[], indent = '  ') =>
  items.length ? items.map((i) => `\n${indent}- ${i}`).join('') : ' []';
const quote = (s: string) => JSON.stringify(s);
const usage = () =>
  console.log(`
${c.bold('rudractl content scaffolder')}

  npm run new                                  ${c.dim('# interactive')}
  npm run new post "Title" -- --tags k8s,cilium ${c.dim('# blog post (draft)')}
  npm run new project owner/repo               ${c.dim('# open-source project, prefilled from GitHub')}
  npm run new lab "Name"                       ${c.dim('# lab experiment')}

  Options: --mdx (post as .mdx), --yaml (lab as .yaml), --featured
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

function write(file: string, content: string) {
  const base = path.basename(file).replace(/\.[^.]+$/, '');
  const clash = fs.existsSync(path.dirname(file))
    ? fs.readdirSync(path.dirname(file)).find((f) => f.replace(/\.[^.]+$/, '') === base)
    : undefined;
  if (clash) {
    console.error(
      c.red(`✗ ${rel(path.join(path.dirname(file), clash))} already exists — pick another name.`),
    );
    process.exit(1);
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  console.log(`\n${c.green('✓')} created ${c.bold(rel(file))}\n`);
  console.log(c.dim('  next:'));
  console.log(`    ${c.cyan('npm run dev')}        ${c.dim('# preview at http://localhost:4321')}`);
  console.log(`    ${c.cyan('npm run validate')}   ${c.dim('# check it against the schema')}`);
  console.log(
    `    ${c.cyan(`git add ${rel(file)} && git commit -m "Add ${path.basename(file)}" && git push`)}\n`,
  );
}

/* ───────────── post ───────────── */
async function newPost(title: string) {
  title ||= await ask('Post title:');
  if (!title) throw new Error('A title is required.');
  const tags = (values.tags ?? (await ask('Tags (comma separated):', 'Kubernetes')))
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  const description =
    positionals[2] ??
    (await ask('One-line description:', 'TODO: describe this post in a sentence or two.'));
  const slug = slugify(title);
  const ext = values.mdx ? 'mdx' : 'md';
  write(
    path.join(CONTENT, 'blog', `${slug}.${ext}`),
    `---
title: ${quote(title)}
description: >
  ${description}
published: ${today}
status: draft # change to "published" when it's ready
tags:${list(tags)}
featured: ${values.featured}
# series: Kubernetes Internals
# projects: [avron]   # cross-link open-source projects by slug
---

Start with the problem you were solving and why it was interesting.

## Context

## What I tried

\`\`\`bash
kubectl get nodes -o wide
\`\`\`

> [!TIP]
> Callouts use GitHub syntax: NOTE, TIP, IMPORTANT, WARNING, CAUTION.

## What I learned
`,
  );
}

/* ───────────── project ───────────── */
interface Repo {
  name: string;
  full_name: string;
  description: string | null;
  topics?: string[];
  language: string | null;
  homepage: string | null;
}

async function newProject(repository: string) {
  repository ||= await ask('GitHub repository (owner/repo):');
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository)) throw new Error('Expected "owner/repo".');

  let repo: Repo | null = null;
  try {
    const res = await fetch(`https://api.github.com/repos/${repository}`, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'rudractl-new' },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) repo = (await res.json()) as Repo;
  } catch {
    /* offline is fine — fall back to prompts */
  }
  if (repo) console.log(c.green(`✓ found ${repo.full_name} on GitHub — prefilling`));
  else console.log(c.yellow(`! couldn't reach ${repository} on GitHub — filling in by hand`));

  const repoName = repository.split('/')[1] ?? repository;
  const name = repo?.name ?? (await ask('Project name:', repoName));
  const description =
    repo?.description ?? (await ask('Short description:', 'TODO: what does it do?'));
  const technologies = [
    ...new Set(
      [repo?.language, ...(repo?.topics ?? []).slice(0, 4)].filter((t): t is string => !!t),
    ),
  ];
  const slug = slugify(name);

  write(
    path.join(CONTENT, 'opensource', `${slug}.yaml`),
    `# yaml-language-server: $schema=../../schemas/opensource.schema.json
# Stars, forks, releases, license and topics are fetched from GitHub
# automatically — only write what GitHub can't know.

name: ${name}
slug: ${slug}
repository: ${repository}

description: >
  ${description}

# long_description: >
#   A longer explanation used at the top of the project page.

featured: ${values.featured}
status: active # active | maintenance | experimental | archived
role: creator # creator | maintainer | contributor

technologies:${list(technologies.length ? technologies : ['TODO'])}

categories:
  - infrastructure

links:
  documentation: null
  website: ${repo?.homepage ? repo.homepage : 'null'}

highlights:
  - TODO

# The story behind the project (Markdown). Delete any you don't need.
why: |
  Why did this need to exist?

architecture: |
  How does it fit together?

decisions: |
  - Trade-off one
  - Trade-off two

learned: |
  What would you do differently next time?
`,
  );
}

/* ───────────── lab ───────────── */
async function newLab(name: string) {
  name ||= await ask('Experiment name:');
  if (!name) throw new Error('A name is required.');
  const summary = await ask('One-line summary:', 'TODO: what are you testing?');
  const tech = (values.tags ?? (await ask('Technologies (comma separated):', 'Kubernetes')))
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  const slug = slugify(name);
  const head = `name: ${quote(name)}
slug: ${slug}
status: active # planned | active | complete | paused
started: ${today}
featured: ${values.featured}
technologies:${list(tech)}
summary: >
  ${summary}
repository: null`;

  if (values.yaml) {
    write(path.join(CONTENT, 'lab', `${slug}.yaml`), `${head}\nnotes: |\n  ## Goals\n\n  - TODO\n`);
  } else {
    write(
      path.join(CONTENT, 'lab', `${slug}.md`),
      `---\n${head}\n---\n\n## Goals\n\n1. TODO\n\n## Notes\n\n## Results\n`,
    );
  }
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
    type = await ask('What do you want to create? [post / project / lab]:', 'post');
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
