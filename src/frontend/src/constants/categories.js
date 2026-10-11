// Satu sumber metadata kategori untuk form, daftar transaksi, anggaran, dan grafik.
export const CATEGORIES = [
  { value: 'Makan',      label: 'Makan & Minum',       icon: '🍔', color: 'bg-orange-500' },
  { value: 'Transport',  label: 'Transportasi',        icon: '🚗', color: 'bg-blue-500' },
  { value: 'Belanja',    label: 'Belanja',             icon: '🛍️', color: 'bg-purple-500' },
  { value: 'Hiburan',    label: 'Hiburan',             icon: '🎬', color: 'bg-pink-500' },
  { value: 'Tagihan',    label: 'Tagihan & Utilitas',  icon: '⚡', color: 'bg-yellow-500' },
  { value: 'Kesehatan',  label: 'Kesehatan',           icon: '💊', color: 'bg-red-500' },
  { value: 'Pendidikan', label: 'Pendidikan',          icon: '📚', color: 'bg-indigo-500' },
  { value: 'Gaji',       label: 'Gaji / Pendapatan',   icon: '💰', color: 'bg-emerald-500' },
  { value: 'Lainnya',    label: 'Lainnya',             icon: '📂', color: 'bg-slate-500' },
];

export const DEFAULT_CATEGORY = 'Lainnya';

const BY_VALUE = Object.fromEntries(CATEGORIES.map((c) => [c.value, c]));

// Metadata kategori; kategori tak dikenal (data lama) memakai metadata "Lainnya".
export function categoryMeta(value) {
  return BY_VALUE[value] ?? { ...BY_VALUE[DEFAULT_CATEGORY], value, label: value || DEFAULT_CATEGORY };
}

export function categoryIcon(value) {
  return categoryMeta(value).icon;
}
