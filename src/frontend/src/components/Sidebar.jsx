import { Link, useLocation } from 'react-router-dom';
import {
  Home, ArrowLeftRight, Target, Crosshair,
  BarChart3, BrainCircuit, CircleUser, Settings2,
  LogOut, Menu, Wallet,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';

const NAV_SECTIONS = [
  {
    label: 'Menu',
    items: [
      { label: 'Dashboard',  path: '/',             icon: Home },
      { label: 'Transaksi',  path: '/transactions', icon: ArrowLeftRight },
      { label: 'Anggaran',   path: '/budget',       icon: Target },
      { label: 'Target',     path: '/goals',        icon: Crosshair },
    ],
  },
  {
    label: 'Insight',
    items: [
      { label: 'Laporan',     path: '/report',   icon: BarChart3 },
      { label: 'AI Forecast', path: '/forecast', icon: BrainCircuit },
    ],
  },
  {
    label: 'Akun',
    items: [
      { label: 'Profil',      path: '/profile',  icon: CircleUser },
      { label: 'Pengaturan',  path: '/settings', icon: Settings2 },
    ],
  },
];

function NavItem({ item, isActive, isOpen }) {
  const Icon = item.icon;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          to={item.path}
          className={cn(
            'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
            isActive
              ? 'bg-primary/15 text-primary'
              : 'text-white/50 hover:bg-white/6 hover:text-white/85',
            !isOpen && 'justify-center px-2'
          )}
        >
          <Icon
            size={17}
            strokeWidth={isActive ? 2.2 : 1.8}
            className={cn(
              'shrink-0 transition-colors',
              isActive ? 'text-primary' : 'group-hover:text-white/85'
            )}
          />
          <span
            className={cn(
              'truncate text-sm transition-all duration-200',
              isOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'
            )}
          >
            {item.label}
          </span>
          {isActive && isOpen && (
            <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          )}
        </Link>
      </TooltipTrigger>
      {!isOpen && (
        <TooltipContent side="right">{item.label}</TooltipContent>
      )}
    </Tooltip>
  );
}

export default function Sidebar({ user, onLogout, isOpen, toggleSidebar, profileImage }) {
  const { pathname } = useLocation();

  return (
    <TooltipProvider delayDuration={0}>
      {/* ── Sidebar — fixed, full viewport height ── */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300',
          isOpen ? 'w-56' : 'w-[60px]'
        )}
      >
        {/* Brand — h-14 matches main header */}
        <div
          className={cn(
            'flex h-14 shrink-0 items-center gap-3 border-b border-white/8 px-3',
            !isOpen && 'justify-center'
          )}
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary">
            <Wallet size={14} strokeWidth={2.2} className="text-primary-foreground" />
          </div>
          {isOpen && (
            <>
              <span className="font-bold tracking-tight text-sm text-white">DUITKUDW</span>
              <button
                onClick={toggleSidebar}
                className="ml-auto rounded-md p-1 text-white/40 hover:bg-white/8 hover:text-white/80 transition-colors"
                aria-label="Collapse sidebar"
              >
                <Menu size={15} />
              </button>
            </>
          )}
          {!isOpen && (
            <button
              onClick={toggleSidebar}
              className="text-white/40 hover:text-white/80 transition-colors"
              aria-label="Expand sidebar"
            >
              <Menu size={15} />
            </button>
          )}
        </div>

        {/* User */}
        <div className={cn('shrink-0 p-2.5', !isOpen && 'flex justify-center')}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to="/profile"
                className={cn(
                  'flex items-center gap-2.5 rounded-lg p-1.5 transition-colors hover:bg-white/6',
                  !isOpen && 'justify-center'
                )}
              >
                <Avatar className="h-7 w-7 shrink-0 ring-2 ring-primary/30">
                  <AvatarImage src={profileImage} alt={user} />
                  <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                    {user ? user.charAt(0).toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
                {isOpen && (
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-white/90 leading-none">{user || 'User'}</p>
                    <p className="text-[10px] text-white/40 mt-0.5">Mahasiswa</p>
                  </div>
                )}
              </Link>
            </TooltipTrigger>
            {!isOpen && <TooltipContent side="right">{user || 'User'}</TooltipContent>}
          </Tooltip>
        </div>

        {/* Navigation — flex-1 fills remaining space */}
        <nav className="flex-1 overflow-y-auto px-2 py-1 space-y-3">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              {isOpen ? (
                <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/25">
                  {section.label}
                </p>
              ) : (
                <div className="mx-auto my-1 h-px w-5 bg-white/10" />
              )}
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <li key={item.path}>
                    <NavItem item={item} isActive={pathname === item.path} isOpen={isOpen} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Logout — pinned to bottom */}
        <div className="shrink-0 border-t border-white/8 p-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onLogout}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/40 transition-all hover:bg-rose-500/10 hover:text-rose-400',
                  !isOpen && 'justify-center px-2'
                )}
              >
                <LogOut size={17} strokeWidth={1.8} className="shrink-0" />
                {isOpen && (
                  <span className="truncate">Keluar</span>
                )}
              </button>
            </TooltipTrigger>
            {!isOpen && <TooltipContent side="right">Keluar</TooltipContent>}
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}
