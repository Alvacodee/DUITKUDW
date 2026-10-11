import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

const FAQS = [
  {
    q: 'Bagaimana cara kerja prediksi AI ini?',
    a: 'Sistem menggunakan algoritma Linear Regression yang dilatih dari riwayat pengeluaranmu. Model membaca tren bulanan dan memproyeksikan pengeluaran bulan berikutnya berdasarkan pola historis.',
  },
  {
    q: 'Seberapa akurat prediksinya?',
    a: 'Akurasi meningkat seiring bertambahnya data transaksi. Dengan minimal 10 transaksi pengeluaran, akurasi prediksi sudah cukup baik. Semakin banyak data, semakin akurat.',
  },
  {
    q: 'Apa yang dimaksud tren naik / turun?',
    a: 'Tren naik berarti pengeluaranmu diprediksi meningkat dibanding bulan lalu. Tren turun berarti pengeluaranmu diprediksi berkurang — tanda kamu berhasil berhemat!',
  },
  {
    q: 'Kenapa muncul "Data tidak cukup"?',
    a: 'AI membutuhkan minimal 2 data pengeluaran untuk bekerja. Tambahkan lebih banyak transaksi pengeluaran agar prediksi bisa dihasilkan.',
  },
  {
    q: 'Apakah pemasukan ikut dihitung?',
    a: 'Tidak. Model AI hanya menganalisis transaksi dengan tipe Pengeluaran untuk memproyeksikan biaya bulan depan. Pemasukan tidak mempengaruhi prediksi.',
  },
];

function FAQItem({ item, isOpen, onToggle }) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3.5 text-left text-sm font-medium transition-colors hover:bg-muted/50"
      >
        <span>{item.q}</span>
        <ChevronDown
          size={16}
          className={cn('shrink-0 text-muted-foreground transition-transform duration-200', isOpen && 'rotate-180')}
        />
      </button>
      {isOpen && (
        <div className="border-t bg-muted/30 px-4 py-3 animate-fade-in">
          <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
        </div>
      )}
    </div>
  );
}

export default function AIExplainer() {
  const [openIdx, setOpenIdx] = useState(null);

  const toggle = (i) => setOpenIdx((prev) => (prev === i ? null : i));

  return (
    <div className="space-y-2">
      {FAQS.map((faq, i) => (
        <FAQItem
          key={i}
          item={faq}
          isOpen={openIdx === i}
          onToggle={() => toggle(i)}
        />
      ))}
    </div>
  );
}
