export type Theme = 'dark' | 'light';

export const currentTheme = (): Theme =>
  document.documentElement.dataset['theme'] === 'light' ? 'light' : 'dark';

export function setTheme(theme: Theme) {
  const apply = () => {
    document.documentElement.dataset['theme'] = theme;
    try {
      localStorage.setItem('theme', theme);
    } catch {
      /* storage unavailable — theme still applies for this page */
    }
  };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce && 'startViewTransition' in document) document.startViewTransition(apply);
  else apply();
}

export const toggleTheme = () => setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
