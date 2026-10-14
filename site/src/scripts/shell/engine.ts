/**
 * rudractl-sh — a tiny shell over the site's content.
 *
 * Data comes from the static JSON API (/api/*.json) and is loaded lazily the
 * first time a command runs, so the shell costs nothing until someone types.
 *
 * Virtual filesystem:
 *   ~/
 *   ├── about.md  contact.txt  experience.log  skills.md  uses.md
 *   ├── opensource/<project>
 *   ├── blog/<post>
 *   └── lab/<experiment>
 */
import { toggleTheme, setTheme } from '../theme.ts';

/* ───────────────────────────── data ───────────────────────────── */

interface Link {
  id: string;
  href: string;
  display: string;
}
interface Profile {
  name: string;
  handle: string;
  role: string;
  tagline: string;
  location?: string;
  intro: string;
  summary: string;
  focus: string[];
  links: Link[];
  hobbies: string[];
  experience: { company: string; role: string; start: string | number; end: string | number }[];
  skills: { group: string; items: { name: string }[] }[];
  uses: { group: string; items: { name: string; note?: string }[] }[];
  certifications: { name: string; issued: string | number }[];
  avatar: { cols: number; rows: number; lines: string[]; colors: string[][] } | null;
}
interface Project {
  slug: string;
  name: string;
  description: string;
  repository: string;
  status: string;
  featured: boolean;
  technologies: string[];
  url: string;
  github: {
    stars: number;
    forks: number;
    language: string | null;
    latestRelease: { tag: string } | null;
  } | null;
}
interface Post {
  slug: string;
  title: string;
  description: string;
  published: string;
  tags: string[];
  reading_time: number | null;
  url: string;
  external: boolean;
}
interface Lab {
  slug: string;
  name: string;
  status: string;
  summary: string;
  technologies: string[];
  started: string | number | null;
  url: string;
}
interface SearchItem {
  type: string;
  title: string;
  url: string;
  description?: string;
  keywords?: string;
}
export interface ShellData {
  profile: Profile;
  projects: Project[];
  posts: Post[];
  labs: Lab[];
}

let data: ShellData | undefined;
let loading: Promise<ShellData> | undefined;
const getJson = <T>(path: string) => fetch(path).then((r) => r.json() as Promise<T>);

export function loadData(): Promise<ShellData> {
  loading ??= Promise.all([
    getJson<Profile>('/api/profile.json'),
    getJson<Project[]>('/api/projects.json'),
    getJson<Post[]>('/api/blog.json'),
    getJson<Lab[]>('/api/lab.json'),
  ]).then(([profile, projects, posts, labs]) => (data = { profile, projects, posts, labs }));
  return loading;
}

/* ─────────────────────────── formatting ───────────────────────── */

export const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => `&${{ '&': 'amp', '<': 'lt', '>': 'gt', '"': 'quot', "'": '#39' }[c]};`,
  );
const cls = (c: string, s: string) => `<span class="${c}">${s}</span>`;
const muted = (s: string) => cls('text-muted', s);
const green = (s: string) => cls('text-accent', s);
const blue = (s: string) => cls('text-accent-2', s);
const bold = (s: string) => cls('text-fg font-semibold', s);
const warn = (s: string) => cls('text-warning', s);
const err = (s: string) => cls('text-error', s);
const link = (href: string, text: string, external = /^https?:/.test(href)) =>
  `<a class="link" href="${esc(href)}"${external ? ' target="_blank" rel="noopener"' : ''}>${esc(text)}</a>`;
const pad = (s: string, n: number) => s + ' '.repeat(Math.max(1, n - s.length));
/** Monospace table that scrolls sideways on small screens instead of wrapping. */
const table = (header: string[], rows: string[][], raw: string[][] = rows) => {
  const widths = header.map(
    (h, i) => Math.max(h.length, ...raw.map((r) => (r[i] ?? '').length)) + 3,
  );
  const line = (cells: string[], plain: string[]) =>
    cells
      .map((c, i) =>
        i === cells.length - 1
          ? c
          : c + ' '.repeat(Math.max(1, (widths[i] ?? 0) - (plain[i] ?? '').length)),
      )
      .join('');
  return `<div class="overflow-x-auto"><div class="whitespace-pre">${[muted(line(header, header)), ...rows.map((r, i) => line(r, raw[i] ?? r))].join('\n')}</div></div>`;
};
const statusColor = (s: string) =>
  ['active', 'complete', 'published'].includes(s)
    ? green(s)
    : ['archived', 'paused'].includes(s)
      ? muted(s)
      : warn(s);
const md = (s: string) =>
  esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<b class="text-fg">$1</b>')
    .replace(/_(.+?)_/g, '<i>$1</i>')
    .replace(/`(.+?)`/g, '<code class="text-accent">$1</code>');
const partial = (v: string | number) => {
  const [y, m] = String(v).split('-');
  return m
    ? `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][Number(m) - 1]} ${y}`
    : String(y);
};

/* ───────────────────────── virtual filesystem ─────────────────── */

const FILES = ['about.md', 'contact.txt', 'experience.log', 'skills.md', 'uses.md'] as const;
const DIRS = ['opensource', 'blog', 'lab'] as const;
type Dir = (typeof DIRS)[number];
const SECTION_URL: Record<Dir | 'home', string> = {
  home: '/',
  opensource: '/opensource/',
  blog: '/blog/',
  lab: '/lab/',
};
const FILE_URL: Record<string, string> = {
  'about.md': '/about/',
  'experience.log': '/about/',
  'skills.md': '/about/',
  'contact.txt': '/about/',
  'uses.md': '/uses/',
};

type Node =
  | { kind: 'home' }
  | { kind: 'dir'; dir: Dir }
  | { kind: 'file'; name: string }
  | { kind: 'entry'; dir: Dir; slug: string };

const entries = (d: ShellData, dir: Dir): string[] =>
  dir === 'opensource'
    ? d.projects.map((p) => p.slug)
    : dir === 'blog'
      ? d.posts.map((p) => p.slug)
      : d.labs.map((l) => l.slug);

/** Resolve a path ("../blog/x", "~/lab", "opensource/avron/") against cwd. */
function resolve(cwd: string, path: string, d: ShellData): Node | null {
  const parts = (
    path.startsWith('~') || path.startsWith('/') ? path.replace(/^[~/]+/, '') : `${cwd}/${path}`
  )
    .split('/')
    .filter((p) => p && p !== '.');
  const stack: string[] = [];
  for (const p of parts) {
    if (p === '..') stack.pop();
    else stack.push(p);
  }
  if (stack.length === 0) return { kind: 'home' };
  const [first = '', second] = stack;
  if (stack.length > 2) return null;
  if ((DIRS as readonly string[]).includes(first)) {
    const dir = first as Dir;
    if (!second) return { kind: 'dir', dir };
    const slug = entries(d, dir).find((s) => s.toLowerCase() === second.toLowerCase());
    return slug ? { kind: 'entry', dir, slug } : null;
  }
  if (!second && (FILES as readonly string[]).includes(first)) return { kind: 'file', name: first };
  return null;
}
const pathOf = (n: Node) =>
  n.kind === 'home'
    ? ''
    : n.kind === 'dir'
      ? n.dir
      : n.kind === 'entry'
        ? `${n.dir}/${n.slug}`
        : n.name;
const urlOf = (n: Node, d: ShellData): string => {
  if (n.kind === 'home') return SECTION_URL.home;
  if (n.kind === 'dir') return SECTION_URL[n.dir];
  if (n.kind === 'file') return FILE_URL[n.name] ?? '/';
  if (n.dir === 'opensource')
    return d.projects.find((p) => p.slug === n.slug)?.url ?? '/opensource/';
  if (n.dir === 'blog') return d.posts.find((p) => p.slug === n.slug)?.url ?? '/blog/';
  return d.labs.find((l) => l.slug === n.slug)?.url ?? '/lab/';
};

/* ─────────────────────────────── shell ────────────────────────── */

export interface ShellHost {
  /** Current directory relative to ~ ("" | "blog" | …). */
  cwd: string;
  history: string[];
  clear(): void;
  navigate(url: string): void;
  /** Leave terminal mode (undefined for the inline hero prompt). */
  exit?: () => void;
}

type Cmd = (
  args: string[],
  host: ShellHost,
  d: ShellData,
) => string | void | Promise<string | void>;

const HELP: [string, string][] = [
  ['ls [dir]', 'list files — try `ls blog`'],
  ['cd <dir>', 'change directory (opensource, blog, lab, ..)'],
  ['cat <file>', 'read something — `cat about.md`, `cat blog/<post>`'],
  ['open <path>', 'open the page for a file, post or project'],
  ['whoami', 'who is this?'],
  ['neofetch', 'system info, the fun way'],
  ['avatar', 'my GitHub picture, in ASCII'],
  ['kubectl get …', 'projects | posts | labs | all'],
  ['search <words>', 'search everything'],
  ['contact', 'ways to reach me'],
  ['theme [dark|light]', 'switch colours'],
  ['history · clear', 'the usual'],
];

function describeEntry(n: Extract<Node, { kind: 'entry' }>, d: ShellData): string {
  if (n.dir === 'opensource') {
    const p = d.projects.find((x) => x.slug === n.slug)!;
    const gh = p.github;
    return [
      `${bold(esc(p.name))}  ${statusColor(p.status)}`,
      esc(p.description),
      '',
      `${muted(pad('repo', 10))}${link(`https://github.com/${p.repository}`, p.repository)}`,
      p.technologies.length ? `${muted(pad('tech', 10))}${esc(p.technologies.join(' · '))}` : '',
      gh
        ? `${muted(pad('github', 10))}★ ${gh.stars}  ⑂ ${gh.forks}${gh.latestRelease ? `  ${esc(gh.latestRelease.tag)}` : ''}`
        : '',
      `${muted(pad('page', 10))}${link(p.url, 'details →', false)}`,
    ]
      .filter((l) => l !== '')
      .join('\n');
  }
  if (n.dir === 'blog') {
    const p = d.posts.find((x) => x.slug === n.slug)!;
    return [
      bold(esc(p.title)),
      muted(
        `${p.published.slice(0, 10)}${p.reading_time ? ` · ${p.reading_time} min read` : ''} · ${p.tags.map(esc).join(', ')}`,
      ),
      '',
      esc(p.description),
      '',
      `${green('→')} ${link(p.url, p.external ? `read on ${new URL(p.url).hostname.replace(/^www\./, '')}` : 'read the full post')}`,
    ].join('\n');
  }
  const l = d.labs.find((x) => x.slug === n.slug)!;
  return [
    `${bold(esc(l.name))}  ${statusColor(l.status)}`,
    esc(l.summary),
    '',
    `${muted(pad('stack', 10))}${esc(l.technologies.join(' · '))}`,
    l.started ? `${muted(pad('started', 10))}${partial(l.started)}` : '',
    `${muted(pad('page', 10))}${link(l.url, 'notes →', false)}`,
  ]
    .filter((x) => x !== '')
    .join('\n');
}

function catFile(name: string, d: ShellData): string {
  const p = d.profile;
  switch (name) {
    case 'about.md':
      return [
        `${bold(`# ${esc(p.name)}`)}`,
        green(esc(p.role)),
        '',
        ...p.summary
          .trim()
          .split(/\n\s*\n/)
          .map((para) => md(para.replace(/\s+/g, ' ')) + '\n'),
      ].join('\n');
    case 'contact.txt':
      return p.links.map((l) => `${green(pad(l.id, 10))}${link(l.href, l.display)}`).join('\n');
    case 'experience.log':
      return p.experience
        .map(
          (e) =>
            `${muted(pad(`${partial(e.start)} → ${e.end === 'present' ? 'now' : partial(e.end)}`, 22))}${bold(esc(e.role))} ${muted('@')} ${esc(e.company)}`,
        )
        .join('\n');
    case 'skills.md':
      return p.skills
        .map(
          (g) => `${green(`## ${esc(g.group)}`)}\n${esc(g.items.map((i) => i.name).join(' · '))}`,
        )
        .join('\n\n');
    case 'uses.md':
      return p.uses
        .map(
          (g) =>
            `${green(`## ${esc(g.group)}`)}\n${g.items.map((i) => `  ${esc(i.name)}${i.note ? muted(`  // ${esc(i.note)}`) : ''}`).join('\n')}`,
        )
        .join('\n\n');
  }
  return '';
}

function ls(n: Node, d: ShellData, long: boolean): string {
  if (n.kind === 'entry' || n.kind === 'file') return esc(pathOf(n).split('/').pop() ?? '');
  if (n.kind === 'home') {
    if (!long) return [...DIRS.map((x) => blue(`${x}/`)), ...FILES.map(esc)].join('  ');
    return table(
      ['NAME', 'ITEMS', 'DESCRIPTION'],
      [
        [blue('opensource/'), String(d.projects.length), 'projects I build in public'],
        [blue('blog/'), String(d.posts.length), 'engineering notes'],
        [blue('lab/'), String(d.labs.length), 'experiments'],
        ...FILES.map((f) => [esc(f), '-', f.replace(/\..*/, '')]),
      ],
      [
        ['opensource/', '', ''],
        ['blog/', '', ''],
        ['lab/', '', ''],
        ...FILES.map((f) => [f, '', '']),
      ],
    );
  }
  const names = entries(d, n.dir);
  if (!long) return names.length ? names.map(esc).join('  ') : muted('(empty)');
  if (n.dir === 'opensource')
    return table(
      ['NAME', 'STATUS', 'STARS', 'DESCRIPTION'],
      d.projects.map((p) => [
        esc(p.slug),
        statusColor(p.status),
        String(p.github?.stars ?? '-'),
        esc(p.description.slice(0, 60)),
      ]),
      d.projects.map((p) => [p.slug, p.status, String(p.github?.stars ?? '-'), '']),
    );
  if (n.dir === 'blog')
    return table(
      ['DATE', 'NAME', 'WHERE'],
      d.posts.map((p) => [
        muted(p.published.slice(0, 10)),
        esc(p.slug),
        p.external ? blue('medium') : 'here',
      ]),
      d.posts.map((p) => [p.published.slice(0, 10), p.slug, '']),
    );
  return table(
    ['NAME', 'STATUS', 'STACK'],
    d.labs.map((l) => [
      esc(l.slug),
      statusColor(l.status),
      esc(l.technologies.slice(0, 3).join(', ')),
    ]),
    d.labs.map((l) => [l.slug, l.status, '']),
  );
}

/** GitHub profile picture as coloured ASCII (generated at build time). */
function avatarArt(d: ShellData, cls = ''): string {
  const a = d.profile.avatar;
  if (!a) return '';
  const rows = a.lines.map((line, y) =>
    [...line]
      .map((ch, x) =>
        ch === ' ' ? ' ' : `<span style="color:${a.colors[y]?.[x] ?? 'inherit'}">${esc(ch)}</span>`,
      )
      .join(''),
  );
  return `<div class="ascii-avatar ${cls}" role="img" aria-label="${esc(d.profile.name)} — GitHub avatar as ASCII art">${rows.join('\n')}</div>`;
}

function neofetch(d: ShellData): string {
  const p = d.profile;
  const years =
    new Date().getFullYear() -
    Math.min(...p.experience.map((e) => Number(String(e.start).slice(0, 4))));
  const stars = d.projects.reduce((n, x) => n + (x.github?.stars ?? 0), 0);
  const info = [
    `${green(esc(p.handle))}${muted('@')}${green('platform')}`,
    muted('─'.repeat(p.handle.length + 9)),
    `${green('Name')}: ${esc(p.name)}`,
    `${green('Role')}: ${esc(p.role)}`,
    p.location ? `${green('Location')}: ${esc(p.location)}` : '',
    `${green('Uptime')}: ${years}+ years in infrastructure`,
    `${green('Shell')}: rudractl-sh`,
    `${green('Packages')}: ${d.projects.length} projects, ${d.posts.length} posts, ${d.labs.length} labs`,
    `${green('Stars')}: ★ ${stars}`,
    `${green('Focus')}: ${esc(p.focus.join(', '))}`,
    '',
    ['#ff5f57', '#febc2e', '#28c840', '#6ea8fe', '#b197fc', '#5cd5ec']
      .map((c) => `<span style="color:${c}">███</span>`)
      .join(''),
  ].filter((l, i, all) => l !== '' || i === all.length - 2);
  const logo = p.avatar
    ? avatarArt(d)
    : `<div class="whitespace-pre text-accent">${esc(['   ____  ', '  / __ \\ ', ' / /_/ / ', '/ _, _/  ', '/_/ |_|  '].join('\n'))}</div>`;
  return `<div class="flex flex-wrap items-start gap-x-5 gap-y-3">${logo}<div class="whitespace-pre-wrap">${info.join('\n')}</div></div>`;
}

let searchIndex: SearchItem[] | undefined;

const commands: Record<string, Cmd> = {
  help: () =>
    [
      bold('rudractl-sh') +
        muted(' — explore the site from the command line. Everything here is also a normal link.'),
      `<div class="my-2 grid grid-cols-1 gap-x-6 gap-y-1 whitespace-normal sm:grid-cols-[max-content_1fr]">${HELP.map(
        ([c, desc]) =>
          `<span class="text-accent">${esc(c)}</span><span class="text-muted max-sm:mb-1.5 max-sm:pl-3">${md(desc)}</span>`,
      ).join('')}</div>`,
      muted('Tab completes · ↑/↓ history · Ctrl+L clears · Ctrl+K searches'),
    ].join('\n'),
  ls: (args, h, d) => {
    const long = args.some((a) => /^-\w*l/.test(a));
    const target = args.find((a) => !a.startsWith('-')) ?? '.';
    const n = resolve(h.cwd, target, d);
    return n ? ls(n, d, long) : err(`ls: ${esc(target)}: No such file or directory`);
  },
  cd: (args, h, d) => {
    const target = args[0] ?? '~';
    const n = resolve(h.cwd, target, d);
    if (!n) return err(`cd: no such directory: ${esc(target)}`);
    if (n.kind === 'file' || n.kind === 'entry')
      return err(`cd: not a directory: ${esc(target)}`) + muted(` — try \`cat ${esc(target)}\``);
    h.cwd = pathOf(n);
    return undefined;
  },
  pwd: (_, h) => esc(`/home/visitor/${h.cwd}`.replace(/\/$/, '')),
  cat: (args, h, d) => {
    if (!args.length) return err('cat: missing file — try `cat about.md`');
    return args
      .map((a) => {
        const n = resolve(h.cwd, a, d);
        if (!n) return err(`cat: ${esc(a)}: No such file or directory`);
        if (n.kind === 'file') return catFile(n.name, d);
        if (n.kind === 'entry') return describeEntry(n, d);
        return err(`cat: ${esc(a)}: Is a directory`) + muted(` — try \`ls ${esc(a)}\``);
      })
      .join('\n\n');
  },
  open: (args, h, d) => {
    const target = args[0] ?? '.';
    if (/^https?:\/\//.test(target)) {
      window.open(target, '_blank', 'noopener');
      return muted(`→ ${esc(target)}`);
    }
    const n = resolve(h.cwd, target, d);
    if (!n) return err(`open: ${esc(target)}: not found`);
    const url = urlOf(n, d);
    if (/^https?:/.test(url)) window.open(url, '_blank', 'noopener');
    else h.navigate(url);
    return muted(`→ ${esc(url)}`);
  },
  whoami: (_, __, d) =>
    `${bold(esc(d.profile.name))} — ${green(esc(d.profile.role))}${d.profile.location ? muted(` · ${esc(d.profile.location)}`) : ''}\n${esc(d.profile.tagline.trim())}`,
  neofetch: (_, __, d) => neofetch(d),
  avatar: (_, __, d) => avatarArt(d, 'ascii-avatar-lg') || muted('No avatar available right now.'),
  contact: (_, __, d) => catFile('contact.txt', d),
  kubectl: (args, h, d) => {
    const [verb, kind = '', name] = args;
    const map: Record<string, Dir> = {
      project: 'opensource',
      projects: 'opensource',
      po: 'opensource',
      post: 'blog',
      posts: 'blog',
      lab: 'lab',
      labs: 'lab',
    };
    if (verb === 'get' && kind === 'all')
      return DIRS.map((x) => `${green(`# ${x}`)}\n${ls({ kind: 'dir', dir: x }, d, true)}`).join(
        '\n\n',
      );
    if (verb === 'get' && map[kind])
      return name
        ? commands['cat']!([`~/${map[kind]}/${name}`], h, d)
        : ls({ kind: 'dir', dir: map[kind]! }, d, true);
    if (verb === 'describe' && map[kind] && name)
      return commands['cat']!([`~/${map[kind]}/${name}`], h, d);
    return muted('usage: kubectl get projects|posts|labs|all  ·  kubectl describe project <name>');
  },
  search: async (args) => {
    const q = args.join(' ').toLowerCase().trim();
    if (!q) return err('search: what should I look for? — `search kubernetes`');
    searchIndex ??= await getJson<SearchItem[]>('/api/search.json');
    const hits = searchIndex
      .filter((i) =>
        q
          .split(/\s+/)
          .every((t) =>
            `${i.title} ${i.description ?? ''} ${i.keywords ?? ''}`.toLowerCase().includes(t),
          ),
      )
      .slice(0, 10);
    return hits.length
      ? hits.map((i) => `${muted(pad(i.type, 9))}${link(i.url, i.title)}`).join('\n')
      : muted(`no matches for "${esc(q)}"`);
  },
  theme: (args) => {
    if (args[0] === 'dark' || args[0] === 'light') setTheme(args[0]);
    else toggleTheme();
    return muted(`theme → ${document.documentElement.dataset['theme']}`);
  },
  history: (_, h) =>
    h.history.map((c, i) => `${muted(String(i + 1).padStart(4))}  ${esc(c)}`).join('\n'),
  clear: (_, h) => h.clear(),
  date: () => esc(new Date().toString()),
  echo: (args) => esc(args.join(' ')),
  exit: (_, h) => {
    if (h.exit) {
      h.exit();
      return undefined;
    }
    return muted('This prompt lives on the page. Try terminal mode: Ctrl+` or the >_ button.');
  },
  sudo: (args) =>
    args.join(' ').startsWith('hire')
      ? `[sudo] password for visitor: ••••••••\n${warn('Nice try.')}\n\nTry: ${green('contact')}`
      : 'visitor is not in the sudoers file. This incident will be reported. 🙂',
  rm: () => 'rm: this site is immutable — it is rebuilt from Git on every push.',
  vim: () => 'You are now stuck in vim. Just kidding. (:q! works here too.)',
  ':q!': () => muted('see? easy.'),
  man: (args) =>
    args[0]
      ? muted(`No manual entry for ${esc(args[0])}. Try \`help\`.`)
      : muted('What manual page do you want?'),
};
// Aliases
const alias: Record<string, string> = {
  ll: 'ls -l',
  dir: 'ls',
  projects: 'ls -l ~/opensource',
  blog: 'ls -l ~/blog',
  posts: 'ls -l ~/blog',
  lab: 'ls -l ~/lab',
  about: 'cat ~/about.md',
  uses: 'cat ~/uses.md',
  skills: 'cat ~/skills.md',
  experience: 'cat ~/experience.log',
  resume: 'cat ~/experience.log',
  quit: 'exit',
  gui: 'exit',
  cls: 'clear',
  k: 'kubectl',
  '?': 'help',
};

/** Split a command line, respecting simple quotes. */
const tokenize = (line: string) =>
  (line.match(/"[^"]*"|'[^']*'|\S+/g) ?? []).map((t) => t.replace(/^["']|["']$/g, ''));

export async function run(line: string, host: ShellHost): Promise<string | void> {
  let input = line.trim().replace(/^rudractl\s+/, '');
  const first = input.split(/\s+/)[0] ?? '';
  if (alias[first]) input = alias[first] + input.slice(first.length);
  const [name = '', ...args] = tokenize(input);
  const cmd = commands[name.toLowerCase()];
  if (!cmd) return `${err(`command not found: ${esc(name)}`)} ${muted('— type `help`')}`;
  const d = data ?? (await loadData());
  return cmd(args, host, d);
}

export const commandNames = () =>
  [...new Set([...Object.keys(commands), ...Object.keys(alias)])]
    .filter((c) => /^[a-z]/.test(c))
    .sort();

/** Tab completion: returns the completed line and, when ambiguous, the candidates. */
export function complete(line: string, host: ShellHost): { line: string; options: string[] } {
  const parts = line.split(/\s+/);
  const word = parts[parts.length - 1] ?? '';
  let pool: string[];
  if (parts.length <= 1) pool = commandNames();
  else if (!data) return { line, options: [] };
  else if (parts[0] === 'kubectl' || parts[0] === 'k')
    pool = parts.length === 2 ? ['get', 'describe'] : ['projects', 'posts', 'labs', 'all'];
  else {
    // Path completion relative to cwd
    const slash = word.lastIndexOf('/');
    const base = slash >= 0 ? word.slice(0, slash + 1) : '';
    const dirNode = resolve(host.cwd, base || '.', data);
    const children =
      !dirNode || dirNode.kind === 'file' || dirNode.kind === 'entry'
        ? []
        : dirNode.kind === 'home'
          ? [...DIRS.map((x) => `${x}/`), ...FILES]
          : entries(data, dirNode.dir);
    pool = children.map((c) => base + c);
  }
  const matches = pool.filter((p) => p.toLowerCase().startsWith(word.toLowerCase()));
  if (matches.length === 0) return { line, options: [] };
  if (matches.length === 1) {
    const done = matches[0]!;
    return {
      line: [...parts.slice(0, -1), done].join(' ') + (done.endsWith('/') ? '' : ' '),
      options: [],
    };
  }
  // Longest common prefix
  let prefix = matches[0]!;
  for (const m of matches)
    while (!m.toLowerCase().startsWith(prefix.toLowerCase())) prefix = prefix.slice(0, -1);
  return {
    line: [...parts.slice(0, -1), prefix.length > word.length ? prefix : word].join(' '),
    options: matches,
  };
}
