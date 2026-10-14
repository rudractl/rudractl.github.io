import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { satteri } from '@astrojs/markdown-satteri';
import tailwindcss from '@tailwindcss/vite';
import { hastPlugins, shikiConfig } from './src/plugins/markdown.ts';

// GitHub Pages user site → served from the domain root.
// Override with SITE_URL when using a custom domain (e.g. https://rudractl.dev).
const site = process.env['SITE_URL'] ?? 'https://rudractl.github.io';

export default defineConfig({
  site,
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  integrations: [
    mdx(),
    sitemap({
      // Drafts never get built in production, so the sitemap stays clean automatically.
      filter: (page) => !page.includes('/api/') && !page.includes('/og/'),
    }),
  ],
  markdown: {
    processor: satteri({ hastPlugins }),
    shikiConfig,
  },
  vite: {
    plugins: [tailwindcss()],
    // Content lives in ../content, outside this folder.
    server: { fs: { allow: ['..'] } },
  },
});
