import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import ChangeIndicator from '../components/ChangeIndicator';
import { cn } from '../lib/utils';
import { formatRupiah, formatRupiahSigned } from '../lib/format';
import { summarize, transactionsInMonth, expenseByCategory, pctChange } from '../lib/transactions';

const MONTHS_SHOWN = 6;
const TOP_CATEGORIES = 5;
const CAT_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-md text-xs space-y-1">
      <p className="font-semibold">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {formatRupiah(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function ReportPage({ transactions }) {
  const { monthly, topCategories, thisMonth, lastMonth } = useMemo(() => {
    const now = new Date();

    // Ringkasan 6 bulan terakhir (terlama -> terbaru)
    const months = [];
    for (let offset = -(MONTHS_SHOWN - 1); offset <= 0; offset++) {
      const { income, expense, net } = summarize(transactionsInMonth(transactions, offset, now));
      const name = new Date(now.getFullYear(), now.getMonth() + offset, 1)
        .toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
      months.push({ name, income, expense, net });
    }

    const topCats  = expenseByCategory(transactionsInMonth(transactions, 0, now)).slice(0, TOP_CATEGORIES);
    const totalCat = topCats.reduce((s, c) => s + c.value, 0);

    return {
      monthly:       months,
      topCategories: topCats.map((c) => ({ ...c, pct: totalCat > 0 ? (c.value / totalCat) * 100 : 0 })),
      thisMonth:     months[months.length - 1],
      lastMonth:     months[months.length - 2],
    };
  }, [transactions]);

  const monthLabel = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  const summaryCards = [
    {
      label:      'Pemasukan Bulan Ini',
      value:      thisMonth.income,
      icon:       ArrowDownLeft,
      color:      'text-emerald-500',
      bg:         'bg-emerald-100 dark:bg-emerald-900/30',
      change:     pctChange(thisMonth.income, lastMonth.income),
      goodWhenUp: true,
    },
    {
      label:      'Pengeluaran Bulan Ini',
      value:      thisMonth.expense,
      icon:       ArrowUpRight,
      color:      'text-rose-500',
      bg:         'bg-rose-100 dark:bg-rose-900/30',
      change:     pctChange(thisMonth.expense, lastMonth.expense),
      goodWhenUp: false,
    },
    {
      label:      'Saldo Bersih',
      value:      thisMonth.net,
      icon:       thisMonth.net >= 0 ? TrendingUp : TrendingDown,
      color:      thisMonth.net >= 0 ? 'text-primary' : 'text-rose-500',
      bg:         thisMonth.net >= 0 ? 'bg-primary/10' : 'bg-rose-100 dark:bg-rose-900/30',
      change:     pctChange(thisMonth.net, lastMonth.net),
      goodWhenUp: true,
    },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Laporan Keuangan</h2>
        <p className="text-sm text-muted-foreground mt-1">Ringkasan finansial — {monthLabel}</p>
      </div>

      {/* ── This month summary ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {summaryCards.map((item) => {
          const CardIcon = item.icon;
          return (
            <Card key={item.label}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {item.label}
                    </p>
                    <p className={cn('text-2xl font-bold mt-1', item.color)}>
                      {formatRupiah(item.value)}
                    </p>
                  </div>
                  <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', item.bg)}>
                    <CardIcon size={18} className={item.color} />
                  </div>
                </div>
                <ChangeIndicator change={item.change} goodWhenUp={item.goodWhenUp} />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── 6-month bar chart ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Tren 6 Bulan Terakhir</CardTitle>
          <p className="text-xs text-muted-foreground">Perbandingan pemasukan vs pengeluaran</p>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly} margin={{ top: 4, right: 4, left: -12, bottom: 0 }} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                    axisLine={false} tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                    axisLine={false} tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="income"  name="Pemasukan"   fill="#10b981" radius={[4,4,0,0]} maxBarSize={32} />
                  <Bar dataKey="expense" name="Pengeluaran" fill="#f43f5e" radius={[4,4,0,0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center gap-2 text-muted-foreground">
              <span className="text-4xl grayscale opacity-50">📊</span>
              <p className="text-sm">Belum ada data transaksi</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Top categories + monthly table ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top categories */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Top Pengeluaran Bulan Ini</CardTitle>
            <p className="text-xs text-muted-foreground">Kategori terbesar bulan ini</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {topCategories.length > 0 ? (
              topCategories.map((cat, i) => (
                <div key={cat.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }}
                      />
                      <span className="font-medium">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{cat.pct.toFixed(0)}%</span>
                      <span className="font-semibold tabular-nums">{formatRupiah(cat.value)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${cat.pct}%`,
                        backgroundColor: CAT_COLORS[i % CAT_COLORS.length],
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Belum ada pengeluaran bulan ini
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly summary table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Ringkasan Per Bulan</CardTitle>
            <p className="text-xs text-muted-foreground">6 bulan terakhir</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-xs text-muted-foreground">
                    <th className="px-4 py-2.5 text-left font-semibold">Bulan</th>
                    <th className="px-4 py-2.5 text-right font-semibold text-emerald-500">Masuk</th>
                    <th className="px-4 py-2.5 text-right font-semibold text-rose-500">Keluar</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {[...monthly].reverse().map((m) => {
                    const net = m.income - m.expense;
                    return (
                      <tr key={m.name} className="transition-colors hover:bg-muted/30">
                        <td className="px-4 py-2.5 font-medium">{m.name}</td>
                        <td className="px-4 py-2.5 text-right text-emerald-600 dark:text-emerald-400 tabular-nums text-xs">
                          {formatRupiah(m.income)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-rose-600 dark:text-rose-400 tabular-nums text-xs">
                          {formatRupiah(m.expense)}
                        </td>
                        <td className={cn(
                          'px-4 py-2.5 text-right font-semibold tabular-nums text-xs',
                          net >= 0 ? 'text-primary' : 'text-rose-500'
                        )}>
                          {formatRupiahSigned(net)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
