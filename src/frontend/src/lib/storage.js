// Key localStorage dibuat per-user agar data tidak "bocor" ke akun lain di browser yang sama
export const profileImageKey = (user) => `profileImage_${user || 'guest'}`;
export const profileDataKey  = (user) => `profileData_${user || 'guest'}`;
export const budgetsKey      = (user) => `budgets_${user || 'guest'}`;
export const goalsKey        = (user) => `goals_${user || 'guest'}`;

// Key global dari versi lama (sebelum data dipisah per-user)
export const LEGACY_BUDGET_KEYS = ['duitku_budgets', 'user_budgets'];
export const LEGACY_GOAL_KEYS   = ['duitku_goals'];

function parse(raw) {
  try { return raw == null ? null : JSON.parse(raw); } catch { return null; }
}

// Baca JSON milik user. Bila belum ada tetapi ada data global versi lama, data itu dipindahkan
// sekali ke user ini lalu key lama dihapus (agar tidak ikut terbaca oleh akun lain).
export function loadUserData(key, legacyKeys = [], fallback = null) {
  const own = parse(localStorage.getItem(key));
  if (own != null) return own;

  for (const legacy of legacyKeys) {
    const value = parse(localStorage.getItem(legacy));
    if (value != null) {
      localStorage.setItem(key, JSON.stringify(value));
      legacyKeys.forEach((k) => localStorage.removeItem(k));
      return value;
    }
  }
  return fallback;
}

export function saveUserData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
