import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../lib/utils';

// Perubahan di bawah 1% dianggap stabil
const FLAT_THRESHOLD = 1;

// Persentase perubahan dengan warna sesuai makna: goodWhenUp = naik itu baik
// (pemasukan, saldo) atau buruk (pengeluaran). change null = tidak ada pembanding.
export default function ChangeIndicator({ change, goodWhenUp = true, label = 'vs bulan lalu' }) {
  if (change === null || change === undefined) {
    return <span className="text-xs text-muted-foreground">Belum ada data bulan lalu</span>;
  }

  const direction = change > FLAT_THRESHOLD ? 'up' : change < -FLAT_THRESHOLD ? 'down' : 'flat';
  const good = direction === 'flat' ? null : (direction === 'up') === goodWhenUp;
  const tone = good === null ? 'text-muted-foreground' : good ? 'text-emerald-500' : 'text-rose-500';
  const DirectionIcon = direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : Minus;

  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <DirectionIcon size={14} className={tone} />
      <span className={cn('font-semibold', tone)}>
        {change > 0 ? '+' : ''}{change.toFixed(1)}%
      </span>
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}
