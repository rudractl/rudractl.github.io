# rudractl.github.io

> **Git is the source of truth. Content is declarative. Deployment is automated.**

The personal engineering site of **Rudradev Pal** — portfolio, open-source showcase,
blog and lab notebook. Live at <https://rudractl.github.io>.

```text
.github/    CI + deploy workflows (GitHub requires this location)
content/    ← everything you edit
site/       ← the website code — rarely touched
README.md
```

## Editing content

Everything lives in `content/`. Edit a file, commit, push — the site redeploys in ~2 minutes.

| File                  | What it controls                                                      |
| --------------------- | --------------------------------------------------------------------- |
| `profile.yaml`        | name, role, bio, homepage interests, contact links, awards, analytics |
| `experience.yaml`     | career timeline                                                       |
| `education.yaml`      | education                                                             |
| `certifications.yaml` | certifications                                                        |
| `skills.yaml`         | grouped skills on `/about`                                            |
| `uses.yaml`           | the `/uses` page                                                      |
| `projects.yaml`       | which GitHub repos to show/hide + optional extra detail per project   |
| `lab.yaml`            | lab experiments                                                       |
| `blog/*.md`           | blog posts (one file each); `blog/medium/` is imported automatically  |

### Projects appear automatically

Every public repo on your GitHub accounts (`github.owners` in `content/projects.yaml`)
shows up on `/opensource` by itself — name, description, stars, language and releases
come from GitHub. Forks, empty repos and repos already listed in `lab.yaml` are skipped.

- **Hide a repo:** add its name to `github.hide`.
- **Add detail or change order:** list it under `projects:` — e.g. `featured: true`,
  `description:`, `highlights:`, or a Markdown write-up (`why:`, `architecture:` …).
- **Status** is always `active` unless you set `status:` (`maintenance`, `experimental`, `archived`).

### What updates by itself

On every deploy, and twice a day (08:47 and 20:47 IST), the build pulls:

- **Your GitHub repos** — new ones appear, stats refresh, and your profile picture is
  re-rendered as ASCII art for the terminal (`neofetch`, `avatar`)
- **New Medium posts** from `@rudradevpal`, which show up in the blog and link to Medium

### Optional helpers

Run from `site/` after `npm install` — they only write to `content/`:

```bash
npm run new project rudradevpal/my-repo   # appends to projects.yaml
npm run new lab "eBPF tracing"            # appends to lab.yaml
npm run new post "My post"                # creates content/blog/my-post.md (draft)
npm run validate                          # checks every content file
```

VS Code with the YAML extension autocompletes and validates `content/*.yaml` as you type.

### Writing rules

- `status: draft` posts are visible in `npm run dev` only — never published.
- Files and folders starting with `_` are ignored.
- Callouts: `> [!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, `[!CAUTION]`.
- This repo is public: no tokens, internal hostnames, IPs, customer names or private architecture.

## Terminal mode

Visitors can switch the whole site into a shell with the **>\_** button in the header,
`` Ctrl+` `` or the ⌘K palette — `ls`, `cd blog`, `cat about.md`, `open avron`,
`kubectl get projects`, `neofetch`, tab completion and history. It's off by default,
remembered across pages, and reads the same content as the normal site.

## Working on the site

```bash
cd site
npm install
npm run dev      # http://localhost:4321 (refreshes GitHub stats + Medium first)
npm run check    # validate → lint → typecheck → build → link check → tests
```

Stack: Astro, TypeScript, Tailwind CSS, Zod. Requires Node 22.18+ (24 recommended).
Code layout, design notes and the original spec are in `site/` and `site/docs/Plan.md`.

## Deployment

- **Push to `main`** → `.github/workflows/deploy.yml` validates, builds, tests and
  deploys to GitHub Pages. Also runs twice a day to refresh GitHub stats and Medium posts.
- **Pull requests** → `.github/workflows/ci.yml` runs the full check and reports on the PR.
- **Dependencies** update themselves monthly (`update-deps.yml`): minor/patch only, committed
  straight to `main` only if the full check passes. No PRs. Major upgrades are done by hand.

One-time setup: **Settings → Pages → Source: GitHub Actions**. For a custom domain,
set a repository variable `SITE_URL` and add `site/public/CNAME`.
