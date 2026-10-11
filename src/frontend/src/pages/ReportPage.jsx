import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { TrendingUp, TrendingDown, CalendarDays, ArrowDownLeft, ArrowUpRight, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { cn } from '../lib/utils';
import { formatRupiah, formatRupiahSigned } from '../lib/format';

function getMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthLabel(key) {
  const [year, month] = key.split('-');
  return new Date(year, month - 1, 1).toLocaleDateString('id-ID', {
    month: 'short', year: 'numeric',
  });
}

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
  const { monthly, topCategories, thisMonthStats, lastMonthStats } = useMemo(() => {
    const now       = new Date();
    const thisKey   = getMonthKey(now);
    const lastDate  = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastKey   = getMonthKey(lastDate);

    // Group by month
    const byMonth = {};
    transactions.forEach((t) => {
      const raw = t.date || t.created_at || t.CreatedAt;
      if (!raw) return;
      const d = new Date(raw);
      if (isNaN(d)) return;
      const key = getMonthKey(d);
      if (!byMonth[key]) byMonth[key] = { income: 0, expense: 0 };
      if (t.type === 'Pemasukan')   byMonth[key].income  += t.amount;
      if (t.type === 'Pengeluaran') byMonth[key].expense += t.amount;
    });

    // Monthly chart data — last 6 months
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d   = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = getMonthKey(d);
      months.push({
        name:    getMonthLabel(key),
        income:  byMonth[key]?.income  || 0,
        expense: byMonth[key]?.expense || 0,
        net:     (byMonth[key]?.income || 0) - (byMonth[key]?.expense || 0),
      });
    }

    // Top categories this month
    const thisExpenses = transactions.filter((t) => {
      if (t.type !== 'Pengeluaran') return false;
      const raw = t.date || t.created_at || t.CreatedAt;
      if (!raw) return false;
      const d = new Date(raw);
      return !isNaN(d) && getMonthKey(d) === thisKey;
    });

    const catMap = thisExpenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

    const topCats = Object.entries(catMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));

    const totalCat = topCats.reduce((s, c) => s + c.value, 0);

    return {
      monthly:       months,
      topCategories: topCats.map((c) => ({ ...c, pct: totalCat > 0 ? (c.value / totalCat) * 100 : 0 })),
      thisMonthStats: byMonth[thisKey] || { income: 0, expense: 0 },
      lastMonthStats: byMonth[lastKey] || { income: 0, expense: 0 },
    };
  }, [transactions]);

  const thisNet  = thisMonthStats.income - thisMonthStats.expense;
  const lastNet  = lastMonthStats.income - lastMonthStats.expense;
  const netDelta = lastNet !== 0 ? ((thisNet - lastNet) / Math.abs(lastNet)) * 100 : 0;

  const now        = new Date();
  const monthLabel = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  const CAT_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Laporan Keuangan</h2>
        <p className="text-sm text-muted-foreground mt-1">Ringkasan finansial — {monthLabel}</p>
      </div>

      {/* ── This month summary ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            label: 'Pemasukan Bulan Ini',
            value: thisMonthStats.income,
            icon:  ArrowDownLeft,
            color: 'text-emerald-500',
            bg:    'bg-emerald-100 dark:bg-emerald-900/30',
            delta: lastMonthStats.income
              ? ((thisMonthStats.income - lastMonthStats.income) / lastMonthStats.income) * 100
              : 0,
          },
          {
            label: 'Pengeluaran Bulan Ini',
            value: thisMonthStats.expense,
            icon:  ArrowUpRight,
            color: 'text-rose-500',
            bg:    'bg-rose-100 dark:bg-rose-900/30',
            delta: lastMonthStats.expense
              ? ((thisMonthStats.expense - lastMonthStats.expense) / lastMonthStats.expense) * 100
              : 0,
            invertDelta: true,
          },
          {
            label: 'Saldo Bersih',
            value: thisNet,
            icon:  thisNet >= 0 ? TrendingUp : TrendingDown,
            color: thisNet >= 0 ? 'text-primary' : 'text-rose-500',
            bg:    thisNet >= 0 ? 'bg-primary/10' : 'bg-rose-100 dark:bg-rose-900/30',
            delta: netDelta,
          },
        ].map((item) => {
          const Icon   = item.icon;
          const isUp   = item.delta > 1;
          const isDown = item.delta < -1;
          const good   = item.invertDelta ? isDown : isUp;

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
                    <Icon size={18} className={item.color} />
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  {isUp && <TrendingUp size={12} className={good ? 'text-emerald-500' : 'text-rose-500'} />}
                  {isDown && <TrendingDown size={12} className={good ? 'text-emerald-500' : 'text-emerald-500'} />}
                  {!isUp && !isDown && <Minus size={12} className="text-muted-foreground" />}
                  <span className={cn(
                    'font-semibold',
                    !isUp && !isDown ? 'text-muted-foreground' : good ? 'text-emerald-500' : 'text-rose-500'
                  )}>
                    {item.delta > 0 ? '+' : ''}{item.delta.toFixed(1)}%
                  </span>
                  <span className="text-muted-foreground">vs bulan lalu</span>
                </div>
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
