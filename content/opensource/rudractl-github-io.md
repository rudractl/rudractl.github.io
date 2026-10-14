---
name: rudractl.github.io
slug: rudractl-github-io
repository: rudractl/rudractl.github.io
description: >
  This website. A Git-driven portfolio where content is declarative YAML and
  Markdown, validated with schemas and shipped by GitHub Actions.
featured: false
status: active
role: creator
order: 5
technologies:
  - Astro
  - TypeScript
  - Tailwind CSS
  - GitHub Actions
categories:
  - web
  - platform
highlights:
  - Git is the CMS — no admin panel, no database
  - Zod-validated content that fails CI when it's wrong
  - GitHub metadata fetched at build time, never from the browser
---

## Why I built it

A portfolio should not just _say_ "platform engineer" — it should behave like
one. This site treats content the way I treat infrastructure: declarative
files, a schema, a pipeline and an automated rollout.

## Architecture

```text
content/*.yaml, *.md ──► Zod schemas ──► Astro build ──► GitHub Pages
                               ▲               ▲
                        npm run validate   GitHub API (stars, releases)
```

- Every directory under `content/` is a collection. Drop a file in, it appears.
- `npm run new` scaffolds posts, projects and lab entries from templates.
- Static JSON endpoints under `/api/*.json` make the site consumable by a future `rudractl` CLI.

## Technical decisions

- **Static first.** Pages ship as HTML; JavaScript is limited to the hero
  terminal, command palette and small progressive enhancements.
- **Cross-document view transitions** instead of a client-side router.
- **Build-time GitHub data** with a committed cache so builds never break
  when the API is unavailable.

## What I learned

Treating a personal site like a production system is fun — and it makes
adding content almost frictionless.
