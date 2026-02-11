import { useState, useEffect } from 'react';
import { User, Lock, Eye, EyeOff, Sun, Moon, CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_URL } from '../config';

export default function AuthForm({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // State Form
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  // State Dark Mode
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  // Efek ganti body background saat dark mode berubah
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // VALIDASI PASSWORD
  const validatePassword = (pwd) => {
    if (pwd.length < 8) return "Password minimal 8 karakter.";
    if (!/[A-Z]/.test(pwd)) return "Harus ada huruf BESAR.";
    if (!/[a-z]/.test(pwd)) return "Harus ada huruf kecil.";
    if (!/[0-9]/.test(pwd)) return "Harus ada angka.";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) return "Harus ada karakter unik (!@#$%).";
    return null; 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.username || !formData.password) {
      setError("Semua kolom harus diisi!");
      setLoading(false);
      return;
    }

    if (!isLogin) {
      const pwdError = validatePassword(formData.password);
      if (pwdError) {
        setError(pwdError);
        setLoading(false);
        return;
      }
    }

    const endpoint = isLogin ? `${API_URL}/login` : `${API_URL}/register`;
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Terjadi kesalahan');
      }

      if (isLogin) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', formData.username);
        onLogin(data.token);
      } else {
        setSuccess(true);
        setFormData({ username: '', password: '' }); 
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // HANDLER LOGIN GOOGLE
  const handleGoogleLogin = () => {
    // Redirect user ke Backend Go endpoint
    window.location.href = `${API_URL}/auth/google/login`;
  };

  // TAMPILAN: SUKSES REGISTRASI
  if (success) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
        <div className={`w-full max-w-md p-8 rounded-2xl shadow-2xl text-center ${darkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-800'}`}>
          <div className="flex justify-center mb-6">
            <CheckCircle size={80} className="text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Registrasi Berhasil!</h2>
          <p className={`mb-8 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Akunmu sudah siap. Silakan login manual atau gunakan Google.
          </p>
          <button
            onClick={() => { setSuccess(false); setIsLogin(true); }}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition shadow-lg shadow-blue-500/30"
          >
            Masuk Sekarang
          </button>
        </div>
      </div>
    );
  }

  // TAMPILAN: FORM LOGIN / REGISTER
  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${darkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
      
      <button 
        onClick={() => setDarkMode(!darkMode)}
        className={`absolute top-6 right-6 p-3 rounded-full transition-all shadow-lg ${darkMode ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-white text-slate-400 hover:text-yellow-500 hover:bg-slate-100'}`}
      >
        {darkMode ? <Sun size={24} /> : <Moon size={24} />}
      </button>

      <div className={`w-full max-w-md p-8 rounded-3xl shadow-2xl transition-all ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-100'}`}>
        
        <div className="text-center mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
            {isLogin ? 'Selamat Datang' : 'Buat Akun Baru'}
          </h1>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {isLogin ? 'Login untuk kelola keuanganmu' : 'Mulai perjalanan hematmu sekarang'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-3">
            <AlertCircle size={20} className="text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-600 dark:text-red-300 font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={`block text-sm font-bold mb-2 ml-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={20} className="text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Masukkan username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className={`w-full pl-10 pr-4 py-3 rounded-xl outline-none border transition focus:ring-2 focus:ring-blue-500 ${
                  darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                }`}
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-bold mb-2 ml-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={20} className="text-slate-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`w-full pl-10 pr-10 py-3 rounded-xl outline-none border transition focus:ring-2 focus:ring-blue-500 ${
                  darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-slate-400 hover:text-blue-500 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            
            {/* LINK LUPA PASSWORD - HANYA MUNCUL SAAT MODE LOGIN */}
            {isLogin ? (
              <div className="flex justify-end mt-2">
                <Link to="/forgot-password" className="text-xs font-medium text-blue-500 hover:text-blue-600 hover:underline transition-colors">
                  Lupa Password?
                </Link>
              </div>
            ) : (
              <p className="text-xs text-slate-500 mt-2 ml-1">*Min 8 karakter, huruf besar, huruf kecil, angka, simbol.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-xl font-bold text-white transition transform active:scale-95 shadow-lg shadow-blue-500/30 ${
              loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Memproses...' : (isLogin ? 'Masuk Sekarang' : 'Daftar Akun')}
          </button>
        </form>

        {/* --- TOMBOL GOOGLE LOGIN (BARU) --- */}
        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className={`w-full border-t ${darkMode ? 'border-slate-600' : 'border-slate-300'}`}></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className={`px-4 ${darkMode ? 'bg-slate-800 text-slate-400' : 'bg-white text-slate-500'}`}>
                Atau masuk dengan
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className={`mt-6 w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border transition-all duration-200 font-medium ${
              darkMode 
                ? 'bg-slate-700 border-slate-600 text-white hover:bg-slate-600' 
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
            }`}
          >
            {/* Logo Google SVG */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>
        </div>
        {/* ---------------------------------- */}

        <div className="mt-8 text-center">
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            {isLogin ? 'Belum punya akun? ' : 'Sudah punya akun? '}
            <button 
              onClick={() => { setIsLogin(!isLogin); setError(''); setFormData({username:'', password:''}); }}
              className="text-blue-500 font-bold hover:underline transition-colors"
            >
              {isLogin ? 'Daftar di sini' : 'Login di sini'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}