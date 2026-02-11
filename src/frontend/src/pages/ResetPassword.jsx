import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Lock, CheckCircle, AlertCircle, Sun, Moon } from "lucide-react";
import { API_URL } from '../config';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  // DARK MODE
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    setError(false);

    try {
      const res = await fetch(`${API_URL}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: password }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setMsg("Password berhasil diubah! Mengalihkan ke login...");
        setTimeout(() => navigate("/"), 3000);
      } else {
        setMsg(data.error || "Gagal mereset password.");
        setError(true);
      }
    } catch (err) {
      setMsg("Terjadi kesalahan sistem.");
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // Tampilan jika token invalid (juga perlu menyesuaikan dark mode)
  if (!token) return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors ${darkMode ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-800'}`}>
       {/* Tombol Toggle juga ada di sini */}
       <button 
        onClick={() => setDarkMode(!darkMode)}
        className={`absolute top-6 right-6 p-3 rounded-full transition-all shadow-lg ${darkMode ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-white text-slate-400 hover:text-yellow-500 hover:bg-slate-100 shadow-sm'}`}
      >
        {darkMode ? <Sun size={24} /> : <Moon size={24} />}
      </button>
      <div className="text-center">
         <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
         <h2 className="text-2xl font-bold mb-2">Link Tidak Valid</h2>
         <p className="opacity-70 mb-6">Token reset password hilang atau rusak.</p>
         <Link to="/" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Kembali ke Home</Link>
      </div>
    </div>
  );

  // Tampilan Utama
  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
      
      {/* --- TOMBOL TOGGLE THEME (BARU) --- */}
      <button 
        onClick={() => setDarkMode(!darkMode)}
        className={`absolute top-6 right-6 p-3 rounded-full transition-all shadow-lg ${darkMode ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-white text-slate-400 hover:text-yellow-500 hover:bg-slate-100 shadow-sm'}`}
      >
        {darkMode ? <Sun size={24} /> : <Moon size={24} />}
      </button>
      {/* -------------------------------- */}

      <div className={`w-full max-w-md p-8 rounded-2xl shadow-2xl transition-all ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white'}`}>
        
        <div className="text-center mb-8">
           <div className="flex justify-center mb-4">
            <div className={`p-4 rounded-full ${darkMode ? 'bg-slate-700 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
              <Lock size={32} />
            </div>
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>Password Baru</h2>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Buat password baru yang aman untuk akunmu.
          </p>
        </div>
        
        {msg && (
          <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 text-sm font-medium ${
            error 
              ? (darkMode ? 'bg-red-900/30 text-red-300 border border-red-800' : 'bg-red-50 text-red-600 border border-red-100')
              : (darkMode ? 'bg-green-900/30 text-green-300 border border-green-800' : 'bg-green-50 text-green-600 border border-green-100')
          }`}>
             {error ? <AlertCircle size={18} className="shrink-0 mt-0.5" /> : <CheckCircle size={18} className="shrink-0 mt-0.5" />}
             <p>{msg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
             <label className={`block text-sm font-bold mb-2 ml-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Password Baru</label>
             <input
                type="password"
                placeholder="Minimal 8 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className={`w-full px-4 py-3 rounded-xl outline-none border transition focus:ring-2 focus:ring-emerald-500 ${
                  darkMode 
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                }`}
              />
          </div>
          
          <button 
             disabled={loading}
             className={`w-full py-3.5 rounded-xl font-bold text-white transition transform active:scale-95 shadow-lg shadow-emerald-500/30 ${
              loading ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {loading ? "Menyimpan..." : "Simpan Password"}
          </button>
        </form>
        
        <div className="mt-8 text-center">
            <Link to="/" className={`text-sm font-medium transition-colors ${darkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}>
              Batal
            </Link>
        </div>
      </div>
    </div>
  );
}