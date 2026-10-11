import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User, Mail, Lock, Eye, EyeOff, Sun, Moon,
  AlertCircle, CheckCircle2, Wallet,
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { API_URL } from '../config';
import { apiRequest } from '../api/client';
import { useTheme } from '../theme/useTheme';
import { PASSWORD_RULES, validatePassword } from '../lib/passwordPolicy';

const EMPTY_FORM = { username: '', email: '', password: '' };


export default function AuthForm({ onLogin }) {
  const [isLogin, setIsLogin]         = useState(true);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData]       = useState(EMPTY_FORM);
  const { isDark: darkMode, toggleTheme } = useTheme();

  const set = (key) => (e) => setFormData((p) => ({ ...p, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.username || !formData.password || (!isLogin && !formData.email)) {
      setError('Semua kolom harus diisi.');
      return;
    }
    if (!isLogin) {
      const err = validatePassword(formData.password);
      if (err) { setError(err); return; }
    }
    setLoading(true);
    const payload = isLogin
      ? { username: formData.username.trim(), password: formData.password }
      : { username: formData.username.trim(), email: formData.email.trim(), password: formData.password };
    try {
      const data = await apiRequest(isLogin ? '/login' : '/register', { method: 'POST', body: payload });
      if (isLogin) {
        onLogin(data.token, data.username || formData.username.trim());
      } else {
        setSuccess(true);
        setFormData(EMPTY_FORM);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/auth/google/login`;
  };

  const switchMode = () => {
    setIsLogin((p) => !p);
    setError('');
    setFormData(EMPTY_FORM);
  };

  /* ── Success screen ────────────────────────────── */
  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-xl text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <CheckCircle2 size={32} className="text-emerald-500" />
          </div>
          <h2 className="mb-2 text-2xl font-bold">Registrasi Berhasil!</h2>
          <p className="mb-8 text-sm text-muted-foreground">
            Akun kamu sudah siap. Kami mengirim link verifikasi ke email kamu —
            verifikasi agar akun tetap aman. Kamu sudah bisa login sekarang.
          </p>
          <Button
            className="w-full"
            size="lg"
            onClick={() => { setSuccess(false); setIsLogin(true); }}
          >
            Masuk Sekarang
          </Button>
        </div>
      </div>
    );
  }

  /* ── Main form ─────────────────────────────────── */
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="absolute right-6 top-6 rounded-full border bg-card p-2.5 shadow-sm transition-colors hover:bg-accent"
        aria-label="Toggle theme"
      >
        {darkMode ? (
          <Sun size={18} className="text-amber-400" />
        ) : (
          <Moon size={18} className="text-slate-500" />
        )}
      </button>

      <div className="w-full max-w-md animate-fade-in">
        {/* Card */}
        <div className="rounded-2xl border bg-card shadow-xl">
          {/* Header */}
          <div className="border-b p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <Wallet size={22} className="text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">
              {isLogin ? 'Selamat Datang' : 'Buat Akun Baru'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isLogin
                ? 'Login untuk kelola keuanganmu'
                : 'Mulai perjalanan hematmu sekarang'}
            </p>
          </div>

          <div className="p-6 space-y-5">
            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                <AlertCircle size={16} className="mt-0.5 shrink-0 text-destructive" />
                <p className="text-sm font-medium text-destructive">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div className="space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Masukkan username"
                    value={formData.username}
                    onChange={set('username')}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Email — hanya saat register (dipakai untuk reset password) */}
              {!isLogin && (
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      id="email"
                      type="email"
                      placeholder="nama@email.com"
                      value={formData.email}
                      onChange={set('email')}
                      className="pl-9"
                    />
                  </div>
                </div>
              )}

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={set('password')}
                    className="pl-9 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {isLogin ? (
                  <div className="flex justify-end">
                    <Link
                      to="/forgot-password"
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Lupa Password?
                    </Link>
                  </div>
                ) : (
                  /* Password strength hints */
                  <ul className="mt-2 space-y-1">
                    {PASSWORD_RULES.map((r) => {
                      const ok = r.test(formData.password);
                      return (
                        <li
                          key={r.label}
                          className={`flex items-center gap-1.5 text-xs transition-colors ${
                            ok ? 'text-emerald-500' : 'text-muted-foreground'
                          }`}
                        >
                          <div
                            className={`h-1.5 w-1.5 rounded-full ${
                              ok ? 'bg-emerald-500' : 'bg-muted-foreground/40'
                            }`}
                          />
                          {r.label}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? 'Memproses...' : isLogin ? 'Masuk Sekarang' : 'Daftar Akun'}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-3 text-muted-foreground">Atau masuk dengan</span>
              </div>
            </div>

            {/* Google */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleLogin}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Sign in with Google
            </Button>

            {/* Switch mode */}
            <p className="text-center text-sm text-muted-foreground">
              {isLogin ? 'Belum punya akun? ' : 'Sudah punya akun? '}
              <button
                onClick={switchMode}
                className="font-semibold text-primary hover:underline"
              >
                {isLogin ? 'Daftar di sini' : 'Login di sini'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
