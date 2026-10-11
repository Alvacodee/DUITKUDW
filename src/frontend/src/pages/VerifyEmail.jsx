import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import AuthCard from '../components/AuthCard';
import { Button } from '../components/ui/button';
import { apiRequest } from '../api/client';

// Token dari link email ditukar sekali; memoize per token agar effect ganda StrictMode tidak memakainya dua kali.
const pending = new Map();
const verifyToken = (token) => {
  if (!pending.has(token)) {
    pending.set(token, apiRequest('/verify-email', { method: 'POST', body: { token } }).then((d) => d.message));
  }
  return pending.get(token);
};

const VIEW = {
  loading: { icon: Loader2,      iconClassName: 'animate-spin',                          title: 'Memverifikasi email...' },
  success: { icon: CheckCircle2, iconClassName: 'bg-emerald-500/10 text-emerald-500',     title: 'Email Terverifikasi' },
  error:   { icon: AlertCircle,  iconClassName: 'bg-destructive/10 text-destructive',     title: 'Verifikasi Gagal' },
};

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [state, setState] = useState(() => (token
    ? { status: 'loading', message: '' }
    : { status: 'error', message: 'Token verifikasi tidak ditemukan.' }));

  useEffect(() => {
    if (!token) return;
    let active = true;
    verifyToken(token)
      .then((message) => active && setState({ status: 'success', message }))
      .catch((err) => active && setState({ status: 'error', message: err.message }));
    return () => { active = false; };
  }, [token]);

  const view = VIEW[state.status];
  return (
    <AuthCard icon={view.icon} iconClassName={view.iconClassName} title={view.title} subtitle={state.message}>
      {state.status !== 'loading' && (
        <Button asChild className="w-full">
          <Link to="/">Kembali ke Beranda</Link>
        </Button>
      )}
    </AuthCard>
  );
}
