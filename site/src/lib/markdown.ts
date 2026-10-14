import { createSatteriMarkdownProcessor } from '@astrojs/markdown-satteri';
import type { MarkdownRenderer } from '@astrojs/internal-helpers/markdown';
import { hastPlugins, shikiConfig } from '../plugins/markdown.ts';

let renderer: Promise<MarkdownRenderer> | undefined;
const cache = new Map<string, Promise<string>>();

/**
 * Render a Markdown string (e.g. a multi-line YAML field) to HTML using the same
 * pipeline as `.md` files: Shiki highlighting, callouts, heading anchors.
 */
export function renderMarkdown(source: string | undefined | null): Promise<string> {
  if (!source?.trim()) return Promise.resolve('');
  renderer ??= createSatteriMarkdownProcessor({
    syntaxHighlight: { type: 'shiki', excludeLangs: ['math'] },
    shikiConfig,
    hastPlugins,
  } as Parameters<typeof createSatteriMarkdownProcessor>[0]);
  let html = cache.get(source);
  if (!html) {
    html = renderer.then((r) => r.render(source)).then((result) => result.code);
    cache.set(source, html);
  }
  return html;
}
