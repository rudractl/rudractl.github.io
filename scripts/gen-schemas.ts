#!/usr/bin/env node
/**
 * npm run schemas — export the Zod content schemas as JSON Schema so editors
 * (VS Code + YAML extension) autocomplete and validate content as you type.
 */
import fs from 'node:fs';
import path from 'node:path';
import { z } from 'astro/zod';
import { collections, dataFiles } from '../src/schemas/index.ts';
import { c, ROOT } from './lib/content.ts';

const OUT = path.join(ROOT, 'schemas');
fs.mkdirSync(OUT, { recursive: true });

const targets: [string, z.ZodType][] = [
  ...Object.entries(dataFiles).map(
    ([file, schema]) => [file.replace(/\.yaml$/, ''), schema] as [string, z.ZodType],
  ),
  ...Object.entries(collections).map(([name, def]) => [name, def.schema] as [string, z.ZodType]),
];

for (const [name, schema] of targets) {
  const json = z.toJSONSchema(schema, { io: 'input', unrepresentable: 'any', target: 'draft-7' });
  const file = path.join(OUT, `${name}.schema.json`);
  fs.writeFileSync(file, JSON.stringify(json, null, 2) + '\n');
  console.log(`${c.green('✓')} schemas/${name}.schema.json`);
}
