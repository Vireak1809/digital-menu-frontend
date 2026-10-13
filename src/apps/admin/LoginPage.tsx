import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Loader2, LayoutDashboard } from 'lucide-react';
import * as ep from '../../shared/api/endpoints';
import { useAuthStore } from '../../shared/store/auth.store';
import { Button, Field, Input } from '../../shared/components/ui';
import { toast } from '../../shared/components/Toaster';
import { reconnectSocket } from '../../shared/api/socket';

export default function LoginPage() {
  const { user, setSession } = useAuthStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@menu.test');
  const [password, setPassword] = useState('admin1234');

  const mutation = useMutation({
    mutationFn: () => ep.login(email, password),
    onSuccess: ({ user: u, accessToken }) => {
      if (u.role === 'CHEF') {
        toast.error('Chefs must use the kitchen panel.');
        return;
      }
      setSession(u, accessToken);
      reconnectSocket();
      navigate('/admin', { replace: true });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (user && user.role !== 'CHEF') return <Navigate to="/admin" replace />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-6 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-sm">
        <div className="mb-7 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white">
            <LayoutDashboard size={26} />
          </div>
          <h1 className="text-2xl font-extrabold">Admin & Staff</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your restaurant in real time</p>
        </div>

        <form className="card space-y-4 p-5" onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}>
          <Field label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required /></Field>
          <Field label="Password"><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required /></Field>
          <Button type="submit" className="w-full py-3" disabled={mutation.isPending}>
            {mutation.isPending ? <><Loader2 size={17} className="animate-spin" /> Signing in…</> : 'Sign in'}
          </Button>
        </form>

        <p className="mt-5 text-center text-xs text-slate-500">
          Demo — admin@menu.test / admin1234 · staff@menu.test / staff1234
        </p>
      </div>
    </div>
  );
}