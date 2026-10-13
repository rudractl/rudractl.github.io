# rudractl.github.io

> **Git is the source of truth. Content is declarative. Deployment is automated.
> The interface feels like a modern engineering terminal.**

The personal engineering site of **Rudradev Pal** — portfolio, open-source showcase,
blog and lab notebook. Built with Astro, TypeScript and Tailwind CSS; content lives
in YAML and Markdown; GitHub Actions validates, builds and deploys it to GitHub Pages.

```text
content/*.yaml, *.md ──► Zod schemas ──► Astro build ──► GitHub Pages
                              ▲               ▲
                       npm run validate   GitHub API (stars, forks, releases)
```

## Quick start

```bash
npm install
npm run dev        # http://localhost:4321 — drafts are visible here
```

Requires Node 22.18+ (Node 24 recommended — see `.nvmrc`).

## Adding content — one file, no code

Every directory under `content/` is a collection. Drop a file in and it appears
everywhere it should: listing pages, the homepage, search, RSS, sitemap, the JSON
API and an auto-generated social card.

| I want to…                 | Command                                           | Creates                         |
| -------------------------- | ------------------------------------------------- | ------------------------------- |
| write a blog post          | `npm run new post "My post" -- --tags k8s,cilium` | `content/blog/my-post.md`       |
| add an open-source project | `npm run new project rudractl/avron`              | `content/opensource/avron.yaml` |
| log a lab experiment       | `npm run new lab "eBPF tracing"`                  | `content/lab/ebpf-tracing.md`   |
| …or be asked step by step  | `npm run new`                                     |                                 |

`npm run new project` **prefills the file from the GitHub API** (name, description,
language, topics, homepage). Then:

```bash
npm run validate
git add . && git commit -m "Add my-post" && git push
```

### Everything else is a YAML edit

| File                          | Controls                                                    |
| ----------------------------- | ----------------------------------------------------------- |
| `content/profile.yaml`        | name, role, tagline, intro, focus, interests, contact links |
| `content/experience.yaml`     | the career timeline on `/about`                             |
| `content/skills.yaml`         | grouped skills (`daily` / `experienced` / `exploring`)      |
| `content/education.yaml`      | education                                                   |
| `content/certifications.yaml` | certifications (expiry is shown automatically)              |
| `content/uses.yaml`           | the `/uses` page                                            |

Delete `education.yaml` or `certifications.yaml` (or make them `[]`) to hide those
sections.

### Content features

- **Drafts** — `status: draft` posts render in `npm run dev` but never ship to
  production, RSS, the sitemap or the API.
- **YAML _or_ Markdown** — projects and labs can be a short `.yaml` file or a `.md`
  file with front matter and a long write-up. Posts support `.md` and `.mdx`.
- **Callouts** — GitHub syntax: `> [!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, `[!CAUTION]`.
- **Cross-links** — add `projects: [avron]` to a post and it appears on the project page.
- **Series** — give posts the same `series:` name to get a series navigator.
- **Ignored files** — anything starting with `_` (e.g. `content/blog/_template.md`).
- **Editor autocomplete** — VS Code + the YAML extension validates `content/*.yaml`
  as you type using the generated JSON Schemas in `schemas/`.
- **GitHub stats are automatic** — never write stars or versions by hand.

## What's in the box

- `/` terminal hero with a once-per-session typing intro and an _optional_ tiny
  shell (`help`, `projects`, `cd blog`, `sudo hire rudradev`…)
- `/opensource`, `/blog` (search, tag filters, sort), `/lab`, `/uses`, `/about`
- **⌘K / Ctrl+K command palette** (or `/`) — searches posts, projects, labs, tags
- Dark / light themes, cross-document view transitions, CSS scroll-driven reveals,
  full `prefers-reduced-motion` support
- Syntax highlighting (Shiki, dual-theme), copy buttons, heading anchors,
  table of contents with scroll-spy
- SEO: per-page meta, canonical URLs, OpenGraph/Twitter, JSON-LD, `sitemap-index.xml`,
  `rss.xml`, `robots.txt`, **auto-generated 1200×630 social cards** for every page
- Static JSON API for tools and a future `rudractl` CLI:
  `/api/index.json`, `/api/profile.json`, `/api/projects.json`, `/api/blog.json`,
  `/api/lab.json`, `/api/search.json`
- Themed 404 (`kubectl get page …`)
- JavaScript only where it earns its place — pages are static HTML

## Commands

| Command                | What it does                                                     |
| ---------------------- | ---------------------------------------------------------------- |
| `npm run dev`          | local dev server with drafts                                     |
| `npm run new`          | scaffold a post / project / lab                                  |
| `npm run validate`     | validate all content against the schemas + cross-references      |
| `npm run fetch:github` | refresh `src/generated/github.json` (uses `GITHUB_TOKEN` if set) |
| `npm run schemas`      | regenerate JSON Schemas for editor autocomplete                  |
| `npm run build`        | production build + internal broken-link check                    |
| `npm run preview`      | serve the production build                                       |
| `npm run lint`         | Prettier + markdownlint                                          |
| `npm run typecheck`    | `astro check` (strictest TypeScript)                             |
| `npm test`             | schema, utility and build smoke tests                            |
| `npm run check`        | everything, in CI order                                          |

## CI/CD

- **`.github/workflows/ci.yml`** — every PR: validate → schema drift → lint →
  typecheck → build (+ internal link check) → tests → external link report.
- **`.github/workflows/deploy.yml`** — push to `main`: validate → fetch GitHub
  metadata → build → test → deploy to Pages. Also runs **daily** so GitHub stats
  stay fresh with zero commits.

**One-time setup:** _Settings → Pages → Build and deployment → Source: **GitHub Actions**_.
For a custom domain, add a repository variable `SITE_URL` (e.g. `https://rudractl.dev`)
and a `public/CNAME` file.

## Project structure

```text
content/            ← the CMS: YAML + Markdown
  opensource/  blog/  lab/
  profile.yaml  experience.yaml  skills.yaml  education.yaml  certifications.yaml  uses.yaml
schemas/            ← generated JSON Schemas (editor autocomplete)
scripts/            ← new · validate · fetch-github · gen-schemas · check-links
src/
  schemas/          ← Zod schemas — single source of truth for content shape
  content.config.ts ← Astro collections (glob loaders over content/)
  lib/              ← data loading, GitHub metadata, markdown, OG images
  plugins/          ← Markdown plugins: heading anchors, callouts, external links
  components/       ← terminal/, opensource/, blog/, lab/, portfolio/
  pages/            ← routes, RSS, robots, /api/*.json, /og/*.png
  scripts/          ← tiny client scripts: palette, theme, hero terminal
  styles/global.css ← design tokens (dark + light) and components
tests/
```

## Content safety

This repository is public. Never commit tokens, credentials, internal hostnames or
IPs, private repositories, customer information or confidential architecture.
Write about professional lessons in a generalized, independently-written way.
