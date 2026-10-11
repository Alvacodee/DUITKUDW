import { useState, useEffect, useCallback } from 'react';
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
import ForgotPassword  from './pages/ForgotPassword';
import ResetPassword   from './pages/ResetPassword';
import ContactPage     from './pages/ContactPage';
import { TermsPage, PrivacyPage, RefundPage } from './pages/LegalPage';

import { API_URL } from './config';
import { profileImageKey } from './utils/storage';
import { parseTxDate } from './utils/date';
import { useTheme } from './theme/useTheme';

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
    acc[cat] = (acc[cat] || 0) + Number(t.amount || 0);
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

// Login Google: backend redirect ke "/?token=...&username=...".
// Simpan ke localStorage lalu bersihkan URL. Aman dipanggil berkali-kali (idempotent).
const consumeAuthFromUrl = () => {
  const params   = new URLSearchParams(window.location.search);
  const urlToken = params.get('token');
  if (urlToken && window.location.pathname === '/') {
    localStorage.setItem('token', urlToken);
    localStorage.setItem('username', params.get('username') || 'User');
    window.history.replaceState({}, document.title, window.location.pathname);
  }
};

// Urutkan transaksi: tanggal terbaru dulu, lalu yang terakhir diinput
const sortTransactions = (list) =>
  [...list].sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.ID - a.ID);

const PAGE_TITLES = {
  '/':             'Dashboard Overview',
  '/transactions': 'Manajemen Transaksi',
  '/budget':       'Perencanaan Anggaran',
  '/report':       'Laporan Keuangan',
  '/forecast':     'AI Financial Forecast',
  '/profile':      'Profil Pengguna',
  '/settings':     'Pengaturan',
  '/goals':        'Target Tabungan',
  '/terms':        'Syarat Layanan',
  '/privacy':      'Kebijakan Privasi',
  '/refund':       'Kebijakan Refund',
  '/contact':      'Hubungi Support',
};

// ── AppShell ──────────────────────────────────────────────
export default function AppShell() {
  const location  = useLocation();
  const pageTitle = PAGE_TITLES[location.pathname] ?? 'DUITKUDW';

  const [token,        setToken]        = useState(() => { consumeAuthFromUrl(); return localStorage.getItem('token'); });
  const [username,     setUsername]     = useState(() => localStorage.getItem('username'));
  const [transactions, setTransactions] = useState([]);
  const [editItem,     setEditItem]     = useState(null);
  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const [profileImage, setProfileImage] = useState(() => localStorage.getItem(profileImageKey(localStorage.getItem('username'))));
  const [prediction,   setPrediction]   = useState(null);
  const [loadingAI,    setLoadingAI]    = useState(false);

  const { isDark, setTheme, toggleTheme } = useTheme();
  const setDarkMode = (dark) => setTheme(dark ? 'dark' : 'light');

  // ── Auth
  const handleLogin = (newToken, newUsername) => {
    setToken(newToken);
    setUsername(newUsername);
    setProfileImage(localStorage.getItem(profileImageKey(newUsername)));
  };

  const handleLogout = useCallback(() => {
    ['token', 'username'].forEach((k) => localStorage.removeItem(k));
    setToken(null);
    setUsername(null);
    setTransactions([]);
    setEditItem(null);
    setPrediction(null);
    setProfileImage(null);
  }, []);

  // ── Transactions
  const fetchTransactions = useCallback(async (tkn) => {
    if (!tkn) return;
    try {
      const res  = await fetch(`${API_URL}/transactions`, {
        headers: { Authorization: `Bearer ${tkn}` },
      });
      if (res.status === 401) { handleLogout(); return; }
      const data = await res.json();
      if (Array.isArray(data.data)) setTransactions(sortTransactions(data.data));
    } catch {
      toast.error('Gagal memuat data transaksi.');
    }
  }, [handleLogout]);

  // Load data setiap kali token berubah (login biasa / Google / refresh halaman)
  useEffect(() => {
    if (token) fetchTransactions(token);
  }, [token, fetchTransactions]);

  // Return true jika berhasil, agar form tahu kapan harus di-reset
  const handleFormSubmit = async (formData) => {
    const url    = editItem ? `${API_URL}/transactions/${editItem.ID}` : `${API_URL}/transactions`;
    const method = editItem ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...formData, amount: parseInt(formData.amount, 10) }),
      });
      if (res.status === 401) { handleLogout(); return false; }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Gagal menyimpan transaksi.');
        return false;
      }
      toast.success(editItem ? 'Transaksi diperbarui!' : 'Transaksi ditambahkan!');
      await fetchTransactions(token);
      setEditItem(null);
      setPrediction(null);
      return true;
    } catch {
      toast.error('Gagal menghubungi server.');
      return false;
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_URL}/transactions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { handleLogout(); return; }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Gagal menghapus transaksi.');
        return;
      }
      toast.success('Transaksi dihapus.');
      if (editItem?.ID === id) setEditItem(null);
      fetchTransactions(token);
      setPrediction(null);
    } catch {
      toast.error('Gagal menghubungi server.');
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

      // Data belum cukup / kosong: backend tetap 200 tapi tanpa prediksi bermakna
      if (data.status !== 'success') {
        setPrediction({
          prediction: data.prediction || 0,
          status:     'Data Belum Cukup ⏳',
          message:    data.message || 'Tambahkan lebih banyak transaksi pengeluaran.',
        });
        return;
      }

      const trend = data.trend || 'flat';
      const icon  = trend === 'naik' ? '📈' : trend === 'turun' ? '📉' : '➖';
      setPrediction({
        prediction: data.prediction,
        status:     `Tren ${trend.charAt(0).toUpperCase() + trend.slice(1)} ${icon}`,
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
              {isDark
                ? <Sun  size={15} className="text-amber-400" />
                : <Moon size={15} className="text-slate-500" />}
            </button>
          </header>
        )}

        {/* ── Page content ── */}
        <main className={`flex-grow ${token ? 'p-6 lg:p-8' : ''}`}>
          <Routes>
            {/* ── Halaman publik (bisa diakses tanpa login) ── */}
            <Route path="/forgot-password" element={<ForgotPassword darkMode={isDark} setDarkMode={setDarkMode} />} />
            <Route path="/reset-password"  element={<ResetPassword darkMode={isDark} setDarkMode={setDarkMode} />} />
            <Route path="/terms"   element={<TermsPage darkMode={isDark} />} />
            <Route path="/privacy" element={<PrivacyPage darkMode={isDark} />} />
            <Route path="/refund"  element={<RefundPage darkMode={isDark} />} />
            <Route path="/contact" element={<ContactPage darkMode={isDark} />} />

            {/* ── Dashboard / login ── */}
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
                        {transactions.length > 0 ? (
                          transactions.slice(0, 10).map((t) => {
                            const d    = parseTxDate(t);
                            const date = d
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
                                  {isIn ? '+' : '-'} {formatRp(Number(t.amount || 0))}
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
                        key={editItem?.ID ?? 'new'}
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

                {/* Laporan */}
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

                {/* Pengaturan */}
                <Route
                  path="/settings"
                  element={<SettingsPage transactions={transactions} />}
                />

                {/* Target Tabungan */}
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
