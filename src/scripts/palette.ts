/**
 * ⌘K / Ctrl+K command palette.
 * The search index (/api/search.json) is generated at build time and fetched
 * lazily on first open — zero cost for visitors who never use it.
 */
import { toggleTheme } from './theme.ts';

interface SearchItem {
  type: 'page' | 'project' | 'post' | 'lab' | 'tag' | 'action';
  title: string;
  url?: string;
  description?: string;
  keywords?: string;
  meta?: string;
  run?: () => void;
}

const TYPE_LABEL: Record<SearchItem['type'], string> = {
  page: 'page',
  project: 'project',
  post: 'post',
  lab: 'lab',
  tag: 'tag',
  action: 'action',
};

let index: SearchItem[] | null = null;

async function loadIndex(): Promise<SearchItem[]> {
  if (index) return index;
  try {
    const res = await fetch('/api/search.json');
    index = (await res.json()) as SearchItem[];
  } catch {
    index = [];
  }
  return index;
}

function score(item: SearchItem, terms: string[]): number {
  const title = item.title.toLowerCase();
  const rest = `${item.description ?? ''} ${item.keywords ?? ''} ${item.meta ?? ''}`.toLowerCase();
  let total = 0;
  for (const term of terms) {
    if (title.startsWith(term)) total += 30;
    else if (title.includes(term)) total += 20;
    else if (rest.includes(term)) total += 5;
    else return 0;
  }
  return total + (item.type === 'page' ? 2 : 0);
}

const escapeHtml = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => `&${{ '&': 'amp', '<': 'lt', '>': 'gt', '"': 'quot', "'": '#39' }[c]};`,
  );

export function initPalette() {
  const dialog = document.querySelector<HTMLDialogElement>('#command-palette');
  const input = dialog?.querySelector<HTMLInputElement>('[data-palette-input]');
  const list = dialog?.querySelector<HTMLUListElement>('[data-palette-results]');
  if (!dialog || !input || !list) return;

  const email = dialog.dataset['email'];
  const github = dialog.dataset['github'];
  const actions: SearchItem[] = [
    { type: 'action', title: 'Toggle theme', keywords: 'dark light mode color', run: toggleTheme },
    ...(email
      ? [
          {
            type: 'action' as const,
            title: 'Copy email address',
            description: email,
            keywords: 'contact mail',
            run: () => void navigator.clipboard?.writeText(email),
          },
        ]
      : []),
    ...(github
      ? [
          {
            type: 'action' as const,
            title: 'Open GitHub profile',
            url: `https://github.com/${github}`,
            keywords: 'source code',
          },
        ]
      : []),
    { type: 'action', title: 'Subscribe via RSS', url: '/rss.xml', keywords: 'feed blog' },
  ];

  let results: SearchItem[] = [];
  let active = 0;

  const render = () => {
    if (!results.length) {
      list.innerHTML = `<li class="px-3 py-8 text-center font-mono text-sm text-muted">No results. Try <span class="text-fg">kubernetes</span> or <span class="text-fg">blog</span>.</li>`;
      input.removeAttribute('aria-activedescendant');
      return;
    }
    list.innerHTML = results
      .map(
        (item, i) => `
        <li id="pal-${i}" role="option" aria-selected="${i === active}" data-index="${i}"
            class="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-fg-2">
          <span class="w-16 shrink-0 font-mono text-[0.68rem] uppercase tracking-wider text-muted">${TYPE_LABEL[item.type]}</span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm font-medium text-fg">${escapeHtml(item.title)}</span>
            ${item.description ? `<span class="block truncate text-xs text-muted">${escapeHtml(item.description)}</span>` : ''}
          </span>
          ${item.meta ? `<span class="hidden shrink-0 font-mono text-[0.7rem] text-muted sm:block">${escapeHtml(item.meta)}</span>` : ''}
          <span class="palette-enter font-mono text-xs text-accent opacity-0" aria-hidden="true">↵</span>
        </li>`,
      )
      .join('');
    input.setAttribute('aria-activedescendant', `pal-${active}`);
    list.querySelector(`#pal-${active}`)?.scrollIntoView({ block: 'nearest' });
  };

  const update = async () => {
    const all = [...(await loadIndex()), ...actions];
    const q = input.value
      .trim()
      .toLowerCase()
      .replace(/^[>$]\s*/, '');
    if (!q) {
      results = all.filter((i) => i.type === 'page' || i.type === 'action');
    } else {
      const terms = q.split(/\s+/);
      results = all
        .map((item) => ({ item, s: score(item, terms) }))
        .filter((r) => r.s > 0)
        .sort((a, b) => b.s - a.s)
        .slice(0, 30)
        .map((r) => r.item);
    }
    active = 0;
    render();
  };

  const choose = (item: SearchItem | undefined) => {
    if (!item) return;
    dialog.close();
    if (item.run) item.run();
    else if (item.url) {
      if (/^https?:/.test(item.url)) window.open(item.url, '_blank', 'noopener');
      else window.location.href = item.url;
    }
  };

  const open = () => {
    if (dialog.open) return;
    dialog.showModal();
    input.value = '';
    void update();
  };

  document.addEventListener('keydown', (e) => {
    const target = e.target as HTMLElement;
    const typing = target.closest('input, textarea, [contenteditable="true"]');
    if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
      e.preventDefault();
      if (dialog.open) dialog.close();
      else open();
    }
  });
  document
    .querySelectorAll('[data-palette-open]')
    .forEach((btn) => btn.addEventListener('click', open));

  input.addEventListener('input', () => void update());
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!results.length) return;
      active = (active + (e.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length;
      render();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(results[active]);
    }
  });
  list.addEventListener('click', (e) => {
    const li = (e.target as HTMLElement).closest<HTMLElement>('[data-index]');
    if (li) choose(results[Number(li.dataset['index'])]);
  });
  list.addEventListener('mousemove', (e) => {
    const li = (e.target as HTMLElement).closest<HTMLElement>('[data-index]');
    const i = Number(li?.dataset['index']);
    if (li && i !== active) {
      active = i;
      list
        .querySelectorAll('[role=option]')
        .forEach((el, idx) => el.setAttribute('aria-selected', String(idx === i)));
      input.setAttribute('aria-activedescendant', `pal-${i}`);
    }
  });
  // Close when clicking the backdrop
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });

  // Show the right modifier key
  if (/Mac|iPhone|iPad/.test(navigator.platform)) {
    document.querySelectorAll('[data-mod-key]').forEach((el) => (el.textContent = '⌘K'));
  }
}
