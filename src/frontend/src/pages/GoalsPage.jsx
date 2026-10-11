import { useState } from 'react';
import {
  Plus, Pencil, Trash2, X, Save,
  CalendarDays, Coins,
  CheckCircle2, Clock, AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
} from '../components/ui/dialog';
import { cn } from '../lib/utils';
import { formatRupiahAbs } from '../lib/format';
import { parseDateKey } from '../lib/date';
import { goalsKey, LEGACY_GOAL_KEYS, loadUserData, saveUserData } from '../lib/storage';

const EMOJIS = ['🎯','💻','✈️','🏠','🚗','📱','🎓','💍','🎸','📷','🏋️','🌏','💰','🛋️','📚'];

const EMPTY_FORM = {
  name: '', emoji: '🎯', targetAmount: '', currentAmount: '',
  deadline: '', notes: '',
};

// Sisa hari menuju deadline (tanggal lokal, dihitung dari awal hari ini)
function daysLeft(deadline) {
  const target = parseDateKey(deadline);
  if (!target) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

function GoalStatus({ pct, days }) {
  if (pct >= 100) return <Badge variant="success"><CheckCircle2 size={11} /> Tercapai!</Badge>;
  if (days !== null && days < 0) return <Badge variant="danger"><AlertCircle size={11} /> Deadline lewat</Badge>;
  if (days !== null && days <= 30) return <Badge variant="warning"><Clock size={11} /> {days}h lagi</Badge>;
  return <Badge variant="outline"><Clock size={11} /> {days !== null ? `${days}h lagi` : 'No deadline'}</Badge>;
}

function GoalCard({ goal, onEdit, onDelete, onAddFund }) {
  const pct  = goal.targetAmount > 0
    ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)
    : 0;
  const days = daysLeft(goal.deadline);
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

  const barColor =
    pct >= 100  ? 'bg-emerald-500' :
    days !== null && days < 0 ? 'bg-rose-500' :
    days !== null && days <= 30 ? 'bg-amber-500' :
    'bg-primary';

  return (
    <Card className={cn('overflow-hidden transition-all hover:shadow-md', pct >= 100 && 'border-emerald-300 dark:border-emerald-800')}>
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="text-3xl leading-none">{goal.emoji}</span>
            <div>
              <p className="font-semibold leading-tight">{goal.name}</p>
              {goal.notes && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{goal.notes}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <GoalStatus pct={pct} days={days} />
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="font-semibold tabular-nums text-primary">
              {formatRupiahAbs(goal.currentAmount)}
            </span>
            <span className="text-muted-foreground tabular-nums">
              {formatRupiahAbs(goal.targetAmount)}
            </span>
          </div>
          <Progress
            value={pct}
            className="h-2.5"
            indicatorClassName={barColor}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{pct.toFixed(1)}% tercapai</span>
            {remaining > 0 && <span>Kurang {formatRupiahAbs(remaining)}</span>}
          </div>
        </div>

        {/* Deadline */}
        {goal.deadline && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays size={12} />
            <span>
              Target: {parseDateKey(goal.deadline)?.toLocaleDateString('id-ID', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          {pct < 100 && (
            <Button
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={() => onAddFund(goal)}
            >
              <Coins size={13} /> Tambah Dana
            </Button>
          )}
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onEdit(goal)}>
            <Pencil size={13} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:border-destructive/30"
            onClick={() => onDelete(goal.id)}
          >
            <Trash2 size={13} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main page ─────────────────────────────────────────────
export default function GoalsPage({ storageUser }) {
  const storageKey = goalsKey(storageUser);
  const [goals,       setGoals]       = useState(() => {
    const saved = loadUserData(storageKey, LEGACY_GOAL_KEYS, []);
    return Array.isArray(saved) ? saved : [];
  });
  const [showForm,    setShowForm]    = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [fundTarget,  setFundTarget]  = useState(null);
  const [fundAmount,  setFundAmount]  = useState('');
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const totalTarget  = goals.reduce((s, g) => s + Number(g.targetAmount), 0);
  const totalSaved   = goals.reduce((s, g) => s + Number(g.currentAmount), 0);
  const completed    = goals.filter((g) => Number(g.currentAmount) >= Number(g.targetAmount)).length;

  const openNew = () => {
    setEditingGoal(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (goal) => {
    setEditingGoal(goal);
    setForm({
      name:          goal.name,
      emoji:         goal.emoji,
      targetAmount:  goal.targetAmount,
      currentAmount: goal.currentAmount,
      deadline:      goal.deadline || '',
      notes:         goal.notes || '',
    });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) { toast.error('Nama target tidak boleh kosong.'); return; }
    if (!form.targetAmount || Number(form.targetAmount) <= 0) {
      toast.error('Nominal target harus lebih dari 0.'); return;
    }

    const updated = editingGoal
      ? goals.map((g) =>
          g.id === editingGoal.id
            ? { ...g, ...form, targetAmount: Number(form.targetAmount), currentAmount: Number(form.currentAmount) || 0 }
            : g
        )
      : [
          ...goals,
          {
            id:            Date.now(),
            ...form,
            targetAmount:  Number(form.targetAmount),
            currentAmount: Number(form.currentAmount) || 0,
            createdAt:     new Date().toISOString(),
          },
        ];

    setGoals(updated);
    saveUserData(storageKey, updated);
    setShowForm(false);
    toast.success(editingGoal ? 'Target diperbarui!' : 'Target tabungan ditambahkan! 🎯');
  };

  const handleDelete = (id) => {
    const updated = goals.filter((g) => g.id !== id);
    setGoals(updated);
    saveUserData(storageKey, updated);
    setDeleteTarget(null);
    toast.success('Target dihapus.');
  };

  const handleAddFund = () => {
    const amount = Number(fundAmount);
    if (!amount || amount <= 0) { toast.error('Masukkan jumlah dana yang valid.'); return; }
    const updated = goals.map((g) => {
      if (g.id !== fundTarget.id) return g;
      const newAmt = Math.min(g.currentAmount + amount, g.targetAmount);
      return { ...g, currentAmount: newAmt };
    });
    setGoals(updated);
    saveUserData(storageKey, updated);

    const goal = updated.find((g) => g.id === fundTarget.id);
    const reached = goal.currentAmount >= goal.targetAmount;
    toast.success(reached ? `🎉 Target "${goal.name}" tercapai!` : `+${formatRupiahAbs(amount)} ditambahkan ke "${goal.name}"!`);
    setFundTarget(null);
    setFundAmount('');
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">Target Tabungan</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Rencanakan dan pantau tujuan keuanganmu
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus size={15} /> Tambah Target
        </Button>
      </div>

      {/* ── Summary ── */}
      {goals.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: 'Total Target', value: formatRupiahAbs(totalTarget), icon: '🎯', color: 'text-primary' },
            { label: 'Total Terkumpul', value: formatRupiahAbs(totalSaved), icon: '💰', color: 'text-emerald-500' },
            { label: 'Target Tercapai', value: `${completed} / ${goals.length}`, icon: '🏆', color: 'text-amber-500' },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-4 p-4">
                <span className="text-3xl">{s.icon}</span>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
                  <p className={cn('text-xl font-bold', s.color)}>{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Goals grid ── */}
      {goals.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={openEdit}
              onDelete={(id) => setDeleteTarget(id)}
              onAddFund={(g) => { setFundTarget(g); setFundAmount(''); }}
            />
          ))}
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-20 text-center animate-fade-in">
          <span className="text-6xl mb-4">🎯</span>
          <h3 className="text-lg font-semibold mb-2">Belum ada target tabungan</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">
            Buat target pertamamu — liburan, laptop baru, atau apapun yang ingin kamu capai!
          </p>
          <Button onClick={openNew} size="lg">
            <Plus size={16} /> Buat Target Pertama
          </Button>
        </div>
      )}

      {/* ── Add / Edit dialog ── */}
      <Dialog open={showForm} onOpenChange={(o) => !o && setShowForm(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingGoal ? 'Edit Target' : 'Tambah Target Baru'}</DialogTitle>
            <DialogDescription>
              {editingGoal ? 'Perbarui informasi target tabunganmu.' : 'Tetapkan tujuan keuangan baru.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            {/* Emoji picker */}
            <div className="space-y-1.5">
              <Label>Ikon</Label>
              <div className="flex flex-wrap gap-1.5">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, emoji: e }))}
                    className={cn(
                      'h-9 w-9 rounded-lg border-2 text-xl transition-all',
                      form.emoji === e
                        ? 'border-primary bg-primary/10 scale-110'
                        : 'border-border hover:border-primary/40'
                    )}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="g-name">Nama Target</Label>
              <Input
                id="g-name"
                placeholder="Contoh: Laptop Baru, Liburan Bali..."
                value={form.name}
                onChange={set('name')}
              />
            </div>

            {/* Amounts */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="g-target">Target (Rp)</Label>
                <Input
                  id="g-target"
                  type="number"
                  placeholder="15000000"
                  min="0"
                  value={form.targetAmount}
                  onChange={set('targetAmount')}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="g-current">Sudah Terkumpul (Rp)</Label>
                <Input
                  id="g-current"
                  type="number"
                  placeholder="0"
                  min="0"
                  value={form.currentAmount}
                  onChange={set('currentAmount')}
                />
              </div>
            </div>

            {/* Deadline */}
            <div className="space-y-1.5">
              <Label htmlFor="g-deadline">Deadline (opsional)</Label>
              <Input
                id="g-deadline"
                type="date"
                value={form.deadline}
                onChange={set('deadline')}
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="g-notes">Catatan (opsional)</Label>
              <Input
                id="g-notes"
                placeholder="Untuk apa tabungan ini?"
                value={form.notes}
                onChange={set('notes')}
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button className="flex-1" onClick={handleSave}>
                <Save size={14} /> {editingGoal ? 'Simpan' : 'Tambah Target'}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                <X size={14} />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Add fund dialog ── */}
      <Dialog open={!!fundTarget} onOpenChange={(o) => !o && setFundTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{fundTarget?.emoji}</span> Tambah Dana
            </DialogTitle>
            <DialogDescription>
              Masukkan jumlah yang ingin kamu tambahkan ke "{fundTarget?.name}".
            </DialogDescription>
          </DialogHeader>

          {fundTarget && (
            <div className="space-y-4 pt-1">
              {/* Current progress */}
              <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Terkumpul</span>
                  <span className="font-semibold">{formatRupiahAbs(fundTarget.currentAmount)}</span>
                </div>
                <Progress
                  value={Math.min(100, (fundTarget.currentAmount / fundTarget.targetAmount) * 100)}
                  className="h-1.5"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{((fundTarget.currentAmount / fundTarget.targetAmount) * 100).toFixed(1)}%</span>
                  <span>Target: {formatRupiahAbs(fundTarget.targetAmount)}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fund-amt">Jumlah Dana (Rp)</Label>
                <Input
                  id="fund-amt"
                  type="number"
                  placeholder="500000"
                  min="0"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleAddFund()}
                />
              </div>

              <div className="flex gap-2">
                <Button className="flex-1" onClick={handleAddFund}>
                  <Coins size={14} /> Tambahkan
                </Button>
                <Button variant="outline" onClick={() => setFundTarget(null)}>Batal</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Delete confirm dialog ── */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Target?</DialogTitle>
            <DialogDescription>
              Tindakan ini tidak bisa dibatalkan. Semua data progress akan hilang.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Batal</Button>
            <Button variant="destructive" onClick={() => handleDelete(deleteTarget)}>
              <Trash2 size={14} /> Ya, Hapus
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
