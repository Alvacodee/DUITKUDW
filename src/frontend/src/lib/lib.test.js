import { describe, it, expect, beforeEach } from 'vitest';
import { formatRupiah, formatRupiahAbs, formatRupiahSigned } from './format';
import { validatePassword } from './passwordPolicy';
import { parseDateKey, toDateKey } from './date';
import { csvCell, transactionsToCsv } from './csv';
import { loadUserData, saveUserData, budgetsKey, LEGACY_BUDGET_KEYS } from './storage';
import {
  summarize, transactionsInMonth, pctChange, expenseByCategory, sortNewest,
  TYPE_INCOME, TYPE_EXPENSE,
} from './transactions';

describe('format', () => {
  it('mempertahankan tanda minus (BUG-03)', () => {
    expect(formatRupiah(-500000)).toBe('-Rp 500.000');
    expect(formatRupiah(1500)).toBe('Rp 1.500');
    expect(formatRupiah('abc')).toBe('Rp 0');
  });
  it('signed & abs', () => {
    expect(formatRupiahSigned(2000)).toBe('+Rp 2.000');
    expect(formatRupiahSigned(-2000)).toBe('-Rp 2.000');
    expect(formatRupiahSigned(0)).toBe('Rp 0');
    expect(formatRupiahAbs(-2000)).toBe('Rp 2.000');
  });
});

describe('passwordPolicy (harus sama dengan auth.ValidatePassword)', () => {
  it.each([
    ['Rahasia#2026', null],
    ['pendek', 'Minimal 8 karakter'],
    ['semuakecil1!', 'Huruf besar (A-Z)'],
    ['SEMUABESAR1!', 'Huruf kecil (a-z)'],
    ['TanpaAngka!!', 'Angka (0-9)'],
    ['TanpaSimbol123', 'Simbol (!@#$%...)'],
  ])('%s', (pw, expected) => {
    expect(validatePassword(pw)).toBe(expected);
  });
});

describe('date', () => {
  it('YYYY-MM-DD diparse sebagai tanggal lokal', () => {
    const d = parseDateKey('2026-03-01');
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 2, 1]);
    expect(toDateKey(d)).toBe('2026-03-01');
  });
  it('input tidak valid -> null', () => {
    expect(parseDateKey('bukan tanggal')).toBeNull();
    expect(parseDateKey('')).toBeNull();
  });
});

describe('transactions', () => {
  const now = new Date(2026, 9, 15); // 15 Okt 2026
  const tx = (date, amount, type = TYPE_EXPENSE, category = 'Makan', ID = 1) => ({ date, amount, type, category, ID });
  const list = [
    tx('2026-10-01', 100000, TYPE_INCOME, 'Gaji', 1),
    tx('2026-10-03', 30000, TYPE_EXPENSE, 'Makan', 2),
    tx('2026-10-03', 20000, TYPE_EXPENSE, 'Transport', 3),
    tx('2026-09-20', 50000, TYPE_EXPENSE, 'Makan', 4),
    tx('2025-10-02', 999, TYPE_EXPENSE, 'Makan', 5), // tahun lalu, bulan sama
  ];

  it('transactionsInMonth memperhatikan tahun & offset', () => {
    expect(transactionsInMonth(list, 0, now).map((t) => t.ID)).toEqual([1, 2, 3]);
    expect(transactionsInMonth(list, -1, now).map((t) => t.ID)).toEqual([4]);
  });

  it('transactionsInMonth melewati batas tahun', () => {
    const jan = new Date(2027, 0, 10);
    expect(transactionsInMonth([tx('2026-12-31', 1)], -1, jan)).toHaveLength(1);
  });

  it('summarize', () => {
    expect(summarize(transactionsInMonth(list, 0, now))).toEqual({ income: 100000, expense: 50000, net: 50000 });
  });

  it('pctChange: null tanpa pembanding, pembagi absolut untuk nilai negatif (INC-11)', () => {
    expect(pctChange(100, 0)).toBeNull();
    expect(pctChange(150, 100)).toBe(50);
    expect(pctChange(-50, -100)).toBe(50);
  });

  it('expenseByCategory urut dari terbesar & abaikan pemasukan', () => {
    expect(expenseByCategory(transactionsInMonth(list, 0, now))).toEqual([
      { name: 'Makan', value: 30000 },
      { name: 'Transport', value: 20000 },
    ]);
  });

  it('sortNewest: tanggal terbaru dulu, lalu ID terbesar', () => {
    expect(sortNewest(list).map((t) => t.ID)).toEqual([3, 2, 1, 4, 5]);
  });
});

describe('csv (SEC-13)', () => {
  it('menetralkan formula spreadsheet', () => {
    expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(csvCell('+62')).toBe(`"'+62"`);
    expect(csvCell('@SUM(A1)')).toBe(`"'@SUM(A1)"`);
    expect(csvCell('Nasi, "Padang"')).toBe(`"Nasi, ""Padang"""`);
  });
  it('angka tetap angka', () => {
    expect(csvCell(-5000)).toBe(`"'-5000"`);
    expect(csvCell(5000)).toBe('"5000"');
  });
  it('baris transaksi memakai tanggal ISO', () => {
    const csv = transactionsToCsv([{ date: '2026-10-01', description: 'Gaji', category: 'Gaji', type: TYPE_INCOME, amount: 100 }]);
    expect(csv.split('\r\n')[1]).toBe('"2026-10-01","Gaji","Gaji","Pemasukan","100"');
  });
});

describe('storage per user (SEC-14)', () => {
  beforeEach(() => {
    const data = new Map();
    globalThis.localStorage = {
      getItem: (k) => (data.has(k) ? data.get(k) : null),
      setItem: (k, v) => data.set(k, String(v)),
      removeItem: (k) => data.delete(k),
    };
  });

  it('data global versi lama dipindahkan sekali ke user pertama lalu dihapus', () => {
    localStorage.setItem('duitku_budgets', JSON.stringify({ Makan: 100 }));
    expect(loadUserData(budgetsKey('budi'), LEGACY_BUDGET_KEYS, {})).toEqual({ Makan: 100 });
    expect(localStorage.getItem('duitku_budgets')).toBeNull();
    // User lain tidak ikut mendapat data budi
    expect(loadUserData(budgetsKey('ani'), LEGACY_BUDGET_KEYS, {})).toEqual({});
  });

  it('data per user terpisah', () => {
    saveUserData(budgetsKey('budi'), { Makan: 1 });
    saveUserData(budgetsKey('ani'), { Makan: 2 });
    expect(loadUserData(budgetsKey('budi'))).toEqual({ Makan: 1 });
    expect(loadUserData(budgetsKey('ani'))).toEqual({ Makan: 2 });
  });

  it('JSON rusak -> fallback', () => {
    localStorage.setItem(budgetsKey('x'), '{rusak');
    expect(loadUserData(budgetsKey('x'), [], { ok: true })).toEqual({ ok: true });
  });
});
