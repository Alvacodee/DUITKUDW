import { useState, useMemo } from 'react';
import { Plus, Trash2, Target } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { cn } from '../lib/utils';
import { isThisMonth } from '../utils/date';

const CATEGORY_META = {
  Makan:      { icon: '🍔', color: 'bg-orange-500' },
  Transport:  { icon: '🚗', color: 'bg-blue-500' },
  Belanja:    { icon: '🛍️', color: 'bg-purple-500' },
  Hiburan:    { icon: '🎬', color: 'bg-pink-500' },
  Tagihan:    { icon: '⚡', color: 'bg-yellow-500' },
  Kesehatan:  { icon: '💊', color: 'bg-red-500' },
  Pendidikan: { icon: '📚', color: 'bg-indigo-500' },
  Gaji:       { icon: '💰', color: 'bg-emerald-500' },
  Lainnya:    { icon: '📂', color: 'bg-slate-500' },
};

const STORAGE_KEY = 'duitku_budgets';

function loadBudgets() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveBudgets(b) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(b));
}

function formatRp(n) {
  return 'Rp ' + n.toLocaleString('id-ID');
}

function getStatusColor(pct) {
  if (pct >= 100) return { text: 'text-rose-500', bar: 'bg-rose-500' };
  if (pct >= 80)  return { text: 'text-amber-500', bar: 'bg-amber-500' };
  return            { text: 'text-emerald-500', bar: 'bg-emerald-500' };
}

export default function CategoryBudgets({ transactions }) {
  const [budgets, setBudgets] = useState(loadBudgets);
  const [editing, setEditing] = useState({});

  const thisMonthExpenses = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'Pengeluaran' && isThisMonth(t))
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + Number(t.amount || 0);
        return acc;
      }, {});
  }, [transactions]);

  const allCategories = Object.keys(CATEGORY_META);

  const updateBudget = (cat, value) => {
    const num = Number(value);
    if (isNaN(num) || num < 0) return;
    const next = { ...budgets, [cat]: num };
    setBudgets(next);
    saveBudgets(next);
    if (num > 0) toast.success(`Anggaran ${cat} disimpan: ${formatRp(num)}`);
  };

  const removeBudget = (cat) => {
    const next = { ...budgets };
    delete next[cat];
    setBudgets(next);
    saveBudgets(next);
    toast.info(`Anggaran ${cat} dihapus`);
  };

  const totalBudget  = Object.values(budgets).reduce((s, v) => s + v, 0);
  const totalSpent   = Object.entries(budgets).reduce((s, [cat]) => s + (thisMonthExpenses[cat] || 0), 0);
  const totalPct     = totalBudget > 0 ? Math.min(100, (totalSpent / totalBudget) * 100) : 0;
  const totalColor   = getStatusColor(totalPct);

  return (
    <div className="space-y-6">
      {/* Summary card */}
      {totalBudget > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Anggaran Bulan Ini</p>
                <p className="text-2xl font-bold">{formatRp(totalBudget)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-muted-foreground">Terpakai</p>
                <p className={cn('text-xl font-bold', totalColor.text)}>{formatRp(totalSpent)}</p>
              </div>
            </div>
            <Progress
              value={totalPct}
              className="h-3"
              indicatorClassName={totalColor.bar}
            />
            <p className="mt-1.5 text-xs text-muted-foreground text-right">
              {totalPct.toFixed(0)}% terpakai
            </p>
          </CardContent>
        </Card>
      )}

      {/* Per-category cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {allCategories.map((cat) => {
          const meta    = CATEGORY_META[cat];
          const budget  = budgets[cat] || 0;
          const spent   = thisMonthExpenses[cat] || 0;
          const pct     = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
          const status  = getStatusColor(pct);
          const isEdit  = editing[cat];

          return (
            <Card key={cat} className={cn(budget > 0 && pct >= 100 && 'border-rose-300 dark:border-rose-800')}>
              <CardContent className="p-4 space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{meta.icon}</span>
                    <span className="font-semibold text-sm">{cat}</span>
                  </div>
                  {budget > 0 && (
                    <button
                      onClick={() => removeBudget(cat)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>

                {/* Spent */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Bulan ini: <span className="font-medium text-foreground">{formatRp(spent)}</span>
                    {budget > 0 && (
                      <span> / {formatRp(budget)}</span>
                    )}
                  </p>
                  {budget > 0 && (
                    <>
                      <Progress
                        value={pct}
                        className="h-1.5"
                        indicatorClassName={status.bar}
                      />
                      <div className="flex justify-between mt-1">
                        <span className={cn('text-xs font-semibold', status.text)}>
                          {pct.toFixed(0)}%
                        </span>
                        {pct >= 100 && (
                          <span className="text-xs text-rose-500 font-medium">⚠️ Over budget!</span>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Budget input */}
                {isEdit ? (
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="0"
                      min="0"
                      defaultValue={budget || ''}
                      className="h-8 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          updateBudget(cat, e.target.value);
                          setEditing((p) => ({ ...p, [cat]: false }));
                        }
                        if (e.key === 'Escape') {
                          setEditing((p) => ({ ...p, [cat]: false }));
                        }
                      }}
                      onBlur={(e) => {
                        updateBudget(cat, e.target.value);
                        setEditing((p) => ({ ...p, [cat]: false }));
                      }}
                    />
                  </div>
                ) : (
                  <Button
                    variant={budget > 0 ? 'outline' : 'ghost'}
                    size="sm"
                    className="w-full h-8 text-xs"
                    onClick={() => setEditing((p) => ({ ...p, [cat]: true }))}
                  >
                    <Target size={13} />
                    {budget > 0 ? 'Ubah Anggaran' : 'Set Anggaran'}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
