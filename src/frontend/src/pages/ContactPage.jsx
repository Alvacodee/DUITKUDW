import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

// ID form Formspree (publik; pesan dikirim ke email pengembang)
const FORMSPREE_ID = 'xvzbokrq';

const textareaClass =
  'flex min-h-[100px] w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export default function ContactPage() {
  const [state, setState] = useState({ submitting: false, succeeded: false, error: null });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    setState({ submitting: true, succeeded: false, error: null });

    try {
      const response = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method:  'POST',
        body:    new FormData(form),
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Gagal mengirim pesan.');
      }
      setState({ submitting: false, succeeded: true, error: null });
      form.reset();
    } catch (err) {
      setState({
        submitting: false,
        succeeded:  false,
        error:      err instanceof TypeError ? 'Gagal menghubungi server.' : err.message,
      });
    }
  };

  return (
    <div className="flex items-center justify-center px-4 py-10 sm:px-6 animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl border bg-card p-8 shadow-lg">
        <Link to="/" className="mb-6 inline-block text-sm font-medium text-primary hover:underline">← Kembali</Link>

        <h1 className="mb-2 text-3xl font-bold">Hubungi Support</h1>
        <p className="mb-8 text-sm text-muted-foreground">Punya pertanyaan atau masukan? Kirim pesan kepada kami.</p>

        {state.succeeded ? (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-center text-emerald-600 dark:text-emerald-400 animate-fade-in">
            <CheckCircle2 size={36} className="mx-auto mb-2" />
            <h3 className="text-lg font-bold">Pesan Terkirim!</h3>
            <p className="mt-1 text-sm">Silakan cek email Anda dalam 1x24 jam untuk balasan dari tim kami.</p>
            <button
              onClick={() => setState({ submitting: false, succeeded: false, error: null })}
              className="mt-4 text-sm underline"
            >
              Kirim pesan lagi
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {state.error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-center text-sm text-destructive">
                {state.error}
              </div>
            )}

            {/* Atribut name wajib ada untuk Formspree */}
            <div className="space-y-1.5">
              <Label htmlFor="contact-name">Nama Lengkap</Label>
              <Input id="contact-name" type="text" name="name" required placeholder="Masukkan nama Anda" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-email">Email</Label>
              <Input id="contact-email" type="email" name="email" required placeholder="email@contoh.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-message">Pesan</Label>
              <textarea id="contact-message" name="message" required rows={4} className={textareaClass} placeholder="Tulis pesan Anda di sini..." />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={state.submitting}>
              {state.submitting ? 'Mengirim...' : 'Kirim Pesan'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
