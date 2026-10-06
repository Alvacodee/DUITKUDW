// Tanggal hari ini dalam format YYYY-MM-DD berdasarkan zona waktu lokal.
// (toISOString() memakai UTC, sehingga di WIB sebelum jam 07:00 hasilnya masih "kemarin")
export const todayLocal = () => toDateKey(new Date());

export const toDateKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Parse tanggal transaksi. String "YYYY-MM-DD" diparse sebagai tanggal lokal
// (new Date("YYYY-MM-DD") dianggap UTC dan bisa bergeser 1 hari di zona waktu lain).
export const parseTxDate = (t) => {
  const src = t.date || t.CreatedAt;
  if (!src) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(src);
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(src);
  return isNaN(d.getTime()) ? null : d;
};

// Apakah transaksi terjadi di bulan & tahun berjalan
export const isThisMonth = (t) => {
  const d = parseTxDate(t);
  const now = new Date();
  return !!d && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
};
