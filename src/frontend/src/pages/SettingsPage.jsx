import { useState } from 'react';
import {
  Sun, Moon, Monitor, Download, Trash2,
  ShieldCheck, Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
} from '../components/ui/dialog';
import { cn } from '../lib/utils';
import { useTheme } from '../theme/useTheme';
import { downloadTransactionsCsv } from '../lib/csv';
import { budgetsKey, goalsKey, profileDataKey, profileImageKey } from '../lib/storage';

function SettingRow({ icon: RowIcon, label, description, action }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
          <RowIcon size={16} className="text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">{label}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}

function ThemeButton({ value, label, icon: ThemeIcon, current, onClick }) {
  return (
    <button
      onClick={() => onClick(value)}
      className={cn(
        'flex flex-col items-center gap-1.5 rounded-xl border-2 px-4 py-3 text-xs font-semibold transition-all',
        current === value
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
      )}
    >
      <ThemeIcon size={18} />
      {label}
    </button>
  );
}

const dangerButton =
  'text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30';

export default function SettingsPage({ transactions, storageUser, onProfileCleared }) {
  const { theme, setTheme } = useTheme();
  const [pendingDelete, setPendingDelete] = useState(null); // baris yang menunggu konfirmasi

  const handleExportCSV = () => {
    if (!transactions?.length) {
      toast.error('Belum ada transaksi untuk diekspor.');
      return;
    }
    downloadTransactionsCsv(transactions);
    toast.success(`${transactions.length} transaksi berhasil diekspor!`);
  };

  const handleClearBudgets = () => {
    localStorage.removeItem(budgetsKey(storageUser));
    toast.success('Data anggaran lokal berhasil dihapus.');
  };

  const handleClearGoals = () => {
    localStorage.removeItem(goalsKey(storageUser));
    toast.success('Data target tabungan lokal berhasil dihapus.');
  };

  const handleClearProfile = () => {
    localStorage.removeItem(profileDataKey(storageUser));
    localStorage.removeItem(profileImageKey(storageUser));
    onProfileCleared?.();
    toast.success('Data profil lokal berhasil dihapus.');
  };

  const localDataRows = [
    { label: 'Hapus Data Anggaran',       description: 'Menghapus batas anggaran yang tersimpan di browser ini', onClick: handleClearBudgets },
    { label: 'Hapus Target Tabungan',     description: 'Menghapus target tabungan yang tersimpan di browser ini', onClick: handleClearGoals },
    { label: 'Hapus Data Profil Lokal',   description: 'Menghapus foto & info profil yang tersimpan di browser ini', onClick: handleClearProfile },
  ];

  return (
    <div className="animate-fade-in mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Pengaturan</h2>
        <p className="text-sm text-muted-foreground mt-1">Kelola preferensi aplikasi</p>
      </div>

      {/* ── Tampilan ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Monitor size={16} className="text-muted-foreground" />
            Tampilan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-medium mb-3">Tema Aplikasi</p>
          <div className="flex gap-3">
            <ThemeButton value="light" label="Terang" icon={Sun}  current={theme} onClick={setTheme} />
            <ThemeButton value="dark"  label="Gelap"  icon={Moon} current={theme} onClick={setTheme} />
          </div>
        </CardContent>
      </Card>

      {/* ── Data & Privasi ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck size={16} className="text-muted-foreground" />
            Data & Privasi
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y p-0 px-6">
          <SettingRow
            icon={Download}
            label="Ekspor Data Transaksi"
            description={`${transactions?.length || 0} transaksi tersimpan`}
            action={
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download size={13} />
                Export CSV
              </Button>
            }
          />
          {localDataRows.map((row) => (
            <SettingRow
              key={row.label}
              icon={Trash2}
              label={row.label}
              description={row.description}
              action={
                <Button variant="outline" size="sm" className={dangerButton} onClick={() => setPendingDelete(row)}>
                  <Trash2 size={13} />
                  Hapus
                </Button>
              }
            />
          ))}
        </CardContent>
      </Card>

      <Dialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{pendingDelete?.label}?</DialogTitle>
            <DialogDescription>
              {pendingDelete?.description}. Tindakan ini tidak bisa dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setPendingDelete(null)}>Batal</Button>
            <Button
              variant="destructive"
              onClick={() => { pendingDelete.onClick(); setPendingDelete(null); }}
            >
              <Trash2 size={14} /> Ya, Hapus
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Tentang ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Info size={16} className="text-muted-foreground" />
            Tentang Aplikasi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: 'Nama Aplikasi', value: 'DUITKUDW' },
            { label: 'Versi',         value: __APP_VERSION__ },
            { label: 'Stack',         value: 'React + Go + Python ML' },
            { label: 'Database',      value: 'PostgreSQL' },
            { label: 'Dibuat oleh',   value: 'Zahran Alvan (Alvacodee)' },
            { label: 'Kontak',        value: 'duitkudw.official@gmail.com' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-1">
              <span className="text-sm text-muted-foreground">{label}</span>
              <span className="text-sm font-medium">{value}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
