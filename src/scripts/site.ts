/**
 * Site-wide progressive enhancements. Everything here is optional:
 * the site works fully without JavaScript.
 */
import { toggleTheme } from './theme.ts';

// Theme toggle
document
  .querySelectorAll('[data-theme-toggle]')
  .forEach((btn) => btn.addEventListener('click', toggleTheme));

// Header border/blur once the page scrolls
const header = document.querySelector<HTMLElement>('[data-header]');
if (header) {
  const onScroll = () => header.toggleAttribute('data-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

// Close the mobile menu popover after navigating within the page
document.querySelector('#mobile-nav')?.addEventListener('click', (e) => {
  if ((e.target as HTMLElement).closest('a')) (e.currentTarget as HTMLElement).hidePopover?.();
});

// Pointer-following spotlight on interactive cards
document.addEventListener(
  'pointermove',
  (e) => {
    const card = (e.target as HTMLElement).closest<HTMLElement>('.card-interactive');
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    card.style.setProperty('--my', `${e.clientY - rect.top}px`);
  },
  { passive: true },
);

// Copy buttons for code blocks
document.querySelectorAll<HTMLPreElement>('.prose-site pre').forEach((pre) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'copy-btn';
  button.textContent = 'copy';
  button.setAttribute('aria-label', 'Copy code to clipboard');
  button.addEventListener('click', async () => {
    const code = pre.querySelector('code')?.innerText ?? pre.innerText;
    try {
      await navigator.clipboard.writeText(code.replace(/\n$/, ''));
      button.textContent = 'copied ✓';
      button.dataset['copied'] = '';
    } catch {
      button.textContent = 'failed';
    }
    setTimeout(() => {
      button.textContent = 'copy';
      delete button.dataset['copied'];
    }, 1600);
  });
  const wrap = document.createElement('div');
  wrap.className = 'code-wrap';
  pre.before(wrap);
  wrap.append(pre, button);
});
