// User-selectable appearance: theme + accent color.
// Applied by setting a class / CSS variables on <html>; consumed across the app.

export const ACCENTS = {
  blue:   { key: 'blue',   label: 'Blue',   color: '#3FB6F8', fg: '#06222e' },
  green:  { key: 'green',  label: 'Green',  color: '#34D399', fg: '#06241a' },
  violet: { key: 'violet', label: 'Violet', color: '#A78BFA', fg: '#160f2e' },
  orange: { key: 'orange', label: 'Orange', color: '#F5A623', fg: '#2c1d06' },
  pink:   { key: 'pink',   label: 'Pink',   color: '#FB7BA0', fg: '#2c0a16' },
  cyan:   { key: 'cyan',   label: 'Cyan',   color: '#22D3EE', fg: '#06222a' },
};

export const ACCENT_LIST = Object.values(ACCENTS);

export const applyAppearance = ({ theme = 'dark', accent = 'blue' } = {}) => {
  const root = document.documentElement;
  if (theme === 'light') root.classList.add('theme-light');
  else root.classList.remove('theme-light');
  const a = ACCENTS[accent] || ACCENTS.blue;
  root.style.setProperty('--brand', a.color);
  root.style.setProperty('--brand-fg', a.fg);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'light' ? '#f4f6f9' : '#121212');
};