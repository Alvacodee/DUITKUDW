import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../theme/useTheme';
import { cn } from '../lib/utils';

// Layout halaman auth publik (lupa/reset password, verifikasi email): kartu di tengah + tombol tema.
export default function AuthCard({ icon: HeaderIcon, iconClassName, title, subtitle, children }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <button
        onClick={toggleTheme}
        className="absolute right-6 top-6 rounded-full border bg-card p-2.5 shadow-sm transition-colors hover:bg-accent"
        aria-label="Toggle theme"
      >
        {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-slate-500" />}
      </button>

      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-xl animate-fade-in">
        {(HeaderIcon || title) && (
          <div className="mb-8 text-center">
            {HeaderIcon && (
              <div className={cn('mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary', iconClassName)}>
                <HeaderIcon size={26} />
              </div>
            )}
            {title && <h2 className="mb-2 text-2xl font-bold">{title}</h2>}
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

// Kotak pesan sukses/gagal di dalam AuthCard
export function AuthMessage({ error, children }) {
  return (
    <div className={cn(
      'mb-6 rounded-lg border p-3 text-sm font-medium',
      error
        ? 'border-destructive/30 bg-destructive/10 text-destructive'
        : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
    )}>
      {children}
    </div>
  );
}
