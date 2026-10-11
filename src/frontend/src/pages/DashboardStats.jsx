import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Wallet, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { cn } from '../lib/utils';
import { parseTxDate } from '../utils/date';

function getMonthTransactions(transactions, offset = 0) {
  const now   = new Date();
  const year  = now.getMonth() + 1 + offset <= 0
    ? now.getFullYear() - 1
    : now.getFullYear();
  const month = ((now.getMonth() + offset) % 12 + 12) % 12;

  return transactions.filter((t) => {
    const d = parseTxDate(t);
    return !!d && d.getFullYear() === year && d.getMonth() === month;
  });
}

function pctChange(curr, prev) {
  if (prev === 0) return curr > 0 ? 100 : 0;
  return ((curr - prev) / prev) * 100;
}

function StatCard({ label, value, icon: Icon, iconBg, change, changeLabel, positive }) {
  const trend =
    change > 1 ? 'up' : change < -1 ? 'down' : 'flat';

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
            <Icon size={20} />
          </div>
        </div>

        {/* Trend bar */}
        <div className="border-t px-5 py-3 flex items-center gap-1.5">
          {trend === 'up' && (
            <TrendingUp
              size={14}
              className={cn(positive ? 'text-emerald-500' : 'text-rose-500')}
            />
          )}
          {trend === 'down' && (
            <TrendingDown
              size={14}
              className={cn(positive ? 'text-emerald-500' : 'text-emerald-500')}
            />
          )}
          {trend === 'flat' && <Minus size={14} className="text-muted-foreground" />}

          <span
            className={cn(
              'text-xs font-semibold',
              trend === 'flat' && 'text-muted-foreground',
              trend === 'up' && (positive ? 'text-emerald-500' : 'text-rose-500'),
              trend === 'down' && 'text-emerald-500'
            )}
          >
            {trend !== 'flat' && (change > 0 ? '+' : '')}
            {change.toFixed(1)}%
          </span>
          <span className="text-xs text-muted-foreground">{changeLabel}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardStats({ transactions }) {
  const fmt = (n) => 'Rp ' + Math.abs(n).toLocaleString('id-ID');

  const { totalIncome, totalExpense, balance, incomeChange, expenseChange } = useMemo(() => {
    const allIncome  = transactions.filter((t) => t.type === 'Pemasukan').reduce((s, t) => s + Number(t.amount || 0), 0);
    const allExpense = transactions.filter((t) => t.type === 'Pengeluaran').reduce((s, t) => s + Number(t.amount || 0), 0);

    const thisMonth = getMonthTransactions(transactions, 0);
    const lastMonth = getMonthTransactions(transactions, -1);

    const thisIncome  = thisMonth.filter((t) => t.type === 'Pemasukan').reduce((s, t) => s + Number(t.amount || 0), 0);
    const thisExpense = thisMonth.filter((t) => t.type === 'Pengeluaran').reduce((s, t) => s + Number(t.amount || 0), 0);
    const prevIncome  = lastMonth.filter((t) => t.type === 'Pemasukan').reduce((s, t) => s + Number(t.amount || 0), 0);
    const prevExpense = lastMonth.filter((t) => t.type === 'Pengeluaran').reduce((s, t) => s + Number(t.amount || 0), 0);

    return {
      totalIncome:   allIncome,
      totalExpense:  allExpense,
      balance:       allIncome - allExpense,
      incomeChange:  pctChange(thisIncome, prevIncome),
      expenseChange: pctChange(thisExpense, prevExpense),
    };
  }, [transactions]);

  const balanceChange = pctChange(totalIncome - totalExpense, totalIncome);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard
        label="Saldo Total"
        value={fmt(balance)}
        icon={Wallet}
        iconBg="bg-primary/10 text-primary"
        change={balanceChange}
        changeLabel="dari pemasukan"
        positive
      />
      <StatCard
        label="Total Pemasukan"
        value={fmt(totalIncome)}
        icon={ArrowDownLeft}
        iconBg="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
        change={incomeChange}
        changeLabel="vs bulan lalu"
        positive
      />
      <StatCard
        label="Total Pengeluaran"
        value={fmt(totalExpense)}
        icon={ArrowUpRight}
        iconBg="bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
        change={expenseChange}
        changeLabel="vs bulan lalu"
        positive={false}
      />
    </div>
  );
}
