import { parseTxDate, todayLocal, toDateKey } from './date';

// Sel yang diawali karakter ini dieksekusi sebagai formula oleh Excel/Sheets (CSV injection).
const FORMULA_PREFIX = /^[=+\-@\t\r]/;

// Escape satu sel CSV: netralkan formula dengan awalan ', lalu selalu bungkus tanda kutip.
export function csvCell(value) {
  let s = value == null ? '' : String(value);
  if (FORMULA_PREFIX.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export function toCsv(rows) {
  return rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
}

// Tanggal ditulis ISO (YYYY-MM-DD) agar terbaca benar oleh spreadsheet di locale mana pun
export function transactionsToCsv(transactions) {
  const header = ['Tanggal', 'Keterangan', 'Kategori', 'Tipe', 'Jumlah'];
  const rows = transactions.map((t) => {
    const d = parseTxDate(t);
    return [d ? toDateKey(d) : '', t.description, t.category, t.type, Number(t.amount) || 0];
  });
  return toCsv([header, ...rows]);
}

// Unduh transaksi sebagai CSV. BOM di awal agar Excel membaca UTF-8 (emoji/aksen) dengan benar.
export function downloadTransactionsCsv(transactions, prefix = 'DUITKUDW_Transaksi') {
  const blob = new Blob(['\uFEFF', transactionsToCsv(transactions)], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${prefix}_${todayLocal()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
