import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import AuthCard, { AuthMessage } from '../components/AuthCard';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { apiRequest } from '../api/client';

export default function ForgotPassword() {
  const [email, setEmail]     = useState('');
  const [result, setResult]   = useState(null); // { error: bool, message: string }
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const data = await apiRequest('/forgot-password', { method: 'POST', body: { email: email.trim() } });
      setResult({ error: false, message: data.message });
    } catch (err) {
      setResult({ error: true, message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      icon={Mail}
      title="Lupa Password?"
      subtitle="Masukkan email yang terdaftar, kami akan mengirimkan link untuk reset password."
    >
      {result && <AuthMessage error={result.error}>{result.message}</AuthMessage>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="forgot-email">Email</Label>
          <Input
            id="forgot-email"
            type="email"
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? 'Mengirim...' : 'Kirim Link Reset'}
        </Button>
      </form>

      <div className="mt-8 text-center">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft size={16} /> Kembali ke Login
        </Link>
      </div>
    </AuthCard>
  );
}
