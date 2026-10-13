import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ChefHat, Loader2 } from 'lucide-react';
import * as ep from '../../shared/api/endpoints';
import { useAuthStore } from '../../shared/store/auth.store';
import { Button, Field, Input } from '../../shared/components/ui';
import { toast } from '../../shared/components/Toaster';
import { reconnectSocket } from '../../shared/api/socket';

export default function ChefLoginPage() {
  const { user, setSession } = useAuthStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('chef@menu.test');
  const [password, setPassword] = useState('chef1234');

  const mutation = useMutation({
    mutationFn: () => ep.login(email, password),
    onSuccess: ({ user: u, accessToken }) => {
      if (u.role !== 'CHEF' && u.role !== 'ADMIN') {
        toast.error('This account cannot access the kitchen display.');
        return;
      }
      setSession(u, accessToken);
      reconnectSocket();
      navigate('/chef', { replace: true });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (user && (user.role === 'CHEF' || user.role === 'ADMIN')) return <Navigate to="/chef" replace />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <div className="w-full max-w-sm">
        <div className="mb-7 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white">
            <ChefHat size={28} />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Kitchen Display</h1>
          <p className="mt-1 text-sm text-slate-400">Sign in to view the live order board</p>
        </div>

        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}>
          <Field label="Email">
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="username" required />
          </Field>
          <Field label="Password">
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="current-password" required />
          </Field>
          <Button type="submit" className="w-full py-3" disabled={mutation.isPending}>
            {mutation.isPending ? <><Loader2 size={17} className="animate-spin" /> Signing in…</> : 'Enter kitchen'}
          </Button>
        </form>

        <p className="mt-5 text-center text-xs text-slate-500">Demo: chef@menu.test / chef1234</p>
      </div>
    </div>
  );
}