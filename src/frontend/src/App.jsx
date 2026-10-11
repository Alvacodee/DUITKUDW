import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { Toaster, toast } from 'sonner';

import Sidebar  from './components/Sidebar';
import Footer   from './components/Footer';
import AuthForm from './components/AuthForm';

import DashboardPage    from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import BudgetPage       from './pages/BudgetPage';
import ForecastPage     from './pages/ForecastPage';
import ProfilePage      from './pages/ProfilePage';
import ReportPage       from './pages/ReportPage';
import SettingsPage     from './pages/SettingsPage';
import GoalsPage        from './pages/GoalsPage';
import ForgotPassword   from './pages/ForgotPassword';
import ResetPassword    from './pages/ResetPassword';
import VerifyEmail      from './pages/VerifyEmail';
import ContactPage      from './pages/ContactPage';
import { TermsPage, PrivacyPage, RefundPage } from './pages/LegalPage';

import { apiRequest } from './api/client';
import { profileImageKey } from './lib/storage';
import { useTheme } from './theme/useTheme';
import { useTransactions } from './hooks/useTransactions';
import { usePrediction } from './hooks/usePrediction';

// Login Google: backend redirect ke "/#login_code=..." (atau "#login_error=...", "#login_notice=...").
// Kode sekali pakai ini ditukar dengan JWT lewat POST, sehingga JWT tidak pernah ada di URL.
// Dibaca sekali saat modul dimuat lalu fragment dibersihkan, agar tidak diproses dua kali
// (React StrictMode menjalankan effect dua kali di development).
const readGoogleLoginResult = () => {
  const params = new URLSearchParams(window.location.hash.slice(1));
  const result = {
    code:   params.get('login_code'),
    error:  params.get('login_error'),
    notice: params.get('login_notice'),
  };
  if (result.code || result.error) {
    window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
  }
  return result;
};
const googleLogin = readGoogleLoginResult();

let googleExchange = null;
const exchangeGoogleCode = () => {
  googleExchange ??= apiRequest('/auth/google/exchange', { method: 'POST', body: { code: googleLogin.code } });
  return googleExchange;
};

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

export default function AppShell() {
  const location  = useLocation();
  const pageTitle = PAGE_TITLES[location.pathname] ?? 'DUITKUDW';

  const [token,        setToken]        = useState(() => localStorage.getItem('token'));
  const [username,     setUsername]     = useState(() => localStorage.getItem('username'));
  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const [profileImage, setProfileImage] = useState(() => localStorage.getItem(profileImageKey(localStorage.getItem('username'))));

  const { isDark, toggleTheme } = useTheme();

  // ── Auth
  const handleLogin = useCallback((newToken, newUsername) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('username', newUsername);
    setToken(newToken);
    setUsername(newUsername);
    setProfileImage(localStorage.getItem(profileImageKey(newUsername)));
  }, []);

  const handleLogout = useCallback(() => {
    ['token', 'username'].forEach((k) => localStorage.removeItem(k));
    setToken(null);
    setUsername(null);
    setProfileImage(null);
  }, []);

  // Selesaikan login Google (tukar kode sekali pakai dengan JWT)
  useEffect(() => {
    if (googleLogin.error) toast.error(googleLogin.error);
    if (googleLogin.notice) toast.warning(googleLogin.notice, { duration: 15000 });
    if (!googleLogin.code) return;
    let active = true;
    exchangeGoogleCode()
      .then((data) => active && handleLogin(data.token, data.username))
      .catch((err) => active && toast.error(err.message || 'Login Google gagal.'));
    return () => { active = false; };
  }, [handleLogin]);

  // ── Data
  const ai = usePrediction(token, { onUnauthorized: handleLogout });
  const { transactions, save, remove } = useTransactions(token, {
    onUnauthorized: handleLogout,
    onChanged:      ai.reset, // prediksi lama tidak berlaku lagi setelah data berubah
  });

  // Prediksi milik sesi sebelumnya tidak boleh terlihat setelah logout / ganti akun
  const resetPrediction = ai.reset;
  useEffect(() => { resetPrediction(); }, [token, resetPrediction]);

  const sidebarW = sidebarOpen ? 'ml-56' : 'ml-[60px]';

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-200">
      <Toaster position="top-right" richColors closeButton />

      {token && (
        <Sidebar
          user={username}
          onLogout={handleLogout}
          isOpen={sidebarOpen}
          toggleSidebar={() => setSidebarOpen((v) => !v)}
          profileImage={profileImage}
        />
      )}

      <div className={`flex flex-1 flex-col min-h-screen transition-all duration-300 ${token ? sidebarW : ''}`}>
        {token && (
          <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background/90 backdrop-blur-sm px-6">
            <h1 className="text-sm font-semibold text-foreground/80 animate-fade-in">{pageTitle}</h1>
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

        <main className={`flex-grow ${token ? 'p-6 lg:p-8' : ''}`}>
          <Routes>
            {/* ── Halaman publik (bisa diakses tanpa login) ── */}
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password"  element={<ResetPassword />} />
            <Route path="/verify-email"    element={<VerifyEmail />} />
            <Route path="/terms"           element={<TermsPage />} />
            <Route path="/privacy"         element={<PrivacyPage />} />
            <Route path="/refund"          element={<RefundPage />} />
            <Route path="/contact"         element={<ContactPage />} />

            <Route
              path="/"
              element={token ? <DashboardPage transactions={transactions} /> : <AuthForm onLogin={handleLogin} />}
            />

            {/* ── Halaman yang butuh login ── */}
            {token && (
              <>
                <Route path="/transactions" element={<TransactionsPage transactions={transactions} onSave={save} onDelete={remove} />} />
                <Route path="/budget"       element={<BudgetPage transactions={transactions} storageUser={username} />} />
                <Route path="/report"       element={<ReportPage transactions={transactions} />} />
                <Route path="/forecast"     element={<ForecastPage prediction={ai.prediction} loading={ai.loading} onPredict={ai.predict} />} />
                <Route path="/profile"      element={<ProfilePage user={username} profileImage={profileImage} setProfileImage={setProfileImage} />} />
                <Route path="/settings"     element={<SettingsPage transactions={transactions} storageUser={username} onProfileCleared={() => setProfileImage(null)} />} />
                <Route path="/goals"        element={<GoalsPage storageUser={username} />} />
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
