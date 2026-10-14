/**
 * HAST plugins for Astro's Sätteri Markdown pipeline.
 *
 *  - headingAnchors: stable ids + a hoverable `#` link on h2–h4
 *  - callouts:       GitHub-style alerts  > [!NOTE] / [!TIP] / [!IMPORTANT] / [!WARNING] / [!CAUTION]
 *  - externalLinks:  open off-site links in a new tab, safely
 */
import Slugger from 'github-slugger';
import { defineHastPlugin } from 'satteri';

export const headingAnchors = () => {
  const slugger = new Slugger();
  return defineHastPlugin({
    name: 'heading-anchors',
    element: {
      filter: ['h2', 'h3', 'h4'],
      visit(node, ctx) {
        const existing = node.properties?.['id'];
        const id = typeof existing === 'string' ? existing : slugger.slug(ctx.textContent(node));
        if (typeof existing !== 'string') ctx.setProperty(node, 'id', id);
        ctx.appendChild(node, {
          type: 'element',
          tagName: 'a',
          properties: {
            href: `#${id}`,
            className: ['heading-anchor'],
            ariaHidden: 'true',
            tabIndex: -1,
          },
          children: [{ type: 'text', value: '#' }],
        });
      },
    },
  });
};

const CALLOUT = /^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i;
const CALLOUT_ICONS: Record<string, string> = {
  note: 'ℹ',
  tip: '✦',
  important: '◆',
  warning: '▲',
  caution: '✖',
};

/**
 * Mutates in place: tags the blockquote, prepends a title, and strips the
 * `[!TYPE]` marker from its first text node. (Rebuilding the subtree would
 * lose Sätteri's lazily-materialised children.)
 */
export const callouts = defineHastPlugin({
  name: 'callouts',
  element: {
    filter: ['blockquote'],
    visit(node, ctx) {
      const match = ctx.textContent(node).match(CALLOUT);
      if (!match?.[1]) return;
      const kind = match[1].toLowerCase();
      ctx.setProperty(node, 'className', ['callout', `callout-${kind}`]);
      ctx.setProperty(node, 'role', 'note');
      ctx.prependChild(node, {
        type: 'element',
        tagName: 'p',
        properties: { className: ['callout-title'] },
        children: [
          {
            type: 'element',
            tagName: 'span',
            properties: { ariaHidden: 'true' },
            children: [{ type: 'text', value: CALLOUT_ICONS[kind] ?? '•' }],
          },
          { type: 'text', value: ` ${kind}` },
        ],
      });
    },
  },
  text(node, ctx) {
    if (!CALLOUT.test(node.value)) return;
    // Only the marker that opens a paragraph (GitHub only recognises it inside a blockquote,
    // and a literal "[!NOTE]" starting a normal paragraph is vanishingly rare).
    const p = ctx.parent(node);
    if (p?.type === 'element' && p.tagName === 'p' && ctx.indexOf(node) === 0) {
      ctx.replaceNode(node, { type: 'text', value: node.value.replace(CALLOUT, '') });
    }
  },
});

export const externalLinks = defineHastPlugin({
  name: 'external-links',
  element: {
    filter: ['a'],
    visit(node, ctx) {
      const href = node.properties?.['href'];
      if (typeof href === 'string' && /^https?:\/\//.test(href)) {
        ctx.setProperty(node, 'target', '_blank');
        ctx.setProperty(node, 'rel', ['noopener', 'noreferrer']);
      }
    },
  },
});

export const hastPlugins = [headingAnchors, callouts, externalLinks];

/** Shared with `src/lib/markdown.ts` so YAML-embedded Markdown is highlighted identically. */
export const shikiConfig = {
  themes: { light: 'github-light', dark: 'github-dark-dimmed' },
  defaultColor: false,
  wrap: false,
} as const;
