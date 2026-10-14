/** Once-per-session typing intro for the homepage hero ("rudractl whoami"). */
export function typeIntro() {
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
