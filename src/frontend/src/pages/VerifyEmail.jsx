import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { API_URL } from '../config';

// Token dari link email ditukar sekali; memoize per token agar effect ganda StrictMode tidak memakai token dua kali.
const pending = new Map();
const verifyToken = (token) => {
  if (!pending.has(token)) {
    pending.set(token, fetch(`${API_URL}/verify-email`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ token }),
    }).then(async (res) => {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Verifikasi gagal.');
      return data.message;
    }));
  }
  return pending.get(token);
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
      .catch((err) => active && setState({
        status:  'error',
        message: err instanceof TypeError ? 'Gagal menghubungi server.' : err.message,
      }));
    return () => { active = false; };
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-xl animate-fade-in">
        {state.status === 'loading' && (
          <>
            <Loader2 size={40} className="mx-auto mb-4 animate-spin text-primary" />
            <h2 className="text-xl font-bold">Memverifikasi email...</h2>
          </>
        )}
        {state.status === 'success' && (
          <>
            <CheckCircle2 size={44} className="mx-auto mb-4 text-emerald-500" />
            <h2 className="mb-2 text-2xl font-bold">Email Terverifikasi</h2>
            <p className="mb-6 text-sm text-muted-foreground">{state.message}</p>
          </>
        )}
        {state.status === 'error' && (
          <>
            <AlertCircle size={44} className="mx-auto mb-4 text-destructive" />
            <h2 className="mb-2 text-2xl font-bold">Verifikasi Gagal</h2>
            <p className="mb-6 text-sm text-muted-foreground">{state.message}</p>
          </>
        )}
        {state.status !== 'loading' && (
          <Button asChild className="w-full">
            <Link to="/">Kembali ke Beranda</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
