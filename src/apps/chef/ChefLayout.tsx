import { useEffect } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { LogOut, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import { useAuthStore } from '../../shared/store/auth.store';
import * as ep from '../../shared/api/endpoints';
import { useKitchenSound } from '../chef/useKitchenSound';

export default function ChefLayout() {
  const { user, clear } = useAuthStore();
  const navigate = useNavigate();
  const { enabled, toggle, notify, unlock } = useKitchenSound();

  useEffect(() => {
    const onFirstTap = () => { unlock(); window.removeEventListener('pointerdown', onFirstTap); };
    window.addEventListener('pointerdown', onFirstTap);
    return () => window.removeEventListener('pointerdown', onFirstTap);
  }, [unlock]);

  const handleLogout = async () => {
    await ep.logout().catch(() => null);
    clear();
    navigate('/chef/login', { replace: true });
  };

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-slate-100">
      <header className="flex shrink-0 items-center gap-3 border-b border-slate-800 bg-slate-900 px-4 py-2.5">
        <Link to="/chef" className="text-base font-extrabold tracking-tight">
          🔥 Kitchen Display
        </Link>
        <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-300">
          {user?.name}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <button onClick={toggle} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800" title={enabled ? 'Mute alerts' : 'Unmute alerts'}>
            {enabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <button
            onClick={() => document.documentElement.requestFullscreen?.()}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800"
            title="Fullscreen"
          >
            <Maximize2 size={18} />
          </button>
          <button onClick={handleLogout} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800" title="Sign out">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <Outlet context={{ notify }} />
      </main>
    </div>
  );
}