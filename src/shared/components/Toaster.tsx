import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

type Toast = { id: number; message: string; tone: 'success' | 'error' };
type Listener = (t: Toast) => void;

const listeners = new Set<Listener>();

export const toast = {
  success: (message: string) => listeners.forEach((l) => l({ id: Date.now() + Math.random(), message, tone: 'success' })),
  error: (message: string) => listeners.forEach((l) => l({ id: Date.now() + Math.random(), message, tone: 'error' })),
};

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener: Listener = (t) => {
      setToasts((prev) => [...prev.slice(-3), t]);
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 3800);
    };
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-3">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={clsx(
            'pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-xl px-4 py-3 text-sm font-medium shadow-lg animate-fade-in',
            t.tone === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white',
          )}
        >
          {t.tone === 'success' ? <CheckCircle2 size={18} className="mt-px shrink-0" /> : <AlertTriangle size={18} className="mt-px shrink-0" />}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => setToasts((p) => p.filter((x) => x.id !== t.id))} aria-label="Dismiss">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}