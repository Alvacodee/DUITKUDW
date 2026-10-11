import { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

function processData(transactions, mode) {
  if (!transactions?.length) return [];

  const expenses = transactions.filter((t) => {
    const type = t.type?.toLowerCase() || '';
    return type === 'pengeluaran' || type === 'expense';
  });

  const grouped = expenses.reduce((acc, t) => {
    const raw = t.date || t.created_at || t.CreatedAt;
    if (!raw) return acc;
    try {
      const d = new Date(raw);
      if (isNaN(d.getTime())) return acc;
      const key =
        mode === 'monthly'
          ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          : d.toISOString().split('T')[0];
      acc[key] = (acc[key] || 0) + Number(t.amount);
    } catch { /* skip */ }
    return acc;
  }, {});

  return Object.keys(grouped)
    .sort()
    .map((key) => {
      const d = new Date(key + (mode === 'monthly' ? '-01' : ''));
      return {
        name:
          mode === 'monthly'
            ? d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
            : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        total: grouped[key],
      };
    });
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-lg border bg-card px-3 py-2 shadow-md text-xs">
        <p className="font-semibold text-foreground">{label}</p>
        <p className="text-muted-foreground">
          Rp {payload[0].value.toLocaleString('id-ID')}
        </p>
      </div>
    );
  }
  return null;
};

export default function TrendChart({ transactions, mode = 'daily' }) {
  const data    = useMemo(() => processData(transactions, mode), [transactions, mode]);
  const isMonth = mode === 'monthly';
  const stroke  = isMonth ? '#8b5cf6' : '#10b981';
  const gradId  = `grad-${mode}`;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          Pengeluaran {isMonth ? 'Bulanan' : 'Harian'}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {isMonth ? 'Tren pengeluaran per bulan' : 'Rincian pengeluaran harian'}
        </p>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={stroke} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={stroke} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--border)"
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke={stroke}
                  strokeWidth={2.5}
                  fill={`url(#${gradId})`}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-[220px] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-muted-foreground">
            <span className="text-3xl grayscale opacity-50">📉</span>
            <p className="text-sm">Belum ada data pengeluaran</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
