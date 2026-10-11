import { useState, useMemo } from 'react';
import { Trash2, Target } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Progress } from './ui/progress';
import { cn } from '../lib/utils';
import { formatRupiah } from '../lib/format';
import { transactionsInMonth, expenseByCategory } from '../lib/transactions';
import { budgetsKey, LEGACY_BUDGET_KEYS, loadUserData, saveUserData } from '../lib/storage';
import { CATEGORIES } from '../constants/categories';

// Hanya simpan angka positif yang valid (data lama di localStorage bisa berisi apa saja)
function sanitizeBudgets(raw) {
  if (!raw || typeof raw !== 'object') return {};
  return Object.fromEntries(
    Object.entries(raw)
      .map(([cat, v]) => [cat, Number(v)])
      .filter(([, v]) => Number.isFinite(v) && v > 0)
  );
}

// "Gaji" adalah kategori pemasukan, tidak masuk akal diberi batas pengeluaran
const BUDGET_CATEGORIES = CATEGORIES.filter((c) => c.value !== 'Gaji');

function getStatusColor(pct) {
  if (pct >= 100) return { text: 'text-rose-500', bar: 'bg-rose-500' };
  if (pct >= 80)  return { text: 'text-amber-500', bar: 'bg-amber-500' };
  return            { text: 'text-emerald-500', bar: 'bg-emerald-500' };
}

export default function CategoryBudgets({ transactions, storageUser }) {
  const storageKey = budgetsKey(storageUser);
  const [budgets, setBudgets] = useState(() => sanitizeBudgets(loadUserData(storageKey, LEGACY_BUDGET_KEYS, {})));
  const [editing, setEditing] = useState({});

  // Pengeluaran per kategori bulan ini (anggaran bersifat bulanan)
  const thisMonthExpenses = useMemo(
    () => Object.fromEntries(expenseByCategory(transactionsInMonth(transactions, 0)).map((c) => [c.name, c.value])),
    [transactions]
  );

  const persist = (next) => {
    setBudgets(next);
    saveUserData(storageKey, next);
  };

  const updateBudget = (cat, value) => {
    if (value === '') return;
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) {
      toast.error('Batas anggaran harus lebih dari 0.');
      return;
    }
    persist({ ...budgets, [cat]: num });
    toast.success(`Anggaran ${cat} disimpan: ${formatRupiah(num)}`);
  };

  const removeBudget = (cat) => {
    const next = { ...budgets };
    delete next[cat];
    persist(next);
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
                <p className="text-2xl font-bold">{formatRupiah(totalBudget)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-muted-foreground">Terpakai</p>
                <p className={cn('text-xl font-bold', totalColor.text)}>{formatRupiah(totalSpent)}</p>
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
        {BUDGET_CATEGORIES.map(({ value: cat, icon }) => {
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
                    <span className="text-xl">{icon}</span>
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
                    Bulan ini: <span className="font-medium text-foreground">{formatRupiah(spent)}</span>
                    {budget > 0 && (
                      <span> / {formatRupiah(budget)}</span>
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
