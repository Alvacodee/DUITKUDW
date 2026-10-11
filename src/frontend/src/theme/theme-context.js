import { createContext } from 'react';

export const THEME_STORAGE_KEY = 'theme';

export const ThemeContext = createContext(null);

// Tema awal: pilihan user di localStorage, default terang.
export function getInitialTheme() {
  return localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light';
}

// Dipanggil sebelum React render (main.jsx) agar tidak ada "kedipan" tema terang saat reload.
export function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}
