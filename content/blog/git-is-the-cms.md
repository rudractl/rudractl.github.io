---
title: "Git is the CMS: Building This Site Like a Platform"
slug: git-is-the-cms
description: >
  How this portfolio uses YAML, Markdown, Zod schemas and GitHub Actions to
  behave like a tiny platform — and why adding content takes one file.
published: 2026-10-14
status: published
tags:
  - Platform Engineering
  - GitOps
  - Astro
featured: true
projects:
  - rudractl-github-io
---

This site has no admin panel, no database and no CMS. Content is a set of
files in a Git repository, and the website is what a pipeline builds from them.

## The workflow

```text
Edit YAML / Markdown ──► git push ──► GitHub Actions ──► GitHub Pages
                                         ├─ validate
                                         ├─ lint
                                         ├─ build
                                         └─ test
```

## Adding a post

```bash
npm run new post "My new post"
npm run validate
git add . && git commit -m "Add post" && git push
```

That is the whole process. No source code changes.

## Schemas are guard rails

Every file is validated with the same Zod schema at build time and in CI:

```text
$ npm run validate

✓ profile.yaml
✓ experience.yaml
✗ content/opensource/avron.yaml
  featured: Expected boolean, received string
```

Invalid content fails the pipeline, just like invalid infrastructure should.
