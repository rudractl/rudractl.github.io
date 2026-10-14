/**
 * rudractl-sh engine tests, fed by the built static API in dist/api.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve('dist');
const skip = !fs.existsSync(path.join(dist, 'api/profile.json')) && 'run `npm run build` first';

// Serve /api/*.json from dist/ so the engine can load data without a server.
globalThis.fetch = (async (input: string) =>
  new Response(fs.readFileSync(path.join(dist, String(input)), 'utf8'))) as typeof fetch;

const { run, complete } = await import('../src/scripts/shell/engine.ts');
const text = (html: string | void) => (html ?? '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&');
const host = () => ({ cwd: '', history: [] as string[], clear() {}, navigate() {} });

test('ls, cd and pwd move through the virtual filesystem', { skip }, async () => {
  const h = host();
  assert.match(text(await run('ls', h)), /opensource\/.*blog\/.*lab\//);
  await run('cd blog', h);
  assert.equal(h.cwd, 'blog');
  assert.equal(text(await run('pwd', h)), '/home/visitor/blog');
  await run('cd ..', h);
  assert.equal(h.cwd, '');
  assert.match(text(await run('cd nope', h)), /no such directory/);
});

test('cat reads files and entries', { skip }, async () => {
  const h = host();
  assert.match(text(await run('cat about.md', h)), /Rudradev Pal/);
  const projects = JSON.parse(fs.readFileSync(path.join(dist, 'api/projects.json'), 'utf8')) as {
    slug: string;
    name: string;
  }[];
  const first = projects[0]!;
  assert.match(
    text(await run(`cat opensource/${first.slug}`, h)),
    new RegExp(first.name.split(' ')[0]!),
  );
  assert.match(text(await run('cat blog', h)), /Is a directory/);
});

test('aliases, kubectl and unknown commands', { skip }, async () => {
  const h = host();
  assert.match(text(await run('rudractl whoami', h)), /Senior Platform Engineer/);
  assert.match(text(await run('kubectl get labs', h)), /NAME\s+STATUS/);
  assert.match(text(await run('flibbertigibbet', h)), /command not found/);
});

test('tab completion completes commands and paths', { skip }, async () => {
  const h = host();
  await run('help', h); // ensures data is loaded
  assert.equal(complete('neo', h).line, 'neofetch ');
  assert.equal(complete('cd op', h).line, 'cd opensource/');
  assert.ok(complete('c', h).options.includes('cat'));
});
