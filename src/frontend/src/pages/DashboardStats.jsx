import { useMemo } from 'react';
import { Wallet, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import ChangeIndicator from '../components/ChangeIndicator';
import { cn } from '../lib/utils';
import { formatRupiah, formatRupiahSigned } from '../lib/format';
import { summarize, transactionsInMonth, pctChange } from '../lib/transactions';

function StatCard({ label, value, icon: CardIcon, iconBg, footer }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-start justify-between p-5">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {label}
            </p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
          </div>
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', iconBg)}>
            <CardIcon size={20} />
          </div>
        </div>
        <div className="border-t px-5 py-3 flex items-center gap-1.5">{footer}</div>
      </CardContent>
    </Card>
  );
}

export default function DashboardStats({ transactions }) {
  const stats = useMemo(() => {
    const all       = summarize(transactions);
    const thisMonth = summarize(transactionsInMonth(transactions, 0));
    const lastMonth = summarize(transactionsInMonth(transactions, -1));
    return {
      all,
      thisNet:       thisMonth.net,
      incomeChange:  pctChange(thisMonth.income, lastMonth.income),
      expenseChange: pctChange(thisMonth.expense, lastMonth.expense),
    };
  }, [transactions]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard
        label="Saldo Total"
        value={formatRupiah(stats.all.net)}
        icon={Wallet}
        iconBg={stats.all.net < 0 ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-primary/10 text-primary'}
        footer={
          <>
            <span className="text-xs text-muted-foreground">Arus kas bulan ini:</span>
            <span className={cn('text-xs font-semibold', stats.thisNet < 0 ? 'text-rose-500' : 'text-emerald-500')}>
              {formatRupiahSigned(stats.thisNet)}
            </span>
          </>
        }
      />
      <StatCard
        label="Total Pemasukan"
        value={formatRupiah(stats.all.income)}
        icon={ArrowDownLeft}
        iconBg="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
        footer={<ChangeIndicator change={stats.incomeChange} goodWhenUp label="bulan ini vs bulan lalu" />}
      />
      <StatCard
        label="Total Pengeluaran"
        value={formatRupiah(stats.all.expense)}
        icon={ArrowUpRight}
        iconBg="bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
        footer={<ChangeIndicator change={stats.expenseChange} goodWhenUp={false} label="bulan ini vs bulan lalu" />}
      />
    </div>
  );
}
