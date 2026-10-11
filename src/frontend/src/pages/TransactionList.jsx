import { useState, useMemo } from 'react';
import {
  Search, Download, Pencil, Trash2,
  ChevronLeft, ChevronRight, SlidersHorizontal, X,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
} from '../components/ui/dialog';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '../components/ui/select';
import { cn } from '../lib/utils';
import { parseTxDate } from '../lib/date';
import { formatRupiahAbs } from '../lib/format';
import { downloadTransactionsCsv } from '../lib/csv';
import { compareNewest, isIncome, amountOf, TYPE_EXPENSE, TYPE_INCOME } from '../lib/transactions';
import { categoryIcon } from '../constants/categories';

const PER_PAGE = 15;

function formatDate(t) {
  const d = parseTxDate(t);
  return d ? d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
}


export default function TransactionList({ transactions, onEdit, onDelete, editId }) {
  const [search,       setSearch]       = useState('');
  const [filterType,   setFilterType]   = useState('all');
  const [filterCat,    setFilterCat]    = useState('all');
  const [sortBy,       setSortBy]       = useState('newest');
  const [page,         setPage]         = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showFilters,  setShowFilters]  = useState(false);

  /* ── Derived data ──────────────────────────────── */
  const categories = useMemo(() => {
    const cats = [...new Set(transactions.map((t) => t.category))].filter(Boolean);
    return cats.sort();
  }, [transactions]);

  const filtered = useMemo(() => {
    let list = [...transactions];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.description?.toLowerCase().includes(q) ||
          t.category?.toLowerCase().includes(q)
      );
    }
    if (filterType !== 'all') list = list.filter((t) => t.type === filterType);
    if (filterCat  !== 'all') list = list.filter((t) => t.category === filterCat);

    list.sort((a, b) => {
      if (sortBy === 'newest') return compareNewest(a, b);
      if (sortBy === 'oldest') return compareNewest(b, a);
      if (sortBy === 'highest') return amountOf(b) - amountOf(a);
      if (sortBy === 'lowest')  return amountOf(a) - amountOf(b);
      return 0;
    });

    return list;
  }, [transactions, search, filterType, filterCat, sortBy]);

  const totalPages   = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage     = Math.min(page, totalPages);
  const currentItems = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const resetFilters = () => {
    setSearch('');
    setFilterType('all');
    setFilterCat('all');
    setSortBy('newest');
    setPage(1);
  };

  const hasActiveFilters =
    search || filterType !== 'all' || filterCat !== 'all' || sortBy !== 'newest';

  /* ── CSV export ────────────────────────────────── */
  // Ekspor transaksi yang sedang tampil (sesuai filter)
  const handleExport = () => {
    if (!filtered.length) return;
    downloadTransactionsCsv(filtered, 'Laporan_Keuangan');
  };

  /* ── Render ─────────────────────────────────────── */
  return (
    <>
      <Card className="overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="relative flex-1 max-w-xs">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari transaksi..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-8 h-8 text-sm"
              />
            </div>
            <Button
              variant={showFilters ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setShowFilters((v) => !v)}
              className="shrink-0"
            >
              <SlidersHorizontal size={14} />
              <span className="hidden sm:inline">Filter</span>
              {hasActiveFilters && (
                <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  !
                </span>
              )}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {filtered.length} transaksi
            </span>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download size={14} />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
          </div>
        </div>

        {/* Filter bar */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-2 border-b bg-muted/30 px-4 py-3 animate-fade-in">
            <Select value={filterType} onValueChange={(v) => { setFilterType(v); setPage(1); }}>
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue placeholder="Semua Jenis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jenis</SelectItem>
                <SelectItem value={TYPE_EXPENSE}>📤 Pengeluaran</SelectItem>
                <SelectItem value={TYPE_INCOME}>📥 Pemasukan</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterCat} onValueChange={(v) => { setFilterCat(v); setPage(1); }}>
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue placeholder="Semua Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {categoryIcon(c)} {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setPage(1); }}>
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Terbaru</SelectItem>
                <SelectItem value="oldest">Terlama</SelectItem>
                <SelectItem value="highest">Nominal Terbesar</SelectItem>
                <SelectItem value="lowest">Nominal Terkecil</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" onClick={resetFilters}>
                <X size={13} /> Reset
              </Button>
            )}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 text-left">Tanggal</th>
                <th className="px-4 py-3 text-left">Keterangan</th>
                <th className="px-4 py-3 text-left">Kategori</th>
                <th className="px-4 py-3 text-right">Jumlah</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {currentItems.length > 0 ? (
                currentItems.map((t) => {
                  const incoming  = isIncome(t);
                  const isEditing = editId === t.ID;
                  return (
                    <tr
                      key={t.ID}
                      className={cn(
                        'transition-colors',
                        isEditing
                          ? 'bg-amber-50 dark:bg-amber-900/10'
                          : 'hover:bg-muted/40'
                      )}
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                        {formatDate(t)}
                      </td>
                      <td className="px-4 py-3 font-medium max-w-[200px] truncate">
                        {t.description}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded-full border bg-background px-2 py-0.5 text-xs font-medium">
                          {categoryIcon(t.category)} {t.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">
                        <span className={incoming ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                          {incoming ? '+' : '-'} {formatRupiahAbs(t.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-primary"
                            onClick={() => onEdit(t)}
                            title="Edit"
                          >
                            <Pencil size={13} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteTarget(t.ID)}
                            title="Hapus"
                          >
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-3xl">🔍</span>
                      <p className="text-sm font-medium">
                        {hasActiveFilters ? 'Tidak ada transaksi yang cocok' : 'Belum ada transaksi'}
                      </p>
                      {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={resetFilters}>
                          Reset filter
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Hal {safePage} dari {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft size={14} />
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(safePage - 2, totalPages - 4)) + i;
                return (
                  <Button
                    key={p}
                    variant={p === safePage ? 'default' : 'outline'}
                    size="icon"
                    className="h-7 w-7 text-xs"
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Transaksi?</DialogTitle>
            <DialogDescription>
              Tindakan ini tidak bisa dibatalkan. Transaksi akan dihapus permanen.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onDelete(deleteTarget);
                setDeleteTarget(null);
              }}
            >
              <Trash2 size={14} /> Ya, Hapus
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
