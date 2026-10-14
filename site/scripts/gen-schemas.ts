#!/usr/bin/env node
/**
 * npm run schemas — export the Zod content schemas as JSON Schema so editors
 * (VS Code + YAML extension) autocomplete and validate content/*.yaml as you type.
 * Each YAML file points at its schema via a `# yaml-language-server: $schema=` comment.
 */
import fs from 'node:fs';
import path from 'node:path';
import { z } from 'astro/zod';
import { collections, dataFiles, listFiles } from '../src/schemas/index.ts';
import { c, ROOT } from './lib/content.ts';

const OUT = path.join(ROOT, 'schemas');
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const targets: [string, z.ZodType][] = [
  ...Object.entries(dataFiles).map(
    ([f, s]) => [f.replace(/\.yaml$/, ''), s] as [string, z.ZodType],
  ),
  ...Object.entries(listFiles).map(
    ([f, s]) => [f.replace(/\.yaml$/, ''), z.array(s)] as [string, z.ZodType],
  ),
  ...Object.entries(collections).map(([n, d]) => [n, d.schema] as [string, z.ZodType]),
];

for (const [name, schema] of targets) {
  const json = z.toJSONSchema(schema, { io: 'input', unrepresentable: 'any', target: 'draft-7' });
  fs.writeFileSync(path.join(OUT, `${name}.schema.json`), JSON.stringify(json, null, 2) + '\n');
}
console.log(`${c.green('✓')} ${targets.length} JSON Schemas → site/schemas/`);
