# Rudradev Pal — Personal Engineering Portfolio

## Product, Design and Technical Specification

**Project Type:** Open-source personal portfolio and engineering blog  
**Primary Audience:** Engineers, recruiters, hiring managers, open-source contributors and technical community  
**Primary Persona:** Kubernetes / Platform / Infrastructure / DevOps Engineer  
**Content Model:** Git-managed YAML + Markdown/MDX  
**Deployment:** GitHub Actions + GitHub Pages  
**Design Direction:** Modern terminal-inspired interface with tasteful animations  
**Recommended Stack:** Astro + TypeScript + Tailwind CSS

---

# 1. Project Vision

Build a modern personal engineering website for **Rudradev Pal** that acts as both a professional portfolio and an actively maintained engineering presence on the web.

The website should communicate three things immediately:

1. Who Rudradev is as an engineer.
2. What open-source projects he builds.
3. What he knows and writes about.

The website must not feel like a traditional résumé template.

It should feel like a modern developer interface inspired by terminals, Kubernetes tooling, command-line applications and infrastructure dashboards.

The terminal aesthetic should provide personality without compromising usability.

The website must still behave like a normal modern website:

- normal navigation
- clickable links
- responsive design
- readable typography
- SEO-friendly pages
- accessible components
- mobile support
- fast loading
- direct URLs for every important page

The terminal theme is a **visual and interaction layer**, not the navigation mechanism.

---

# 2. Core Principles

## 2.1 Git is the CMS

There should be no traditional CMS or admin panel.

Website content should be managed through Git.

Content should primarily live in:

- YAML
- Markdown
- MDX

Typical workflow:

```text
Edit YAML / Markdown
        │
        ▼
git commit
        │
        ▼
git push
        │
        ▼
GitHub Actions
        │
        ├── Validate content
        ├── Lint
        ├── Check links
        ├── Build
        └── Test
        │
        ▼
Deploy
        │
        ▼
Website updated
```

---

# 3. Important Content Separation

The following areas are independent sections and MUST NOT be merged into one generic content system.

## 3.1 Open Source Projects

Contains projects created, maintained or significantly contributed to by Rudradev.

Purpose:

- showcase engineering work
- explain why projects exist
- demonstrate technical ability
- link directly to GitHub repositories
- display relevant repository metadata

Route:

```text
/opensource
```

---

## 3.2 Blog

Long-form engineering writing.

Examples:

- Kubernetes
- Platform Engineering
- Infrastructure
- Linux
- Networking
- GitOps
- DevOps
- Terraform/OpenTofu
- Containers
- Engineering experiments

Route:

```text
/blog
```

Each article:

```text
/blog/<slug>
```

---

## 3.3 Portfolio / About Me

Professional information about Rudradev.

This includes:

- introduction
- professional experience
- engineering interests
- skills
- technology experience
- career timeline
- education
- certifications
- contact information

Routes:

```text
/about
```

or related portfolio sections.

Open-source projects and blog posts should NOT be stored as part of the About/Portfolio data.

---

# 4. Information Architecture

Primary website structure:

```text
/
├── /opensource
│   └── /opensource/<project>
│
├── /blog
│   └── /blog/<article>
│
├── /lab
│   └── /lab/<experiment>
│
├── /uses
│
└── /about
```

Primary navigation:

```text
Home
Open Source
Blog
Lab
Uses
About
```

Desktop navigation could visually resemble:

```text
rudractl.dev

~/home   ~/opensource   ~/blog   ~/lab   ~/uses   ~/about
```

But these MUST remain standard links.

---

# 5. Homepage

Route:

```text
/
```

The homepage should be a high-level introduction.

It should NOT duplicate every piece of content from other sections.

---

## 5.1 Hero

Suggested visual:

```text
┌──────────────────────────────────────────────────────────────┐
│ rudra@platform:~$ whoami                                     │
│                                                              │
│ Rudradev Pal                                                 │
│ Platform & Infrastructure Engineer                           │
│                                                              │
│ I build Kubernetes platforms, infrastructure automation      │
│ and reliable distributed systems.                            │
│                                                              │
│ > Kubernetes                                                 │
│ > Platform Engineering                                       │
│ > Infrastructure                                             │
│ > Automation                                                 │
│                                                              │
│ [ Explore Open Source ]        [ Read Blog ]                  │
│                                                              │
│ █                                                            │
└──────────────────────────────────────────────────────────────┘
```

The command can animate:

```text
r
ru
rud
rudractl
rudractl whoami
```

Then the result appears.

The animation should only happen on initial page load and should be fast.

Do NOT make visitors wait several seconds before seeing content.

---

# 6. Terminal Design Language

The website should have a terminal-inspired personality without looking like a terminal emulator from the 1990s.

Think:

```text
modern developer tooling
+
terminal
+
cloud-native dashboard
+
minimal portfolio
```

Avoid:

```text
fake hacker UI
Matrix rain
excessive neon
constant typing effects
green text everywhere
fake security console
over-animation
```

---

# 7. Visual System

## Background

Use a very dark neutral background rather than absolute black.

Conceptually:

```text
background-primary
background-secondary
surface
surface-hover
border-subtle
```

## Typography

Use two typography categories.

### UI / body

Modern sans-serif font.

Used for:

- paragraphs
- navigation
- project descriptions
- blog content

### Technical elements

Monospace font.

Used for:

- commands
- labels
- metadata
- tags
- terminal components
- code
- technical statistics

Potential fonts:

```text
Inter
Geist
Geist Mono
JetBrains Mono
IBM Plex Mono
```

Use web-safe/open-source fonts.

---

# 8. Color System

The site should primarily be dark.

Suggested conceptual tokens:

```text
--background
--surface
--surface-elevated

--text-primary
--text-secondary
--text-muted

--accent
--accent-secondary

--success
--warning
--error

--border
```

Accent colors should be subtle.

Potential inspiration:

- terminal green
- Kubernetes blue
- cyan
- violet

Do NOT make every component brightly colored.

Color should communicate hierarchy and state.

---

# 9. Animation Philosophy

Animations should communicate that the website is alive without becoming distracting.

Target:

```text
fast
subtle
purposeful
technical
```

---

## 9.1 Initial Terminal Animation

Example:

```text
$ rudractl whoami
```

Typing animation.

Then:

```text
Rudradev Pal
Platform & Infrastructure Engineer
```

Fade/slide into view.

---

## 9.2 Cursor

Animated terminal cursor:

```text
█
```

or

```text
_
```

Use a subtle blink.

---

## 9.3 Cards

When hovering:

```text
translateY(-2px)
border highlight
small glow
```

Avoid large transformations.

---

## 9.4 Page Transitions

Sections can fade upward slightly.

Example:

```text
opacity: 0 → 1
translateY: 8px → 0
```

Duration:

```text
150–300ms
```

---

## 9.5 Reduced Motion

Respect:

```css
@media (prefers-reduced-motion: reduce)
```

Disable:

- typing animations
- animated cursors
- unnecessary transitions

Accessibility takes priority over aesthetics.

---

# 10. Open Source Section

Route:

```text
/opensource
```

This is one of the most important sections.

It showcases actual open-source engineering work.

---

# 11. Open Source Landing Page

Header:

```text
$ rudractl projects --opensource
```

Example layout:

```text
Open Source
────────────────────────────────────────────

Things I build, maintain and experiment with
in public.

Featured

┌───────────────────────────────────────────┐
│ Avron                                     │
│                                           │
│ Description of project...                 │
│                                           │
│ Go   Kubernetes   Docker                  │
│                                           │
│ ★ 120    Forks 12    v0.8.0               │
│                                           │
│ [GitHub]                    [Details →]    │
└───────────────────────────────────────────┘
```

---

# 12. Open Source Project Data

Project definitions should live under:

```text
content/opensource/
```

Example:

```yaml
name: Avron

slug: avron

repository: rudractl/avron

description: >
  Short description explaining what the project does.

long_description: >
  Longer explanation used on the project page.

featured: true

status: active

role: creator

technologies:
  - Go
  - Kubernetes
  - Docker

categories:
  - devops
  - infrastructure

links:
  documentation: null
  website: null

highlights:
  - Infrastructure automation
  - Container-native architecture
  - Developer-focused tooling
```

---

# 13. GitHub Metadata

Repository statistics should NOT be manually maintained where possible.

During build or through scheduled automation, retrieve:

```text
repository description
stars
forks
watchers
primary language
topics
latest release
license
last commit/update
repository URL
```

The project YAML should contain intentional editorial information.

GitHub should provide dynamic repository information.

Concept:

```text
Project YAML
      │
      │
      ├──────────────┐
      │              │
      ▼              ▼
Editorial data   GitHub API
      │              │
      └──────┬───────┘
             ▼
       Project Model
             │
             ▼
          Website
```

---

# 14. Project Detail Page

Route:

```text
/opensource/<slug>
```

Example:

```text
$ rudractl project describe avron

AVRON
────────────────────────────────────────────

Infrastructure automation ...

Repository
github.com/...

Status
Active

Tech
Go / Kubernetes / Docker

GitHub
★ 120
⑂ 12

Latest Release
v0.8.0

────────────────────────────────────────────

Why I Built It

...

Architecture

...

Technical Decisions

...

What I Learned

...

[View Source]
```

The purpose is not simply to reproduce the GitHub README.

It should explain the engineering thinking behind the project.

---

# 15. Blog

Route:

```text
/blog
```

The blog is completely separate from Open Source.

Blog content:

```text
content/blog/
```

Example:

```text
content/blog/
├── kubernetes-upgrades.md
├── understanding-cilium.md
└── building-rke2-airgap.md
```

---

# 16. Blog Front Matter

Example:

```yaml
---
title: "Building an Air-Gapped Kubernetes Cluster with RKE2"

slug: "rke2-airgap"

description: >
  Lessons learned while designing an offline Kubernetes deployment.

published: 2026-10-13

updated: 2026-10-15

status: published

tags:
  - Kubernetes
  - RKE2
  - Infrastructure

series: null

featured: true

reading_time: auto
---
```

Then Markdown.

---

# 17. Blog Listing

Example:

```text
$ rudractl blog list

Engineering Notes
──────────────────────────────────────────────

2026-10-13

Building an Air-Gapped Kubernetes Cluster
Kubernetes · RKE2 · Infrastructure

Lessons from building Kubernetes environments
without internet connectivity.

8 min read

──────────────────────────────────────────────

2026-09-21

Understanding Kubernetes Upgrade Strategies
Kubernetes · Platform Engineering

...
```

Features:

- search
- tags
- date sorting
- reading time
- featured articles

Optional later:

- article series
- RSS
- related posts

---

# 18. Blog Article Experience

Articles should prioritize readability over the terminal aesthetic.

Do NOT render the entire article inside a fake terminal.

Use conventional technical-blog typography.

Example:

```text
Building an Air-Gapped Kubernetes Cluster

Oct 13, 2026 · 8 min read

Kubernetes / RKE2 / Infrastructure

────────────────────────────────────────

Introduction

...

## Architecture

...

┌───────────────────────────────┐
│ Internet-connected machine    │
│              │                │
│              ▼                │
│        Private Registry       │
│              │                │
│              ▼                │
│         RKE2 Cluster          │
└───────────────────────────────┘
```

Support:

- syntax highlighting
- code copy button
- heading anchors
- table of contents
- callouts
- images
- diagrams
- tables

---

# 19. Lab

Route:

```text
/lab
```

This section is for technical experiments that may not qualify as standalone open-source products.

Examples:

```text
Kubernetes experiments
Networking labs
Cilium experiments
GitOps experiments
Terraform labs
Linux experiments
Home lab projects
Infrastructure prototypes
```

Example:

```text
$ rudractl lab list

EXPERIMENT                         STATUS
────────────────────────────────────────────
HA Kubernetes Cluster             complete
Cilium Networking                 active
GitOps with Flux                  complete
Air-Gapped Kubernetes             complete
Terraform Infrastructure          active
```

---

# 20. Lab Data

Store under:

```text
content/lab/
```

Example:

```yaml
name: HA Kubernetes Lab

slug: ha-kubernetes

status: complete

technologies:
  - Kubernetes
  - RKE2
  - Linux

summary: >
  Building and operating a highly available
  Kubernetes environment.

repository: null

writeup: true
```

Lab content can contain accompanying Markdown.

---

# 21. Uses

Route:

```text
/uses
```

Inspired by `/uses` pages common among developers.

Purpose:

Show the tools and technologies Rudradev prefers working with.

Example:

```text
$ rudractl uses

Infrastructure
────────────────────

Kubernetes
RKE2
Terraform / OpenTofu
Ansible
Helm
FluxCD

Containers
────────────────────

Docker
containerd

Systems
────────────────────

Linux
Rocky Linux

Development
────────────────────

Go
Python
Bash

Daily Environment
────────────────────

macOS
VS Code
Git
zsh
```

Store this in:

```text
content/uses.yaml
```

---

# 22. About / Portfolio

Route:

```text
/about
```

This is the professional portfolio section.

It must remain distinct from:

```text
/opensource
/blog
```

---

# 23. About Hero

Example:

```text
$ rudractl profile

Rudradev Pal

Platform & Infrastructure Engineer

I enjoy building reliable infrastructure,
Kubernetes platforms and automation that
makes infrastructure easier to operate.
```

---

# 24. Professional Summary

Short narrative describing:

- platform engineering
- Kubernetes
- infrastructure
- DevOps
- automation
- cloud-native technologies

Avoid corporate résumé language.

The writing should sound like an engineer describing what they enjoy building.

---

# 25. Skills

Do NOT use meaningless percentage bars such as:

```text
Kubernetes 95%
Linux 90%
```

Instead group technologies by area.

Example:

```text
Platform Engineering

Kubernetes
RKE2
Helm
FluxCD

Infrastructure

Terraform
OpenTofu
Ansible
VMware

Containers

Docker
containerd

Systems

Linux
Networking
Storage
```

Optionally indicate experience categories:

```text
Daily
Experienced
Exploring
```

---

# 26. Professional Timeline

Data should come from:

```text
content/experience.yaml
```

Example:

```yaml
- company: Example Company

  role: Platform Engineer

  start: 2024

  end: present

  summary: >
    Working on Kubernetes platforms,
    infrastructure automation and
    platform engineering.

  areas:
    - Kubernetes
    - Infrastructure
    - Automation
```

Render visually:

```text
2026
 │
 ● Platform Engineering
 │
 │ Kubernetes
 │ Infrastructure Automation
 │
2025
 │
 ● ...
 │
2024
 │
 ● ...
```

---

# 27. Education

Separate data:

```text
content/education.yaml
```

Display simply.

---

# 28. Certifications

Optional data:

```text
content/certifications.yaml
```

Each entry:

```yaml
name:
issuer:
issued:
expires:
credential_url:
```

---

# 29. Contact

The website should provide obvious ways to reach Rudradev.

Possible links:

```text
GitHub
LinkedIn
Email
```

Example terminal presentation:

```text
$ rudractl contact

github     github.com/<username>
linkedin   linkedin.com/in/<username>
email      <email>
```

Do not expose unnecessary personal information.

---

# 30. Homepage Content Composition

Homepage should pull selected content from the independent sections.

Example:

```text
HOME

Hero

↓

Featured Open Source
(3 projects)

↓

Latest Writing
(3 blog posts)

↓

Current Engineering Interests

↓

Selected Lab Work

↓

About Preview

↓

Contact
```

The homepage is an aggregator.

It is NOT the canonical storage location for this content.

---

# 31. Repository Architecture

Recommended structure:

```text
portfolio/
│
├── .github/
│   └── workflows/
│       ├── validate.yml
│       ├── build.yml
│       └── deploy.yml
│
├── content/
│   │
│   ├── opensource/
│   │   ├── project-a.yaml
│   │   └── project-b.yaml
│   │
│   ├── blog/
│   │   ├── article-a.md
│   │   └── article-b.md
│   │
│   ├── lab/
│   │   └── experiment.yaml
│   │
│   ├── experience.yaml
│   ├── education.yaml
│   ├── certifications.yaml
│   ├── uses.yaml
│   └── profile.yaml
│
├── src/
│   ├── components/
│   ├── layouts/
│   ├── pages/
│   ├── styles/
│   ├── lib/
│   └── schemas/
│
├── public/
│
├── scripts/
│
├── astro.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

---

# 32. Component Architecture

Suggested components:

```text
components/

Terminal/
├── TerminalWindow
├── TerminalPrompt
├── TerminalCommand
├── TerminalOutput
└── Cursor

Navigation/
├── Navbar
├── MobileMenu
└── Footer

OpenSource/
├── ProjectCard
├── ProjectGrid
├── GitHubStats
└── ProjectMetadata

Blog/
├── ArticleCard
├── ArticleList
├── TableOfContents
├── ReadingTime
└── TagList

Lab/
├── LabCard
└── StatusBadge

Portfolio/
├── ExperienceTimeline
├── SkillGroup
├── Education
└── Certifications

Common/
├── Badge
├── Button
├── CodeBlock
├── CopyButton
├── SectionHeading
└── ExternalLink
```

---

# 33. Content Validation

All structured content should be validated during build.

Recommended:

```text
Zod
```

or JSON Schema.

Example project schema concept:

```typescript
Project {
    name: string
    slug: string
    repository: string
    description: string
    featured: boolean
    status: "active" | "maintenance" | "archived"
    technologies: string[]
    categories: string[]
}
```

Invalid content MUST fail CI.

Example:

```text
$ npm run validate

✓ profile.yaml
✓ experience.yaml
✓ uses.yaml

✗ content/opensource/avron.yaml

featured:
Expected boolean but received string.

Build failed.
```

---

# 34. GitHub Actions

CI/CD should demonstrate good engineering practices.

---

## Pull Request Pipeline

Run:

```text
Install dependencies

↓

Validate YAML/front matter

↓

Lint

↓

Type check

↓

Markdown lint

↓

Broken-link check

↓

Build

↓

Tests
```

PR should fail if any mandatory check fails.

---

# 35. Production Deployment

On:

```text
push → main
```

Pipeline:

```text
Checkout
   │
   ▼
Install
   │
   ▼
Validate Content
   │
   ▼
Fetch GitHub Metadata
   │
   ▼
Build Astro
   │
   ▼
Test
   │
   ▼
Deploy GitHub Pages
```

---

# 36. GitHub API Strategy

Avoid GitHub API calls from every visitor's browser.

Preferred architecture:

```text
GitHub API
     │
     ▼
Build Pipeline
     │
     ▼
Generated Metadata
     │
     ▼
Static Website
```

This provides:

- faster pages
- fewer API-rate issues
- no exposed tokens
- better reliability

Cache metadata where appropriate.

---

# 37. Generated API

Generate machine-readable static endpoints during the build.

Examples:

```text
/api/profile.json
/api/projects.json
/api/blog.json
/api/lab.json
```

Example:

```json
{
  "name": "Rudradev Pal",
  "role": "Platform & Infrastructure Engineer"
}
```

These endpoints allow other tools to consume the portfolio.

---

# 38. Future CLI

The website architecture should allow a CLI to be added later.

Potential command:

```bash
rudractl
```

Examples:

```bash
rudractl whoami

rudractl projects

rudractl projects get avron

rudractl blog

rudractl lab

rudractl uses

rudractl contact
```

The CLI can consume:

```text
/api/profile.json
/api/projects.json
/api/blog.json
```

This is NOT required for V1 but the architecture should not prevent it.

---

# 39. Search

V1 should support blog search.

Potential search targets:

```text
article title
description
tags
content
```

Later search can include:

```text
projects
labs
technologies
```

Prefer static client-side search.

Do not introduce a backend solely for search.

---

# 40. SEO

Every page needs:

```text
<title>
<meta name="description">
canonical URL
OpenGraph metadata
Twitter/X metadata
```

Articles additionally need structured metadata.

Generate:

```text
sitemap.xml
robots.txt
rss.xml
```

---

# 41. Social Preview Cards

Blog posts should produce good social previews.

Example:

```text
┌──────────────────────────────────────────────┐
│                                              │
│ Building an Air-Gapped                       │
│ Kubernetes Cluster                           │
│                                              │
│ Kubernetes • RKE2 • Infrastructure           │
│                                              │
│                               Rudradev Pal   │
└──────────────────────────────────────────────┘
```

Ideally generate OG images automatically.

---

# 42. RSS

Expose:

```text
/rss.xml
```

RSS should include published blog posts.

---

# 43. Sitemap

Automatically generate:

```text
/sitemap.xml
```

Include:

```text
/
/opensource
/opensource/*
/blog
/blog/*
/lab
/lab/*
/uses
/about
```

---

# 44. Responsive Design

The website must work well on:

```text
desktop
laptop
tablet
mobile
```

Terminal components must NOT require horizontal scrolling except actual code blocks.

Desktop:

```text
┌─────────────────────────────────────┐
│ $ rudractl whoami                   │
│                                     │
│ Rudradev Pal                        │
│ Platform Engineer                   │
└─────────────────────────────────────┘
```

Mobile:

```text
┌──────────────────────┐
│ $ whoami             │
│                      │
│ Rudradev Pal         │
│ Platform Engineer    │
└──────────────────────┘
```

Commands can shorten responsively.

---

# 45. Performance

Target Lighthouse scores:

```text
Performance       95+
Accessibility     95+
Best Practices    95+
SEO               95+
```

Prefer:

- static HTML
- minimal JavaScript
- lazy-loaded images
- optimized assets
- limited client-side hydration

Astro Islands should only be used where interactivity is required.

---

# 46. Accessibility

Requirements:

- semantic HTML
- keyboard navigation
- visible focus states
- proper heading hierarchy
- ARIA where appropriate
- sufficient contrast
- alt text
- reduced-motion support

Terminal styling must never reduce accessibility.

---

# 47. Security

Because the repository will be public:

NEVER commit:

```text
API tokens
GitHub tokens
private keys
internal URLs
credentials
company information
private infrastructure information
```

GitHub API credentials, if required, must use:

```text
GitHub Actions secrets
```

Prefer GitHub's built-in workflow token where sufficient.

---

# 48. Content Safety for Professional Work

Technical knowledge gained professionally may inspire generic articles or labs, but public content must not reveal proprietary information.

Do not publish:

```text
company source code
internal hostnames
private repositories
internal architecture diagrams
internal IP addresses
customer information
credentials
internal ticket information
private deployment procedures
confidential product architecture
```

Public content should be independently written and generalized.

---

# 49. 404 Page

Make the error page fit the theme.

Example:

```text
$ kubectl get page /whatever

Error from server (NotFound):

page "/whatever" not found

$ _
```

Buttons:

```text
[ cd / ]
[ Browse Projects ]
```

---

# 50. Loading/Error States

Where dynamic data exists, failures should be graceful.

Do NOT show:

```text
undefined stars
NaN
GitHub API error
```

Instead:

```text
Repository metadata temporarily unavailable.
```

Core project content must still render.

---

# 51. Footer

Minimal.

Example:

```text
────────────────────────────────────────────────────

$ echo "Built with Astro, Git and too much YAML."

GitHub · LinkedIn · RSS

© 2026 Rudradev Pal

                                              ↑ top
```

A subtle humorous message fits the site's personality.

---

# 52. Easter Eggs

Keep them subtle.

Possible commands typed into an optional terminal interaction:

```text
help
whoami
projects
blog
uses
clear
```

Example:

```text
$ sudo hire rudradev

[sudo] password:

Nice try.

Try:
rudractl contact
```

Do NOT require terminal commands for navigation.

This is purely an optional enhancement.

---

# 53. Design Anti-Patterns

Do NOT build:

- a generic Bootstrap portfolio
- a résumé template
- a full-screen fake terminal
- a Matrix-style hacker page
- an animation-heavy landing page
- an SPA when static rendering works
- skill percentage bars
- dozens of glowing neon elements
- unnecessary 3D effects
- long loading animations
- a backend without a clear requirement

The site should feel like it was designed by a platform engineer, not like a "hacker portfolio" template.

---

# 54. Recommended Technology Stack

## Framework

```text
Astro
```

Reasons:

- excellent static generation
- strong Markdown/MDX support
- low JavaScript overhead
- good content collections
- excellent performance
- component architecture
- good SEO

---

## Language

```text
TypeScript
```

Use strict mode.

---

## Styling

```text
Tailwind CSS
```

Use reusable design tokens rather than excessive inline classes.

---

## Content

```text
YAML
Markdown
MDX
```

---

## Validation

```text
Zod
```

---

## Deployment

```text
GitHub Pages
```

---

## CI/CD

```text
GitHub Actions
```

---

# 55. Development Commands

Target developer experience:

```bash
npm install
npm run dev
```

Validation:

```bash
npm run validate
```

Build:

```bash
npm run build
```

Preview:

```bash
npm run preview
```

Lint:

```bash
npm run lint
```

Everything:

```bash
npm run check
```

---

# 56. Local Content Workflow

Adding an open-source project should require approximately:

```bash
vim content/opensource/my-project.yaml

npm run validate

git add .
git commit -m "Add my-project"
git push
```

Adding a blog:

```bash
vim content/blog/my-new-post.md

npm run validate

git add .
git commit -m "Add blog post"
git push
```

No application source-code changes should normally be required when adding content.

---

# 57. Git Branch Strategy

Simple workflow:

```text
feature/*
blog/*
content/*
        │
        ▼
Pull Request
        │
        ▼
CI
        │
        ▼
main
        │
        ▼
Production
```

---

# 58. Content Drafts

Blog front matter should support:

```yaml
status: draft
```

Draft posts:

- visible locally
- excluded from production
- excluded from RSS
- excluded from sitemap

This allows Git to serve as the writing workflow.

---

# 59. Future Features

Not required for V1.

Possible V2/V3:

### CLI

```text
rudractl
```

### GitHub contribution visualization

Show open-source activity without simply embedding GitHub's default graph.

### Dynamic architecture diagrams

For Lab articles.

### Blog series

Example:

```text
Kubernetes Internals
Part 1
Part 2
Part 3
```

### Command palette

Keyboard shortcut:

```text
CMD + K
```

Search:

```text
> projects
> blog
> about
> kubernetes
```

### Theme switching

```text
dark
darker
system
```

Avoid building multiple elaborate themes initially.

---

# 60. V1 Scope

V1 should contain:

- Homepage
- Open Source
- Open-source project detail pages
- Blog
- Blog article pages
- Lab
- Uses
- About
- Experience
- Skills
- Contact
- YAML/Markdown content management
- content validation
- GitHub repository metadata
- GitHub Actions CI
- GitHub Pages deployment
- responsive design
- terminal animations
- SEO
- sitemap
- RSS
- 404
- accessibility support

---

# 61. V1 Should NOT Include

Avoid scope creep.

Do not initially build:

- authentication
- database
- admin dashboard
- comments
- newsletter backend
- analytics platform
- full interactive terminal shell
- portfolio CLI
- Kubernetes deployment
- backend API server

These can be considered later.

---

# 62. Development Phases

## Phase 1 — Foundation

Implement:

```text
Astro
TypeScript
Tailwind
routing
global layout
design tokens
navigation
footer
```

---

## Phase 2 — Content System

Implement:

```text
profile
experience
open-source schema
blog schema
lab schema
uses schema
validation
```

---

## Phase 3 — Core Pages

Build:

```text
/
/opensource
/blog
/lab
/uses
/about
```

---

## Phase 4 — Detail Pages

Build:

```text
/opensource/<slug>
/blog/<slug>
/lab/<slug>
```

---

## Phase 5 — GitHub Integration

Implement repository metadata retrieval.

```text
GitHub API
     ↓
Build script
     ↓
normalized metadata
     ↓
project pages
```

---

## Phase 6 — Animation & Polish

Implement:

- terminal hero
- typing effect
- cursor
- card transitions
- page transitions
- scroll reveals
- reduced-motion handling

Do this AFTER the core UX works.

---

## Phase 7 — CI/CD

Implement:

```text
PR validation
lint
type check
content validation
build
broken links
deployment
```

---

## Phase 8 — SEO / Production

Implement:

```text
metadata
OpenGraph
RSS
sitemap
robots.txt
404
performance optimization
accessibility audit
```

---

# 63. Definition of Done

V1 is complete when:

### Content

- Project can be added through YAML.
- Blog can be added through Markdown.
- Lab entry can be added without modifying application code.
- Portfolio data can be changed through structured content.

### CI/CD

- Pull requests automatically validate.
- Invalid content fails CI.
- Main automatically deploys.
- Production deployment requires no manual build.

### UX

- Desktop works.
- Mobile works.
- Keyboard navigation works.
- Terminal animations are smooth.
- Reduced-motion preference works.

### Performance

- Pages are mostly static.
- Initial JavaScript is minimal.
- Images are optimized.
- Lighthouse targets are met.

### SEO

- Every public page has metadata.
- Sitemap exists.
- RSS exists.
- Blog pages have social previews.

---

# 64. Desired User Impression

Within approximately five seconds, a visitor should understand:

```text
This person works deeply with
Kubernetes, infrastructure and platform engineering.
```

Within approximately thirty seconds:

```text
They actually build things.

They contribute/build in public.

They understand infrastructure automation.

They write about what they learn.

They care about engineering quality.
```

And after exploring the repository:

```text
Even the portfolio itself demonstrates
their engineering philosophy.
```

---

# 65. Final Product Philosophy

The website should not simply claim:

> "I am a Platform Engineer."

The implementation itself should demonstrate platform-engineering thinking.

```text
Declarative configuration
        +
Version control
        +
Schema validation
        +
Automation
        +
CI/CD
        +
Observability of build failures
        +
Reproducible builds
        +
Static delivery
        +
Good developer experience
```

The final product should therefore function simultaneously as:

1. **Professional portfolio**
2. **Open-source showcase**
3. **Technical blog**
4. **Engineering lab notebook**
5. **Example of Rudradev's engineering philosophy**

The guiding idea is:

> **Git is the source of truth. Content is declarative. Deployment is automated. The interface feels like a modern engineering terminal.**

The result should feel polished enough for a recruiter or hiring manager while still having enough technical personality that another Kubernetes, SRE or Platform Engineer immediately recognizes who it was built for.
