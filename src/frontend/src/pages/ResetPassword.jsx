import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Lock, AlertCircle } from 'lucide-react';
import AuthCard, { AuthMessage } from '../components/AuthCard';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { apiRequest } from '../api/client';
import { PASSWORD_RULES, validatePassword } from '../lib/passwordPolicy';
import { cn } from '../lib/utils';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token    = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [result, setResult]     = useState(null); // { error: bool, message: string }
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const invalid = validatePassword(password);
    if (invalid) {
      setResult({ error: true, message: `Password belum memenuhi aturan: ${invalid}` });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      await apiRequest('/reset-password', { method: 'POST', body: { token, new_password: password } });
      setResult({ error: false, message: 'Password berhasil diubah! Mengalihkan ke login...' });
      setTimeout(() => navigate('/'), 3000);
    } catch (err) {
      setResult({ error: true, message: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthCard icon={AlertCircle} iconClassName="bg-destructive/10 text-destructive" title="Link Tidak Valid" subtitle="Token reset password hilang atau rusak.">
        <Button asChild className="w-full">
          <Link to="/">Kembali ke Beranda</Link>
        </Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard icon={Lock} title="Password Baru" subtitle="Buat password baru yang aman untuk akunmu.">
      {result && <AuthMessage error={result.error}>{result.message}</AuthMessage>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="new-password">Password Baru</Label>
          <Input
            id="new-password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <ul className="mt-2 space-y-1">
            {PASSWORD_RULES.map((r) => {
              const ok = r.test(password);
              return (
                <li key={r.label} className={cn('flex items-center gap-1.5 text-xs', ok ? 'text-emerald-500' : 'text-muted-foreground')}>
                  <span className={cn('h-1.5 w-1.5 rounded-full', ok ? 'bg-emerald-500' : 'bg-muted-foreground/40')} />
                  {r.label}
                </li>
              );
            })}
          </ul>
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? 'Menyimpan...' : 'Simpan Password'}
        </Button>
      </form>

      <div className="mt-8 text-center">
        <Link to="/" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          Batal
        </Link>
      </div>
    </AuthCard>
  );
}
