/** Binds the rudractl-sh engine to a prompt in the page (hero prompt or terminal mode). */
import { complete, esc, loadData, run, type ShellHost } from './engine.ts';
import { track } from '../analytics.ts';

export interface MountOptions {
  form: HTMLFormElement;
  input: HTMLInputElement;
  log: HTMLElement;
  /** Element whose text shows the current directory (e.g. "~/blog"). */
  path?: HTMLElement | null;
  /** Scroll container (defaults to the log). */
  scroller?: HTMLElement | null;
  /** Persist history, cwd and scrollback in sessionStorage under this key. */
  storageKey?: string;
  /** Called by `exit` — omit for the inline hero prompt. */
  exit?: () => void;
  /** Where commands came from, for analytics. */
  source: string;
}

interface Saved {
  cwd: string;
  history: string[];
  lines: string[];
}

const MAX_LINES = 120;

export function mountShell(opts: MountOptions) {
  const { form, input, log, storageKey } = opts;
  const scroller = opts.scroller ?? log;
  const load = (): Saved => {
    try {
      const raw = storageKey ? sessionStorage.getItem(storageKey) : null;
      if (raw) return JSON.parse(raw) as Saved;
    } catch {
      /* storage unavailable */
    }
    return { cwd: '', history: [], lines: [] };
  };
  const state = load();
  const save = () => {
    if (!storageKey) return;
    try {
      state.lines = state.lines.slice(-MAX_LINES);
      sessionStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  };

  const promptHtml = () =>
    `<span class="ps1">visitor@rudractl</span><span class="text-muted">:</span><span class="ps1-path">~${state.cwd ? `/${esc(state.cwd)}` : ''}</span><span class="ps1">$</span>`;
  const updatePath = () => {
    if (opts.path) opts.path.textContent = `~${state.cwd ? `/${state.cwd}` : ''}`;
  };

  const append = (html: string, persist = true) => {
    const el = document.createElement('div');
    el.className = 'shell-line';
    el.innerHTML = html;
    log.append(el);
    if (persist) state.lines.push(html);
    scroller.scrollTop = scroller.scrollHeight;
  };

  const host: ShellHost = {
    get cwd() {
      return state.cwd;
    },
    set cwd(v: string) {
      state.cwd = v;
      updatePath();
    },
    get history() {
      return state.history;
    },
    clear() {
      log.innerHTML = '';
      state.lines = [];
    },
    navigate(url: string) {
      save();
      window.location.href = url;
    },
    ...(opts.exit ? { exit: opts.exit } : {}),
  };

  // Restore scrollback from a previous page in this session
  for (const line of state.lines) append(line, false);
  updatePath();

  let cursor = state.history.length;
  let busy = false;

  async function execute(line: string) {
    const value = line.trim();
    append(`${promptHtml()} <span class="text-fg">${esc(value)}</span>`);
    if (!value) return save();
    state.history.push(value);
    state.history = state.history.slice(-100);
    cursor = state.history.length;
    track('terminal_command', { command: value.split(/\s+/)[0] ?? '', source: opts.source });
    busy = true;
    try {
      const out = await run(value, host);
      if (out) append(`<div class="shell-out">${out}</div>`);
    } catch {
      append(
        '<span class="text-error">Something went wrong loading data — check your connection.</span>',
      );
    } finally {
      busy = false;
      save();
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (busy) return;
    const value = input.value;
    input.value = '';
    void execute(value);
  });

  input.addEventListener('focus', () => void loadData().catch(() => {}), { once: true });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') {
      if (cursor > 0) input.value = state.history[--cursor] ?? '';
    } else if (e.key === 'ArrowDown') {
      cursor = Math.min(cursor + 1, state.history.length);
      input.value = state.history[cursor] ?? '';
    } else if (e.key === 'Tab') {
      if (!input.value) return; // let Tab move focus when the prompt is empty (keyboard users)
      const { line, options } = complete(input.value, host);
      input.value = line;
      if (options.length > 1)
        append(
          `${promptHtml()} ${esc(line)}\n<span class="text-muted">${options.map(esc).join('   ')}</span>`,
          false,
        );
    } else if (e.key === 'l' && e.ctrlKey) {
      host.clear();
      save();
    } else if (e.key === 'c' && e.ctrlKey && !window.getSelection()?.toString()) {
      append(
        `${promptHtml()} <span class="text-fg">${esc(input.value)}</span><span class="text-muted">^C</span>`,
      );
      input.value = '';
    } else return;
    e.preventDefault();
  });

  return {
    run: (line: string) => execute(line),
    focus: () => input.focus({ preventScroll: true }),
    hasHistory: () => state.lines.length > 0,
  };
}
