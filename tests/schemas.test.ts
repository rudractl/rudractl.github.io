import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  labSchema,
  postSchema,
  projectSchema,
  skillsSchema,
  usesSchema,
} from '../src/schemas/index.ts';

test('project: minimal valid entry gets sensible defaults', () => {
  const p = projectSchema.parse({ name: 'Avron', repository: 'rudractl/avron', description: 'x' });
  assert.equal(p.featured, false);
  assert.equal(p.status, 'active');
  assert.equal(p.role, 'creator');
  assert.deepEqual(p.technologies, []);
});

test('project: rejects a string where a boolean is expected', () => {
  const r = projectSchema.safeParse({
    name: 'A',
    repository: 'a/b',
    description: 'x',
    featured: 'yes',
  });
  assert.equal(r.success, false);
  assert.deepEqual(r.error?.issues[0]?.path, ['featured']);
});

test('project: repository must be owner/repo', () => {
  assert.equal(
    projectSchema.safeParse({ name: 'A', repository: 'https://github.com/a/b', description: 'x' })
      .success,
    false,
  );
});

test('post: coerces dates, defaults to published, validates slugs', () => {
  const p = postSchema.parse({ title: 'T', description: 'D', published: '2026-10-13' });
  assert.ok(p.published instanceof Date);
  assert.equal(p.status, 'published');
  assert.equal(p.reading_time, 'auto');
  assert.equal(
    postSchema.safeParse({
      title: 'T',
      description: 'D',
      published: '2026-10-13',
      slug: 'Not A Slug',
    }).success,
    false,
  );
});

test('lab: status is constrained', () => {
  assert.equal(labSchema.safeParse({ name: 'L', summary: 's', status: 'done' }).success, false);
  assert.equal(labSchema.parse({ name: 'L', summary: 's' }).status, 'active');
});

test('skills and uses accept plain strings or objects', () => {
  const skills = skillsSchema.parse([
    { group: 'G', items: ['Go', { name: 'Rust', level: 'exploring' }] },
  ]);
  assert.deepEqual(skills[0]?.items, [
    { name: 'Go', level: undefined },
    { name: 'Rust', level: 'exploring' },
  ]);
  const uses = usesSchema.parse([{ group: 'G', items: ['zsh', { name: 'k9s', note: 'nice' }] }]);
  assert.equal(uses[0]?.items[1]?.note, 'nice');
});
