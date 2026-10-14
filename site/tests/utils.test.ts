import { test } from 'node:test';
import assert from 'node:assert/strict';
import { plainText, plural, timeAgo } from '../src/lib/format.ts';
import { slugify } from '../scripts/lib/content.ts';

test('slugify produces kebab-case ids', () => {
  assert.equal(slugify('Hello World: A Test!'), 'hello-world-a-test');
  assert.equal(slugify('  Ünïcode — dashes  '), 'unicode-dashes');
  assert.equal(slugify('rudractl.github.io'), 'rudractl-github-io');
});

test('plainText strips markdown for search and excerpts', () => {
  const md =
    '## Title\n\nSome **bold** and `code` with a [link](https://x.y).\n\n```bash\nrm -rf /\n```\n> [!NOTE]\n> hi';
  const text = plainText(md);
  assert.ok(text.includes('Some bold and code with a link'));
  assert.ok(!text.includes('rm -rf'));
  assert.ok(!text.includes('[!NOTE]'));
});

test('timeAgo and plural', () => {
  const now = new Date('2026-10-14T00:00:00Z');
  assert.equal(timeAgo('2026-10-12T00:00:00Z', now), '2 days ago');
  assert.equal(plural(1, 'post'), '1 post');
  assert.equal(plural(3, 'post'), '3 posts');
});
