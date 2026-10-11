import { Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';

const LINKS = [
  { label: 'Syarat Layanan',          to: '/terms' },
  { label: 'Kebijakan Privasi',       to: '/privacy' },
  { label: 'Kebijakan Pengembalian',  to: '/refund' },
  { label: 'Hubungi Support',         to: '/contact' },
];

export default function Footer() {
  return (
    <footer className="w-full border-t border-border bg-background">
      <div className="flex flex-col items-center justify-between gap-3 px-6 py-4 sm:flex-row">
        {/* Brand */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary">
            <Wallet size={11} className="text-primary-foreground" />
          </div>
          <span className="text-xs font-bold">DUITKUDW</span>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            &copy; {new Date().getFullYear()}
          </span>
        </div>

        {/* Links */}
        <nav className="flex flex-wrap justify-center gap-x-4 gap-y-1">
          {LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
          <a
            href="mailto:duitkudw.official@gmail.com"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            duitkudw.official@gmail.com
          </a>
        </nav>
      </div>
    </footer>
  );
}
