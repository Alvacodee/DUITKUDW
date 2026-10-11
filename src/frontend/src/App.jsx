import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { Toaster, toast } from 'sonner';

import Sidebar          from './components/Sidebar';
import Footer           from './components/Footer';
import AuthForm         from './components/AuthForm';
import TransactionForm  from './components/TransactionForm';
import PredictionCard   from './components/PredictionCard';
import CategoryBudgets  from './components/CategoryBudget';
import ExpenseChart     from './components/ExpenseChart';
import TrendChart       from './components/TrendChart';
import AIExplainer      from './components/AIExplainer';

import DashboardStats  from './pages/DashboardStats';
import TransactionList from './pages/TransactionList';
import ProfilePage     from './pages/ProfilePage';
import ReportPage      from './pages/ReportPage';
import SettingsPage    from './pages/SettingsPage';
import GoalsPage       from './pages/GoalsPage';

import { API_URL } from './config';

// ── Helpers ───────────────────────────────────────────────
function formatRp(n) {
  return 'Rp ' + Math.abs(n).toLocaleString('id-ID');
}

function getSmartTip(transactions) {
  const expenses = transactions.filter((t) => t.type === 'Pengeluaran');
  if (!expenses.length) {
    return { title: 'Mulai Mencatat 📝', text: 'Belum ada pengeluaran. Yuk mulai catat hari ini!' };
  }
  const grouped = expenses.reduce((acc, t) => {
    const cat = t.category || 'Lainnya';
    acc[cat] = (acc[cat] || 0) + t.amount;
    return acc;
  }, {});
  let maxCat = '', maxAmt = 0;
  for (const [cat, amt] of Object.entries(grouped)) {
    if (amt > maxAmt) { maxAmt = amt; maxCat = cat; }
  }
  const fmt = formatRp(maxAmt);
  const tips = {
    Makan:     { title: 'Kurangi Jajan Luar 🍔',  text: `Pengeluaran terbesar: Makanan (${fmt}). Coba masak sendiri!` },
    Transport: { title: 'Hemat Transport 🛵',      text: `Biaya transport tinggi (${fmt}). Coba kendaraan umum?` },
    Belanja:   { title: 'Tahan Keinginan 🛍️',     text: `Belanja menghabiskan ${fmt}. Kurangi impulse buying ya!` },
    Hiburan:   { title: 'Batasi Hiburan 🎬',       text: `Pengeluaran hiburan ${fmt}. Bisa dikurangi?` },
  };
  return tips[maxCat] ?? {
    title: `Waspada ${maxCat} ⚠️`,
    text: `Kategori ${maxCat} mendominasi (${fmt}). Evaluasi kembali.`,
  };
}

const PAGE_TITLES = {
  '/':             'Dashboard Overview',
  '/transactions': 'Manajemen Transaksi',
  '/budget':       'Perencanaan Anggaran',
  '/report':       'Laporan Keuangan',
  '/forecast':     'AI Financial Forecast',
  '/profile':      'Profil Pengguna',
  '/settings':     'Pengaturan',
  '/goals':        'Target Tabungan',
};

// ── AppShell ──────────────────────────────────────────────
export default function AppShell() {
  const location  = useLocation();
  const pageTitle = PAGE_TITLES[location.pathname] ?? 'DUITKUDW';

  const [token,        setToken]        = useState(() => localStorage.getItem('token'));
  const [username,     setUsername]     = useState(() => localStorage.getItem('username'));
  const [transactions, setTransactions] = useState([]);
  const [editItem,     setEditItem]     = useState(null);
  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const [profileImage, setProfileImage] = useState(() => localStorage.getItem('profileImage'));
  const [prediction,   setPrediction]   = useState(null);
  const [loadingAI,    setLoadingAI]    = useState(false);

  // Dark mode toggle — no prop drilling, CSS vars handle theming
  const isDark    = () => document.documentElement.classList.contains('dark');
  const toggleTheme = () => {
    const dark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  };

  // ── Google OAuth callback + initial load
  useEffect(() => {
    const params   = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const urlUser  = params.get('username');

    if (urlToken) {
      localStorage.setItem('token', urlToken);
      setToken(urlToken);
      const u = urlUser || 'User';
      localStorage.setItem('username', u);
      setUsername(u);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const activeToken = urlToken || token;
    if (activeToken) fetchTransactions(activeToken);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auth
  const handleLogin = (newToken) => {
    setToken(newToken);
    setUsername(localStorage.getItem('username'));
    fetchTransactions(newToken);
  };

  const handleLogout = () => {
    ['token', 'username'].forEach((k) => localStorage.removeItem(k));
    setToken(null);
    setUsername(null);
    setTransactions([]);
    setPrediction(null);
    toast.success('Berhasil keluar.');
  };

  // ── Transactions
  const fetchTransactions = async (tkn = token) => {
    if (!tkn) return;
    try {
      const res  = await fetch(`${API_URL}/transactions`, {
        headers: { Authorization: `Bearer ${tkn}` },
      });
      if (res.status === 401) { handleLogout(); return; }
      const data = await res.json();
      if (data.data) setTransactions(data.data.sort((a, b) => b.ID - a.ID));
    } catch {
      toast.error('Gagal memuat data transaksi.');
    }
  };

  const handleFormSubmit = async (formData) => {
    const url    = editItem ? `${API_URL}/transactions/${editItem.ID}` : `${API_URL}/transactions`;
    const method = editItem ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...formData, amount: parseInt(formData.amount) }),
      });
      if (res.status === 401) { handleLogout(); return; }
      if (res.ok) {
        toast.success(editItem ? 'Transaksi diperbarui!' : 'Transaksi ditambahkan!');
        fetchTransactions();
        setEditItem(null);
        setPrediction(null);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Terjadi kesalahan.');
      }
    } catch {
      toast.error('Gagal menyimpan transaksi.');
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_URL}/transactions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { handleLogout(); return; }
      if (res.ok) {
        toast.success('Transaksi dihapus.');
        fetchTransactions();
        setPrediction(null);
      }
    } catch {
      toast.error('Gagal menghapus transaksi.');
    }
  };

  // ── AI Predict
  const handlePredict = async () => {
    setLoadingAI(true);
    setPrediction(null);
    try {
      const res  = await fetch(`${API_URL}/predict`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (res.status === 401) { handleLogout(); return; }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal');
      const icon = data.trend === 'naik' ? '📈' : '📉';
      setPrediction({
        prediction: data.prediction,
        status:     `Tren ${data.trend.charAt(0).toUpperCase() + data.trend.slice(1)} ${icon}`,
        message:    data.message,
      });
      toast.success('Prediksi AI berhasil!');
    } catch {
      setPrediction({ prediction: 0, status: 'Error', message: 'Server AI tidak dapat dihubungi.' });
      toast.error('Prediksi AI gagal.');
    } finally {
      setLoadingAI(false);
    }
  };

  const smartTip = getSmartTip(transactions);

  // ── Layout vars
  const sidebarW = sidebarOpen ? 'ml-56' : 'ml-[60px]';

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-200">
      <Toaster position="top-right" richColors closeButton />

      {/* Sidebar */}
      {token && (
        <Sidebar
          user={username}
          onLogout={handleLogout}
          isOpen={sidebarOpen}
          toggleSidebar={() => setSidebarOpen((v) => !v)}
          profileImage={profileImage}
        />
      )}

      {/* Main */}
      <div className={`flex flex-1 flex-col min-h-screen transition-all duration-300 ${token ? sidebarW : ''}`}>

        {/* ── Header — h-14 matches sidebar brand row ── */}
        {token && (
          <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background/90 backdrop-blur-sm px-6">
            <h1 className="text-sm font-semibold text-foreground/80 animate-fade-in">
              {pageTitle}
            </h1>
            <button
              onClick={toggleTheme}
              className="rounded-full border p-2 transition-colors hover:bg-accent"
              aria-label="Toggle theme"
            >
              {isDark()
                ? <Sun  size={15} className="text-amber-400" />
                : <Moon size={15} className="text-slate-500" />}
            </button>
          </header>
        )}

        {/* ── Page content ── */}
        <main className={`flex-grow ${token ? 'p-6 lg:p-8' : ''}`}>
          <Routes>
            {/* ── Auth / public ── */}
            <Route
              path="/"
              element={
                token ? (
                  <div className="animate-fade-in space-y-8">
                    <DashboardStats transactions={transactions} />

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                      <TrendChart transactions={transactions} mode="daily" />
                      <TrendChart transactions={transactions} mode="monthly" />
                    </div>

                    {/* Recent transactions */}
                    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-3.5 border-b">
                        <h3 className="text-sm font-semibold">10 Transaksi Terakhir</h3>
                        <Link to="/transactions" className="text-xs text-primary hover:underline">
                          Lihat Semua →
                        </Link>
                      </div>
                      <div className="divide-y">
                        {transactions.slice(0, 10).length > 0 ? (
                          transactions.slice(0, 10).map((t) => {
                            const raw  = t.date || t.created_at || t.CreatedAt;
                            const d    = raw ? new Date(raw) : null;
                            const date = d && !isNaN(d)
                              ? d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                              : '-';
                            const isIn = t.type === 'Pemasukan';
                            return (
                              <div
                                key={t.ID}
                                className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-muted/30"
                              >
                                <div>
                                  <p className="text-sm font-medium">{t.description}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {t.category} • {date}
                                  </p>
                                </div>
                                <span className={`text-sm font-semibold tabular-nums ${
                                  isIn
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-rose-600 dark:text-rose-400'
                                }`}>
                                  {isIn ? '+' : '-'} {formatRp(t.amount)}
                                </span>
                              </div>
                            );
                          })
                        ) : (
                          <p className="py-12 text-center text-sm text-muted-foreground">
                            Belum ada transaksi. Tambahkan yang pertama!
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <AuthForm onLogin={handleLogin} />
                )
              }
            />

            {/* ── Protected routes ── */}
            {token && (
              <>
                {/* Transaksi */}
                <Route
                  path="/transactions"
                  element={
                    <div className="animate-fade-in space-y-6">
                      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <ExpenseChart transactions={transactions} />
                        <div className="flex flex-col items-center justify-center rounded-xl border bg-card p-8 text-center shadow-sm">
                          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-3xl dark:bg-amber-900/30">
                            💡
                          </div>
                          <h3 className="mb-2 text-lg font-bold">{smartTip.title}</h3>
                          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                            {smartTip.text}
                          </p>
                        </div>
                      </div>
                      <TransactionForm
                        onSubmit={handleFormSubmit}
                        initialData={editItem}
                        isEditMode={!!editItem}
                        onCancel={() => setEditItem(null)}
                      />
                      <TransactionList
                        transactions={transactions}
                        onEdit={setEditItem}
                        onDelete={handleDelete}
                        editId={editItem?.ID}
                      />
                    </div>
                  }
                />

                {/* Anggaran */}
                <Route
                  path="/budget"
                  element={
                    <div className="animate-fade-in space-y-6">
                      <div>
                        <h2 className="text-2xl font-bold">Perencanaan Anggaran</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                          Tetapkan batas pengeluaran per kategori setiap bulan.
                        </p>
                      </div>
                      <CategoryBudgets transactions={transactions} />
                    </div>
                  }
                />

                {/* Laporan — new */}
                <Route
                  path="/report"
                  element={<ReportPage transactions={transactions} />}
                />

                {/* AI Forecast */}
                <Route
                  path="/forecast"
                  element={
                    <div className="animate-fade-in mx-auto max-w-2xl space-y-10 pb-10">
                      <div className="text-center">
                        <h2 className="text-2xl font-bold">AI Financial Consultant</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Proyeksi cerdas pengeluaran bulananmu berbasis riwayat transaksi.
                        </p>
                      </div>
                      <PredictionCard
                        onPredict={handlePredict}
                        prediction={prediction}
                        loading={loadingAI}
                      />
                      <div>
                        <h3 className="mb-5 text-center text-lg font-semibold">
                          Pertanyaan Umum
                        </h3>
                        <AIExplainer />
                      </div>
                    </div>
                  }
                />

                {/* Profil */}
                <Route
                  path="/profile"
                  element={
                    <ProfilePage
                      user={username}
                      profileImage={profileImage}
                      setProfileImage={setProfileImage}
                    />
                  }
                />

                {/* Pengaturan — new */}
                <Route
                  path="/settings"
                  element={<SettingsPage transactions={transactions} />}
                />

                {/* Target Tabungan — new */}
                <Route
                  path="/goals"
                  element={<GoalsPage />}
                />
              </>
            )}

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        {token && <Footer />}
      </div>
    </div>
  );
}
