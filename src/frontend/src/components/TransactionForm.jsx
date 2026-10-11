import { useState } from 'react';
import { Plus, Save, X, CalendarDays, Tag, Banknote, AlignLeft, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from './ui/select';
import { cn } from '../lib/utils';
import { todayLocal, parseTxDate, toDateKey } from '../utils/date';

const CATEGORIES = [
  { value: 'Makan',       label: '🍔 Makan & Minum' },
  { value: 'Transport',   label: '🚗 Transportasi' },
  { value: 'Belanja',     label: '🛍️ Belanja' },
  { value: 'Hiburan',     label: '🎬 Hiburan' },
  { value: 'Tagihan',     label: '⚡ Tagihan & Utilitas' },
  { value: 'Kesehatan',   label: '💊 Kesehatan' },
  { value: 'Pendidikan',  label: '📚 Pendidikan' },
  { value: 'Gaji',        label: '💰 Gaji / Pendapatan' },
  { value: 'Lainnya',     label: '📂 Lainnya' },
];

// Dihitung saat dipakai (bukan saat modul dimuat) dan pakai tanggal lokal, bukan UTC.
const emptyForm = () => ({
  date:        todayLocal(),
  description: '',
  amount:      '',
  category:    'Makan',
  type:        'Pengeluaran',
});

// Isi form dari transaksi yang sedang diedit.
// Komponen di-remount (prop key di App) setiap item edit berganti, jadi cukup dihitung di initial state.
const formFromTransaction = (t) => {
  const d = parseTxDate(t);
  return {
    date:        d ? toDateKey(d) : todayLocal(),
    description: t.description || '',
    amount:      t.amount ?? '',
    category:    t.category || 'Lainnya',
    type:        t.type || 'Pengeluaran',
  };
};

export default function TransactionForm({ onSubmit, initialData, isEditMode, onCancel }) {
  const [form, setForm] = useState(() => (initialData ? formFromTransaction(initialData) : emptyForm()));
  const [submitting, setSubmitting] = useState(false);

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.description.trim()) {
      toast.error('Keterangan tidak boleh kosong.');
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error('Nominal harus lebih dari 0.');
      return;
    }
    setSubmitting(true);
    const ok = await onSubmit(form);
    setSubmitting(false);
    // Reset hanya jika berhasil disimpan & mode tambah (input tidak hilang saat gagal)
    if (ok && !isEditMode) setForm(emptyForm());
  };

  const fieldClass = 'h-9';

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          {isEditMode ? (
            <>
              <Save size={16} className="text-primary" />
              Edit Transaksi
            </>
          ) : (
            <>
              <Plus size={16} className="text-primary" />
              Tambah Transaksi
            </>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Tanggal + Jenis */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <CalendarDays size={13} className="text-muted-foreground" />
                Tanggal
              </Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => set('date', e.target.value)}
                className={fieldClass}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Layers size={13} className="text-muted-foreground" />
                Jenis
              </Label>
              <Select value={form.type} onValueChange={(v) => set('type', v)}>
                <SelectTrigger className={cn(fieldClass, form.type === 'Pemasukan' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pengeluaran">📤 Pengeluaran</SelectItem>
                  <SelectItem value="Pemasukan">📥 Pemasukan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Keterangan */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <AlignLeft size={13} className="text-muted-foreground" />
              Keterangan
            </Label>
            <Input
              type="text"
              placeholder="Contoh: Nasi Padang, Bensin, Gaji..."
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              className={fieldClass}
            />
          </div>

          {/* Row 3: Nominal + Kategori */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Banknote size={13} className="text-muted-foreground" />
                Nominal (Rp)
              </Label>
              <Input
                type="number"
                placeholder="0"
                min="0"
                value={form.amount}
                onChange={(e) => set('amount', e.target.value === '' ? '' : Number(e.target.value))}
                className={fieldClass}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Tag size={13} className="text-muted-foreground" />
                Kategori
              </Label>
              <Select value={form.category} onValueChange={(v) => set('category', v)}>
                <SelectTrigger className={fieldClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button type="submit" className="flex-1" disabled={submitting}>
              {submitting ? 'Menyimpan...' : isEditMode ? (
                <><Save size={15} /> Simpan Perubahan</>
              ) : (
                <><Plus size={15} /> Tambah</>
              )}
            </Button>
            {isEditMode && (
              <Button type="button" variant="outline" onClick={onCancel}>
                <X size={15} />
                Batal
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
