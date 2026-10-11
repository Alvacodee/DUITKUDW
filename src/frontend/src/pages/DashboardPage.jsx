import { Link } from 'react-router-dom';
import DashboardStats from './DashboardStats';
import TrendChart from '../components/TrendChart';
import { parseTxDate } from '../lib/date';
import { formatRupiahAbs } from '../lib/format';
import { isIncome } from '../lib/transactions';

const RECENT_COUNT = 10;

function RecentTransactions({ transactions }) {
  const recent = transactions.slice(0, RECENT_COUNT);
  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b">
        <h3 className="text-sm font-semibold">{RECENT_COUNT} Transaksi Terakhir</h3>
        <Link to="/transactions" className="text-xs text-primary hover:underline">
          Lihat Semua →
        </Link>
      </div>
      <div className="divide-y">
        {recent.length > 0 ? (
          recent.map((t) => {
            const d    = parseTxDate(t);
            const date = d ? d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
            const isIn = isIncome(t);
            return (
              <div key={t.ID} className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-muted/30">
                <div>
                  <p className="text-sm font-medium">{t.description}</p>
                  <p className="text-xs text-muted-foreground">{t.category} • {date}</p>
                </div>
                <span className={`text-sm font-semibold tabular-nums ${
                  isIn ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {isIn ? '+' : '-'} {formatRupiahAbs(t.amount)}
                </span>
              </div>
            );
          })
        ) : (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Belum ada transaksi. Tambahkan yang pertama!
          </p>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage({ transactions }) {
  return (
    <div className="animate-fade-in space-y-8">
      <DashboardStats transactions={transactions} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TrendChart transactions={transactions} mode="daily" />
        <TrendChart transactions={transactions} mode="monthly" />
      </div>
      <RecentTransactions transactions={transactions} />
    </div>
  );
}
