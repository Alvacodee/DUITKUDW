import { formatRupiah } from './format';
import { expenseByCategory } from './transactions';

const TIPS = {
  Makan:     (fmt) => ({ title: 'Kurangi Jajan Luar 🍔', text: `Pengeluaran terbesar: Makanan (${fmt}). Coba masak sendiri!` }),
  Transport: (fmt) => ({ title: 'Hemat Transport 🛵',     text: `Biaya transport tinggi (${fmt}). Coba kendaraan umum?` }),
  Belanja:   (fmt) => ({ title: 'Tahan Keinginan 🛍️',    text: `Belanja menghabiskan ${fmt}. Kurangi impulse buying ya!` }),
  Hiburan:   (fmt) => ({ title: 'Batasi Hiburan 🎬',      text: `Pengeluaran hiburan ${fmt}. Bisa dikurangi?` }),
};

// Saran berdasarkan kategori pengeluaran terbesar
export function getSmartTip(transactions) {
  const [top] = expenseByCategory(transactions);
  if (!top) {
    return { title: 'Mulai Mencatat 📝', text: 'Belum ada pengeluaran. Yuk mulai catat hari ini!' };
  }
  const fmt = formatRupiah(top.value);
  return TIPS[top.name]?.(fmt) ?? {
    title: `Waspada ${top.name} ⚠️`,
    text:  `Kategori ${top.name} mendominasi (${fmt}). Evaluasi kembali.`,
  };
}
