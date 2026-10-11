import { Sparkles, TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { cn } from '../lib/utils';
import { formatRupiah } from '../lib/format';

// Tampilan per arah tren. Pengeluaran naik = buruk (merah), turun = baik (hijau),
// flat / data belum cukup / error = netral.
const TREND_STYLE = {
  naik: {
    Icon:   TrendingUp,
    amount: 'bg-gradient-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent',
    badge:  'border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-400',
  },
  turun: {
    Icon:   TrendingDown,
    amount: 'bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent',
    badge:  'border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400',
  },
  neutral: {
    Icon:   Minus,
    amount: 'text-foreground',
    badge:  'border-border bg-muted text-muted-foreground',
  },
};

export default function PredictionCard({ onPredict, prediction, loading }) {
  const style = TREND_STYLE[prediction?.trend] ?? TREND_STYLE.neutral;
  const TrendIcon = style.Icon;

  return (
    <Card className="relative overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-purple-500/10 blur-3xl" />

      <CardHeader className="relative pb-4 text-center">
        <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
          <Sparkles size={13} /> AI Financial Consultant
        </div>
        <CardTitle className="text-xl">Proyeksi Pengeluaran Bulan Depan</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Algoritma membaca pola transaksimu untuk memprediksi masa depan.
        </p>
      </CardHeader>

      <CardContent className="relative flex min-h-[200px] flex-col items-center justify-center">
        {loading && (
          <div className="flex flex-col items-center gap-3 animate-fade-in">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm font-medium text-primary">Menganalisis data...</p>
            <p className="text-xs text-muted-foreground">Membaca pola pengeluaran</p>
          </div>
        )}

        {!loading && prediction && (
          <div className="w-full space-y-4 animate-fade-in-up text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Estimasi Total Pengeluaran
            </p>

            <p className={cn('text-5xl font-extrabold', style.amount)}>
              {formatRupiah(prediction.prediction)}
            </p>

            <div
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold',
                style.badge
              )}
            >
              <TrendIcon size={15} />
              {prediction.status}
            </div>

            <div className="mx-auto max-w-md rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground leading-relaxed">
              "{prediction.message}"
            </div>

            <button
              onClick={onPredict}
              className="text-xs text-primary hover:underline flex items-center gap-1 mx-auto"
            >
              <RefreshCw size={12} /> Analisis Ulang
            </button>
          </div>
        )}

        {!loading && !prediction && (
          <div className="flex flex-col items-center gap-4 animate-fade-in">
            <span className="text-5xl grayscale opacity-40">🔮</span>
            <p className="text-sm text-muted-foreground">
              Belum ada prediksi. Klik tombol di bawah.
            </p>
            <Button
              onClick={onPredict}
              size="lg"
              className="px-8 shadow-lg shadow-primary/30"
            >
              <Sparkles size={16} /> Ramal Sekarang
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
