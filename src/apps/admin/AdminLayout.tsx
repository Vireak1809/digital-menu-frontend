import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Grid3x3, QrCode, ClipboardList, Users, BarChart3, Settings, LogOut, Menu as MenuIcon, X,
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../../shared/store/auth.store';
import * as ep from '../../shared/api/endpoints';
import { useAlertListener } from '../admin/useAlertListener';
import clsx from 'clsx';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { to: '/admin/menu', label: 'Menu', icon: BookOpen },
  { to: '/admin/tables', label: 'Tables', icon: Grid3x3 },
  { to: '/admin/qr-codes', label: 'QR Codes', icon: QrCode },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { to: '/admin/staff', label: 'Staff', icon: Users, adminOnly: true },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout() {
  const { user, clear } = useAuthStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useAlertListener();

  const handleLogout = async () => {
    await ep.logout().catch(() => null);
    clear();
    navigate('/admin/login', { replace: true });
  };

  const items = NAV.filter((n) => !n.adminOnly || user?.role === 'ADMIN');

  const sidebar = (
    <nav className="flex h-full flex-col gap-1 p-3">
      <div className="mb-4 flex items-center gap-2 px-2 py-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-sm font-extrabold text-white">DM</div>
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold">Digital Menu</p>
          <p className="truncate text-xs text-slate-500">{user?.role}</p>
        </div>
      </div>

      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
              isActive
                ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
            )
          }
        >
          <item.icon size={18} />
          {item.label}
        </NavLink>
      ))}

      <div className="mt-auto space-y-1 pt-3">
        <Link
          to="/chef"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          🔥 Kitchen view
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
        >
          <LogOut size={18} /> Sign out
        </button>
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:block">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-white dark:bg-slate-900">
            <button onClick={() => setMobileOpen(false)} className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400" aria-label="Close menu">
              <X size={18} />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="rounded-lg p-1.5 text-slate-500" aria-label="Open menu">
            <MenuIcon size={20} />
          </button>
          <span className="font-extrabold">Digital Menu</span>
        </header>

        <main className="min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}