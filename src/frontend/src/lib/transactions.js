import { parseTxDate } from './date';

// Nilai baku kolom type (sama dengan models.TypeIncome / TypeExpense di backend).
export const TYPE_INCOME  = 'Pemasukan';
export const TYPE_EXPENSE = 'Pengeluaran';

export const isIncome  = (t) => t.type === TYPE_INCOME;
export const isExpense = (t) => t.type === TYPE_EXPENSE;

export const amountOf = (t) => Number(t.amount) || 0;

export const sumAmount = (list) => list.reduce((s, t) => s + amountOf(t), 0);

// Urutan "terbaru": tanggal transaksi, lalu urutan input (ID)
export const compareNewest = (a, b) => (b.date || '').localeCompare(a.date || '') || b.ID - a.ID;

export const sortNewest = (list) => [...list].sort(compareNewest);

// Transaksi pada bulan (now + offset). offset 0 = bulan ini, -1 = bulan lalu.
export function transactionsInMonth(list, offset = 0, now = new Date()) {
  const target = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  return list.filter((t) => {
    const d = parseTxDate(t);
    return !!d && d.getFullYear() === target.getFullYear() && d.getMonth() === target.getMonth();
  });
}

// Ringkasan pemasukan/pengeluaran/saldo sebuah daftar transaksi
export function summarize(list) {
  const income  = sumAmount(list.filter(isIncome));
  const expense = sumAmount(list.filter(isExpense));
  return { income, expense, net: income - expense };
}

// Persentase perubahan prev -> curr. null bila tidak ada pembanding (prev = 0),
// agar UI menampilkan "—" alih-alih angka menyesatkan seperti 0% atau 100%.
export function pctChange(curr, prev) {
  if (!prev) return null;
  return ((curr - prev) / Math.abs(prev)) * 100;
}

// Pengeluaran per kategori, diurutkan dari yang terbesar
export function expenseByCategory(list) {
  const grouped = list.filter(isExpense).reduce((acc, t) => {
    const cat = t.category || 'Lainnya';
    acc[cat] = (acc[cat] || 0) + amountOf(t);
    return acc;
  }, {});
  return Object.entries(grouped)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}
