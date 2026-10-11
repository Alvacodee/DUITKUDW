// Format angka ke Rupiah. Nilai negatif tetap diberi tanda minus ("-Rp 50.000")
// agar defisit tidak terlihat seperti saldo positif.
export function formatRupiah(n) {
  const value = Number(n) || 0;
  const abs   = Math.abs(value).toLocaleString('id-ID');
  return value < 0 ? `-Rp ${abs}` : `Rp ${abs}`;
}

// Nominal tanpa tanda, untuk tampilan yang sudah memberi tanda sendiri (mis. "+ Rp 5.000" / "- Rp 5.000").
export function formatRupiahAbs(n) {
  return `Rp ${Math.abs(Number(n) || 0).toLocaleString('id-ID')}`;
}

// Rupiah dengan tanda eksplisit untuk selisih: "+Rp 5.000" / "-Rp 5.000" / "Rp 0".
export function formatRupiahSigned(n) {
  const value = Number(n) || 0;
  return value > 0 ? `+${formatRupiah(value)}` : formatRupiah(value);
}
