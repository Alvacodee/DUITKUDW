import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';

// --- IMPORTS KOMPONEN ---
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import AuthForm from './components/AuthForm';

// Halaman & Fitur
import DashboardStats from './pages/DashboardStats';
import TransactionList from './pages/TransactionList';
import ProfilePage from './pages/ProfilePage';
import TransactionForm from './components/TransactionForm';
import PredictionCard from './components/PredictionCard';
import CategoryBudgets from './components/CategoryBudget'; 
import ExpenseChart from './components/ExpenseChart';
import TrendChart from './components/TrendChart';
import AIExplainer from './components/AIExplainer';

// Halaman Tambahan (Legal & Contact)
import { TermsPage, PrivacyPage, RefundPage } from './pages/LegalPage';
import ContactPage from './pages/ContactPage';

// Halaman Password
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// IMPORT KONFIGURASI API
import { API_URL } from './config';
import { profileImageKey } from './utils/storage';
import { parseTxDate } from './utils/date';

// Login Google: backend redirect ke "/?token=...&username=...".
// Simpan ke localStorage lalu bersihkan URL. Aman dipanggil berkali-kali (idempotent).
const consumeAuthFromUrl = () => {
  const queryParams = new URLSearchParams(window.location.search);
  const tokenFromUrl = queryParams.get('token');
  if (tokenFromUrl) {
    localStorage.setItem('token', tokenFromUrl);
    localStorage.setItem('username', queryParams.get('username') || 'User');
    window.history.replaceState({}, document.title, window.location.pathname);
  }
};

// Urutkan transaksi: tanggal terbaru dulu, lalu yang terakhir diinput
const sortTransactions = (list) =>
  [...list].sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.ID - a.ID);

function App() {
  // --- 1. STATE MANAGEMENT ---
  const [token, setToken] = useState(() => { consumeAuthFromUrl(); return localStorage.getItem('token'); });
  const [username, setUsername] = useState(() => localStorage.getItem('username'));

  // Data
  const [transactions, setTransactions] = useState([]);
  const [editItem, setEditItem] = useState(null);
  
  // UI
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileImage, setProfileImage] = useState(() => localStorage.getItem(profileImageKey(localStorage.getItem('username'))));

  // AI
  const [prediction, setPrediction] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

  // Helper Lokasi
  const location = useLocation();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard Overview';
      case '/transactions': return 'Manajemen Transaksi';
      case '/budget': return 'Perencanaan Anggaran';
      case '/forecast': return 'AI Financial Forecast';
      case '/profile': return 'Profil Pengguna';
      case '/contact': return 'Hubungi Support';
      case '/terms': return 'Syarat Layanan';
      case '/privacy': return 'Kebijakan Privasi';
      case '/refund': return 'Kebijakan Refund';
      case '/forgot-password': return 'Lupa Password';
      case '/reset-password': return 'Reset Password';
      default: return 'Finance AI';
    }
  };

  // --- 2. EFFECTS ---

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // --- 3. AUTHENTICATION & API ---

  const handleLogin = (newToken, newUsername) => {
    setToken(newToken);
    setUsername(newUsername);
    setProfileImage(localStorage.getItem(profileImageKey(newUsername)));
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setToken(null);
    setUsername(null);
    setTransactions([]);
    setEditItem(null);
    setPrediction(null);
    setProfileImage(null);
  }, []);

  const fetchTransactions = useCallback(async (tkn) => {
    if (!tkn) return;
    try {
      const res = await fetch(`${API_URL}/transactions`, {
        headers: { 'Authorization': `Bearer ${tkn}` }
      });
      if (res.status === 401) { handleLogout(); return; }
      const data = await res.json();
      if (Array.isArray(data.data)) setTransactions(sortTransactions(data.data));
    } catch (e) { console.error(e); }
  }, [handleLogout]);

  // Load data setiap kali token berubah (login biasa / Google / refresh halaman)
  useEffect(() => {
    if (token) fetchTransactions(token);
  }, [token, fetchTransactions]);

  // Return true jika berhasil, agar form tahu kapan harus di-reset
  const handleFormSubmit = async (formData) => {
    const url = editItem ? `${API_URL}/transactions/${editItem.ID}` : `${API_URL}/transactions`;
    const method = editItem ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...formData, amount: parseInt(formData.amount, 10) })
      });
      if (res.status === 401) { handleLogout(); return false; }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Gagal menyimpan transaksi.');
        return false;
      }
      await fetchTransactions(token);
      setEditItem(null);
      setPrediction(null);
      return true;
    } catch (e) {
      console.error(e);
      alert('Gagal menghubungi server.');
      return false;
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_URL}/transactions/${id}`, { 
        method: 'DELETE', 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (res.status === 401) { handleLogout(); return; }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Gagal menghapus transaksi.');
        return;
      }
      if (editItem?.ID === id) setEditItem(null);
      fetchTransactions(token);
      setPrediction(null);
    } catch (e) { console.error(e); alert('Gagal menghubungi server.'); }
  };

  // --- 4. LOGIKA AI ---
  const handlePredict = async () => {
    setLoadingAI(true);
    setPrediction(null); 

    try {
      const res = await fetch(`${API_URL}/predict`, {
        method: 'GET',
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
      });

      if (res.status === 401) { handleLogout(); return; }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengambil prediksi");

      // Data belum cukup / kosong: backend tetap 200 tapi tanpa prediksi bermakna
      if (data.status !== 'success') {
        setPrediction({
          prediction: data.prediction || 0,
          status: 'Data Belum Cukup ⏳',
          message: data.message || 'Tambahkan lebih banyak transaksi pengeluaran.'
        });
        return;
      }

      const trend = data.trend || 'flat';
      const trendIcon = trend === 'naik' ? '📈' : trend === 'turun' ? '📉' : '➖';

      setPrediction({
        prediction: data.prediction,
        status: `Tren ${trend.charAt(0).toUpperCase() + trend.slice(1)} ${trendIcon}`,
        message: data.message
      });

    } catch (e) {
      console.error("AI API Error:", e);
      setPrediction({ 
        prediction: 0, 
        status: "Error Sistem", 
        message: "Maaf, server AI sedang tidak dapat dihubungi." 
      });
    } finally {
      setLoadingAI(false);
    }
  };

  // --- 5. SMART TIPS LOGIC ---
  const generateSmartTip = () => {
    const expenses = transactions.filter(t => t.type === 'Pengeluaran');
    if (expenses.length === 0) return { title: "Mulai Mencatat", text: "Belum ada pengeluaran. Yuk mulai catat!" };

    const grouped = expenses.reduce((acc, curr) => {
      const cat = curr.category || 'Lainnya';
      acc[cat] = (acc[cat] || 0) + curr.amount;
      return acc;
    }, {});

    let maxCat = '', maxAmount = 0;
    for (const [cat, amount] of Object.entries(grouped)) {
      if (amount > maxAmount) { maxAmount = amount; maxCat = cat; }
    }

    const fmt = "Rp " + maxAmount.toLocaleString('id-ID');
    if (maxCat === 'Makan') return { title: "Kurangi Jajan Luar 🍔", text: `Pengeluaran terbesarmu Makanan (${fmt}). Coba masak sendiri!` };
    if (maxCat === 'Transport') return { title: "Hemat Transport 🛵", text: `Biaya transport tinggi (${fmt}). Coba kendaraan umum?` };
    if (maxCat === 'Belanja') return { title: "Tahan Keinginan 🛍️", text: `Belanja habis ${fmt}. Kurangi impulse buying ya!` };
    return { title: `Waspada ${maxCat} ⚠️`, text: `Kategori ${maxCat} mendominasi (${fmt}). Evaluasi lagi.` };
  };
  const smartTip = generateSmartTip();


  // --- 6. RENDER (LOGIC DIPERBAIKI) ---
  
  return (
    <div className={`flex min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* LOGIC SIDEBAR: 
        Hanya tampil jika token ada.
      */}
      {token && (
        <Sidebar 
          user={username} 
          onLogout={handleLogout} 
          darkMode={darkMode} 
          isOpen={sidebarOpen} 
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          profileImage={profileImage} 
        />
      )}

      {/* LOGIC WRAPPER UTAMA:
        - Jika token ada (Login): Pakai margin (ml-64/ml-20) untuk memberi ruang Sidebar.
        - Jika token tidak ada (Public): Tidak pakai margin (kosong), biar form login di tengah.
      */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${token ? (sidebarOpen ? 'ml-64' : 'ml-20') : ''}`}>
        
        {/* HEADER: Hanya tampil jika login */}
        {token && (
          <header className={`px-6 py-4 flex justify-between items-center sticky top-0 z-40 backdrop-blur-sm ${darkMode ? 'bg-slate-900/90 border-b border-slate-800' : 'bg-slate-50/90 border-b border-slate-200'}`}>
            <h1 className="text-xl font-bold animate-fade-in">{getPageTitle()}</h1>
            
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-full transition-all duration-300 ${
                darkMode 
                  ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' 
                  : 'bg-white text-slate-400 hover:text-yellow-500 hover:bg-slate-100 shadow-sm'
              }`}
            >
              {darkMode ? <Sun size={24} /> : <Moon size={24} />}
            </button>
          </header>
        )}

        {/* MAIN CONTENT */}
        <main className={`flex-grow ${token ? 'p-8' : ''}`}>
          <Routes>
            
            {/* --- HALAMAN PUBLIC (Bisa diakses tanpa login) --- */}
            <Route path="/forgot-password" element={<ForgotPassword darkMode={darkMode} setDarkMode={setDarkMode} />} />
            <Route path="/reset-password" element={<ResetPassword darkMode={darkMode} setDarkMode={setDarkMode} />} />
            <Route path="/terms" element={<TermsPage darkMode={darkMode} />} />
            <Route path="/privacy" element={<PrivacyPage darkMode={darkMode} />} />
            <Route path="/refund" element={<RefundPage darkMode={darkMode} />} />
            <Route path="/contact" element={<ContactPage darkMode={darkMode} />} />

            {/* --- ROUTE UTAMA (GATEKEEPER) --- */}
            {/* Jika ada Token -> Dashboard. Jika Tidak -> Form Login */}
            <Route path="/" element={
              token ? (
                // DASHBOARD CONTENT
                <div className="animate-fade-in space-y-8">
                  <DashboardStats transactions={transactions} darkMode={darkMode} />
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     <TrendChart transactions={transactions} darkMode={darkMode} mode="daily" />
                     <TrendChart transactions={transactions} darkMode={darkMode} mode="monthly" />
                  </div>

                  <div className={`p-6 rounded-xl shadow-lg border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-lg"> 10 Transaksi Terakhir</h3>
                      <Link to="/transactions" className="text-blue-500 hover:underline text-sm">Lihat Semua →</Link>
                    </div>
                    <div className="space-y-3">
                      {transactions.slice(0, 10).map((t) => {
                          const dateObj = parseTxDate(t);
                          const displayDate = dateObj
                            ? dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                            : '-';
                          const isIncome = t.type === 'Pemasukan';
                          return (
                            <div key={t.ID} className={`flex justify-between items-center p-3 rounded-lg border ${darkMode ? 'border-slate-700 bg-slate-900/50' : 'border-slate-100 bg-slate-50'}`}>
                              <div>
                                <p className="font-bold text-sm">{t.description}</p>
                                <p className="text-xs opacity-70">{t.category} • {displayDate}</p>
                              </div>
                              <span className={`font-bold text-sm ${isIncome ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {isIncome ? '+' : '-'} Rp {Number(t.amount || 0).toLocaleString('id-ID')}
                              </span>
                            </div>
                          );
                      })}
                      {transactions.length === 0 && <p className="text-center text-slate-400 text-sm py-4">Belum ada transaksi.</p>}
                    </div>
                  </div>
                </div>
              ) : (
                // AUTH FORM
                <AuthForm onLogin={handleLogin} darkMode={darkMode} setDarkMode={setDarkMode} />
              )
            } />

            {/* --- PROTECTED ROUTES (Hanya jika login) --- */}
            {token && (
              <>
                <Route path="/transactions" element={
                  <div className="animate-fade-in space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                       <ExpenseChart transactions={transactions} darkMode={darkMode} />
                       <div className={`p-6 rounded-xl shadow-lg border flex flex-col justify-center items-center text-center ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                          <div className="bg-yellow-100 p-4 rounded-full mb-4 dark:bg-yellow-900/30"><span className="text-4xl">💡</span></div>
                          <h3 className={`font-bold text-xl mb-2 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{smartTip.title}</h3>
                          <p className={`text-sm leading-relaxed max-w-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{smartTip.text}</p>
                       </div>
                    </div>
                    <div className="w-full">
                      <TransactionForm key={editItem?.ID ?? 'new'} onSubmit={handleFormSubmit} initialData={editItem} isEditMode={!!editItem} onCancel={() => setEditItem(null)} darkMode={darkMode} />
                    </div>
                    <div className="w-full">
                       <TransactionList transactions={transactions} onEdit={setEditItem} onDelete={handleDelete} editId={editItem?.ID} darkMode={darkMode} />
                    </div>
                  </div>
                } />

                <Route path="/budget" element={
                  <div className="animate-fade-in max-w-5xl mx-auto">
                    <div className="mb-6"><h2 className="text-2xl font-bold mb-2">Perencanaan Anggaran</h2><p className="opacity-70">Atur batas pengeluaranmu.</p></div>
                    <CategoryBudgets transactions={transactions} darkMode={darkMode} />
                  </div>
                } />

                <Route path="/forecast" element={
                  <div className="animate-fade-in max-w-2xl mx-auto pb-10 pt-4">
                     <div className="mb-8 text-center"><h2 className="text-2xl font-bold mb-2">AI Financial Consultant</h2><p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Proyeksi cerdas pengeluaran bulananmu.</p></div>
                    <PredictionCard onPredict={handlePredict} prediction={prediction} loading={loadingAI} darkMode={darkMode} />
                    <h3 className="text-xl font-bold mt-12 mb-6 text-center">Frequently Asked Questions</h3>
                    <AIExplainer darkMode={darkMode} />
                  </div>
                } />

                <Route path="/profile" element={<ProfilePage user={username} profileImage={profileImage} setProfileImage={setProfileImage} darkMode={darkMode} />} />
              </>
            )}

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        {token && <Footer darkMode={darkMode} />}
      </div>
    </div>
  );
}

export default App;