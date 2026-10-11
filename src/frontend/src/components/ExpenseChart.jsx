import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#6366f1'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    const { name, value } = payload[0];
    return (
      <div className="rounded-lg border bg-card px-3 py-2 shadow-md text-xs">
        <p className="font-semibold">{name}</p>
        <p className="text-muted-foreground">Rp {value.toLocaleString('id-ID')}</p>
      </div>
    );
  }
  return null;
};

const CustomLegend = ({ payload }) => (
  <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
    {payload?.map((entry, i) => (
      <li key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
        <span className="truncate">{entry.value}</span>
      </li>
    ))}
  </ul>
);

export default function ExpenseChart({ transactions }) {
  const { data, total } = useMemo(() => {
    const expenses = transactions.filter((t) => t.type === 'Pengeluaran');
    const totalAmt = expenses.reduce((s, t) => s + t.amount, 0);

    const grouped = expenses.reduce((acc, t) => {
      const cat = t.category || 'Lainnya';
      acc[cat] = (acc[cat] || 0) + t.amount;
      return acc;
    }, {});

    const chartData = Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return { data: chartData, total: totalAmt };
  }, [transactions]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Komposisi Pengeluaran</CardTitle>
        <p className="text-xs text-muted-foreground">Berdasarkan kategori (semua waktu)</p>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="relative h-56">
            {/* Center label */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center z-10">
              <p className="text-xs text-muted-foreground">Total Keluar</p>
              <p className="text-base font-bold">
                Rp {(total / 1000).toFixed(0)}k
              </p>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={88}
                  paddingAngle={3}
                  dataKey="value"
                  cornerRadius={5}
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend content={<CustomLegend />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-56 flex-col items-center justify-center gap-2 text-muted-foreground">
            <span className="text-4xl grayscale opacity-50">🍩</span>
            <p className="text-sm">Belum ada data pengeluaran</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
