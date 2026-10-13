/**
 * Hero terminal: a fast typing intro plus an *optional* tiny shell.
 * Navigation never depends on it — every command maps to a normal link.
 */
import { toggleTheme } from './theme.ts';

interface TermData {
  name: string;
  role: string;
  tagline: string;
  location?: string;
  focus: string[];
  contact: { id: string; display: string; href: string }[];
  projects: { name: string; href: string; status: string; description: string }[];
  posts: { title: string; href: string; date: string }[];
  labs: { name: string; href: string; status: string }[];
  uses: { group: string; items: string[] }[];
}

const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => `&${{ '&': 'amp', '<': 'lt', '>': 'gt', '"': 'quot', "'": '#39' }[c]};`,
  );
const link = (href: string, text: string) => `<a class="link" href="${esc(href)}">${esc(text)}</a>`;
const muted = (s: string) => `<span class="text-muted">${s}</span>`;
const pad = (s: string, n: number) => esc(s.padEnd(n)).replace(/ /g, '&nbsp;');

const SECTIONS: Record<string, string> = {
  home: '/',
  '~': '/',
  '/': '/',
  opensource: '/opensource/',
  projects: '/opensource/',
  blog: '/blog/',
  lab: '/lab/',
  uses: '/uses/',
  about: '/about/',
};

function typeIntro() {
  const root = document.documentElement;
  if (!root.classList.contains('hero-typing')) return;
  const target = document.querySelector<HTMLElement>('[data-type-target]');
  const text = target?.dataset['text'] ?? '';
  if (!target) return root.classList.remove('hero-typing');
  target.textContent = '';
  target.dataset['typing'] = '';
  let i = 0;
  const step = () => {
    target.textContent = text.slice(0, ++i);
    if (i < text.length) setTimeout(step, 28 + Math.random() * 30);
    else
      setTimeout(() => {
        root.classList.remove('hero-typing');
        try {
          sessionStorage.setItem('hero-typed', '1');
        } catch {
          /* ignore */
        }
      }, 160);
  };
  setTimeout(step, 180);
}

export function initHeroTerminal() {
  typeIntro();

  const form = document.querySelector<HTMLFormElement>('[data-term-form]');
  const input = document.querySelector<HTMLInputElement>('[data-term-input]');
  const log = document.querySelector<HTMLElement>('[data-term-log]');
  const raw = document.querySelector('#term-data')?.textContent;
  if (!form || !input || !log || !raw) return;
  const data = JSON.parse(raw) as TermData;
  const history: string[] = [];
  let cursor = 0;

  const print = (html: string) => {
    const line = document.createElement('div');
    line.innerHTML = html;
    log.append(line);
  };

  const commands: Record<string, (args: string[]) => string | void> = {
    help: () =>
      [
        'Available commands:',
        ...[
          ['whoami', 'who is this?'],
          ['projects', 'open-source work'],
          ['blog', 'latest writing'],
          ['lab', 'experiments'],
          ['uses', 'tools I use'],
          ['contact', 'get in touch'],
          ['cd <page>', 'navigate (about, blog, lab…)'],
          ['theme', 'toggle dark / light'],
          ['clear', 'clear the screen'],
        ].map(
          ([c, d]) =>
            `&nbsp;&nbsp;<span class="text-accent">${pad(c ?? '', 12)}</span>${muted(d ?? '')}`,
        ),
        muted('Tip: Ctrl/⌘ + K searches everything.'),
      ].join('<br>'),
    whoami: () =>
      `<span class="text-fg">${esc(data.name)}</span> — ${esc(data.role)}${data.location ? ` ${muted(`· ${esc(data.location)}`)}` : ''}<br>${esc(data.tagline)}`,
    projects: () =>
      data.projects.length
        ? data.projects
            .map(
              (p) =>
                `<span class="text-accent">${pad(p.status, 13)}</span>${link(p.href, p.name)} ${muted(`— ${esc(p.description)}`)}`,
            )
            .join('<br>')
        : muted('No projects yet.'),
    blog: () =>
      data.posts.map((p) => `${muted(p.date)}&nbsp;&nbsp;${link(p.href, p.title)}`).join('<br>') ||
      muted('No posts yet.'),
    lab: () =>
      [
        muted(pad('EXPERIMENT', 30) + 'STATUS'),
        ...data.labs.map(
          (l) =>
            `${link(l.href, l.name)}${'&nbsp;'.repeat(Math.max(1, 30 - l.name.length))}${esc(l.status)}`,
        ),
      ].join('<br>'),
    uses: () =>
      data.uses
        .map(
          (g) => `<span class="text-fg">${esc(g.group)}</span>: ${muted(esc(g.items.join(', ')))}`,
        )
        .join('<br>'),
    contact: () =>
      data.contact
        .map((c) => `<span class="text-accent">${pad(c.id, 10)}</span>${link(c.href, c.display)}`)
        .join('<br>'),
    cd: ([where = '~']) => {
      const href = SECTIONS[where.replace(/^~?\/?|\/$/g, '') || '~'];
      if (!href) return `cd: no such file or directory: ${esc(where)}`;
      window.location.href = href;
      return muted(`→ ${href}`);
    },
    ls: () =>
      Object.keys(SECTIONS)
        .filter((k) => /^[a-z]/.test(k) && k !== 'home' && k !== 'projects')
        .map((k) => link(SECTIONS[k] ?? '/', `${k}/`))
        .join('&nbsp;&nbsp;'),
    theme: () => {
      toggleTheme();
      return muted('theme toggled.');
    },
    date: () => esc(new Date().toString()),
    echo: (args) => esc(args.join(' ')),
    pwd: () => esc(window.location.pathname),
    sudo: (args) =>
      args.join(' ').startsWith('hire')
        ? `[sudo] password for visitor: ••••••••<br><span class="text-warning">Nice try.</span><br><br>Try: <span class="text-accent">rudractl contact</span>`
        : 'visitor is not in the sudoers file. This incident will be reported. 🙂',
    kubectl: (args) =>
      args[0] === 'get'
        ? [
            `${muted(pad('NAME', 28) + pad('READY', 8) + pad('STATUS', 10) + 'AGE')}`,
            `${pad('portfolio-7f9c6d-x2k4p', 28)}${pad('1/1', 8)}<span class="text-accent">${pad('Running', 10)}</span>∞`,
            `${pad('blog-5b8d9f-q8w3n', 28)}${pad('1/1', 8)}<span class="text-accent">${pad('Running', 10)}</span>∞`,
          ].join('<br>')
        : muted('this cluster only supports `kubectl get` 😉'),
    rm: () => 'rm: this site is immutable — it is rebuilt from Git on every push.',
    exit: () => 'There is no escape. (Try the navigation above.)',
    vim: () => 'You are now stuck in vim. Just kidding. Type :q to… oh wait.',
    clear: () => {
      log.innerHTML = '';
    },
  };
  commands['posts'] = commands['blog']!;
  commands['open'] = commands['cd']!;
  commands['about'] = () => commands['cd']!(['about']);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const value = input.value.trim();
    input.value = '';
    if (!value) return;
    history.push(value);
    cursor = history.length;
    print(`<span class="ps1">$</span> <span class="text-fg">${esc(value)}</span>`);
    const [name = '', ...args] = value.replace(/^rudractl\s+/, '').split(/\s+/);
    const cmd = commands[name.toLowerCase()];
    const out = cmd
      ? cmd(args)
      : `command not found: ${esc(name)}. Type <span class="text-accent">help</span>.`;
    if (out) print(`<div class="pb-1 text-fg-2">${out}</div>`);
    input.scrollIntoView({ block: 'nearest' });
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' && cursor > 0) input.value = history[--cursor] ?? '';
    else if (e.key === 'ArrowDown') {
      cursor = Math.min(cursor + 1, history.length);
      input.value = history[cursor] ?? '';
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      log.innerHTML = '';
    } else return;
    e.preventDefault();
  });
}
