import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
// Tambahkan Sun dan Moon di sini
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Sun, Moon } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  
  // DARK MODE
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  // Efek untuk mengubah class di <html> dan simpan ke localStorage
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
    setMessage("");
    
    try {
      const res = await fetch(`${API_URL}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setMessage(data.message || data.error);
    } catch (err) {
      setMessage("Gagal menghubungi server. Pastikan backend nyala.");
    } finally {
      setLoading(false);
    }
  };

  // Ubah semua 'isDarkMode' menjadi 'darkMode'
  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
      
      {/* --- TOMBOL TOGGLE THEME (BARU) --- */}
      <button 
        onClick={() => setDarkMode(!darkMode)}
        className={`absolute top-6 right-6 p-3 rounded-full transition-all shadow-lg ${darkMode ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-white text-slate-400 hover:text-yellow-500 hover:bg-slate-100'}`}
      >
        {darkMode ? <Sun size={24} /> : <Moon size={24} />}
      </button>
      {/* -------------------------------- */}

      <div className={`w-full max-w-md p-8 rounded-2xl shadow-2xl transition-all ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white'}`}>
        
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className={`p-4 rounded-full ${darkMode ? 'bg-slate-700 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
              <Mail size={32} />
            </div>
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>Lupa Password?</h2>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Masukkan email yang terdaftar, kami akan mengirimkan link untuk reset password.
          </p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 text-sm font-medium ${
            message.includes("Gagal") || message.includes("error") 
              ? (darkMode ? 'bg-red-900/30 text-red-300 border border-red-800' : 'bg-red-50 text-red-600 border border-red-100')
              : (darkMode ? 'bg-green-900/30 text-green-300 border border-green-800' : 'bg-blue-50 text-blue-600 border border-blue-100')
          }`}>
             {message.includes("Gagal") ? <AlertCircle size={18} className="shrink-0 mt-0.5" /> : <CheckCircle size={18} className="shrink-0 mt-0.5" />}
             <p>{message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={`block text-sm font-bold mb-2 ml-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Email Address</label>
            <input
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={`w-full px-4 py-3 rounded-xl outline-none border transition focus:ring-2 focus:ring-blue-500 ${
                darkMode 
                  ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
              }`}
            />
          </div>

          <button
            disabled={loading}
            className={`w-full py-3.5 rounded-xl font-bold text-white transition transform active:scale-95 shadow-lg shadow-blue-500/30 ${
              loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? "Mengirim..." : "Kirim Link Reset"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link to="/" className={`inline-flex items-center gap-2 text-sm font-medium transition-colors ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}>
            <ArrowLeft size={16} /> Kembali ke Login
          </Link>
        </div>
      </div>
    </div>
  );
}