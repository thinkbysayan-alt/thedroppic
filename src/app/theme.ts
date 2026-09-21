/**
 * Light/dark theme. Light is the default. A visitor's choice is stored in
 * localStorage and applied by an inline script in index.html before first
 * paint (so there is no flash of the wrong theme); this module only handles
 * the toggle after the app has loaded.
 */
export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'thedroppic-theme';
const THEME_COLOR: Record<Theme, string> = { light: '#2563ff', dark: '#0f1012' };

export function getTheme(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

export function setTheme(theme: Theme): void {
  if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme]);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Storage can be unavailable (private mode, blocked cookies): the toggle still works for this visit.
  }
}

export function toggleTheme(): Theme {
  const next: Theme = getTheme() === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
}
