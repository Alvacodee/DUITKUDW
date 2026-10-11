import { useState, useEffect } from 'react';
import {
  Sun, Moon, Monitor, Download, Trash2,
  ShieldCheck, Info, Bell, Globe,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { cn } from '../lib/utils';

function SettingRow({ icon: Icon, label, description, action }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon size={16} className="text-muted-foreground" />
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

function ThemeButton({ value, label, icon: Icon, current, onClick }) {
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
      <Icon size={18} />
      {label}
    </button>
  );
}

export default function SettingsPage({ transactions }) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('theme') || 'dark'
  );
  const [currency, setCurrency] = useState(
    () => localStorage.getItem('currency') || 'IDR'
  );

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleExportCSV = () => {
    if (!transactions?.length) {
      toast.error('Belum ada transaksi untuk diekspor.');
      return;
    }
    const headers = 'Tanggal,Keterangan,Kategori,Tipe,Jumlah';
    const rows = transactions.map((t) => {
      const raw  = t.date || t.created_at || t.CreatedAt;
      const date = raw ? new Date(raw).toLocaleDateString('id-ID') : '-';
      const desc = `"${(t.description || '').replace(/"/g, '""')}"`;
      return `${date},${desc},${t.category},${t.type},${t.amount}`;
    });
    const csv  = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `DUITKUDW_Export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`${transactions.length} transaksi berhasil diekspor!`);
  };

  const handleClearBudgets = () => {
    localStorage.removeItem('duitku_budgets');
    toast.success('Data anggaran lokal berhasil dihapus.');
  };

  const handleClearProfile = () => {
    localStorage.removeItem('profileData');
    localStorage.removeItem('profileImage');
    toast.success('Data profil lokal berhasil dihapus.');
  };

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
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-3">Tema Aplikasi</p>
            <div className="flex gap-3">
              <ThemeButton value="light"  label="Terang"  icon={Sun}     current={theme} onClick={setTheme} />
              <ThemeButton value="dark"   label="Gelap"   icon={Moon}    current={theme} onClick={setTheme} />
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-sm font-medium mb-3">Mata Uang</p>
            <div className="flex gap-3">
              {[
                { value: 'IDR', label: 'IDR — Rupiah' },
                { value: 'USD', label: 'USD — Dollar' },
              ].map((c) => (
                <button
                  key={c.value}
                  onClick={() => {
                    setCurrency(c.value);
                    localStorage.setItem('currency', c.value);
                    toast.success(`Mata uang diubah ke ${c.value}`);
                  }}
                  className={cn(
                    'rounded-lg border-2 px-4 py-2 text-xs font-semibold transition-all',
                    currency === c.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/40'
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
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
          <SettingRow
            icon={Trash2}
            label="Hapus Data Anggaran"
            description="Menghapus target anggaran yang tersimpan di browser"
            action={
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30"
                onClick={handleClearBudgets}
              >
                <Trash2 size={13} />
                Hapus
              </Button>
            }
          />
          <SettingRow
            icon={Trash2}
            label="Hapus Data Profil Lokal"
            description="Menghapus foto & info profil yang tersimpan di browser"
            action={
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30"
                onClick={handleClearProfile}
              >
                <Trash2 size={13} />
                Hapus
              </Button>
            }
          />
        </CardContent>
      </Card>

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
            { label: 'Nama Aplikasi',  value: 'DUITKUDW' },
            { label: 'Versi',          value: '2.0.0' },
            { label: 'Stack',          value: 'React + Go + Python ML' },
            { label: 'Database',       value: 'PostgreSQL (Supabase)' },
            { label: 'Dibuat oleh',    value: 'Zahran Alvan (Alvacodee)' },
            { label: 'Kontak',         value: 'duitkudw.official@gmail.com' },
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
