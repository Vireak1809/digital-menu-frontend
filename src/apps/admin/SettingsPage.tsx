import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ep from '../../shared/api/endpoints';
import { Button, Field, Input, Textarea } from '../../shared/components/ui';
import { toast } from '../../shared/components/Toaster';
import { useAuthStore } from '../../shared/store/auth.store';
import type { Settings } from '../../shared/types';

export default function SettingsPage() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const readOnly = user?.role !== 'ADMIN';
  const [form, setForm] = useState<Partial<Settings>>({});

  const { data } = useQuery({ queryKey: ['settings'], queryFn: ep.getSettings });

  useEffect(() => { if (data) setForm(data); }, [data]);

  const save = useMutation({
    mutationFn: () => ep.updateSettings(form),
    onSuccess: () => { toast.success('Settings saved'); qc.invalidateQueries({ queryKey: ['settings'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!data) return <div className="skeleton h-64" />;

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500">
          {readOnly ? 'Only administrators can change these values.' : 'Restaurant profile, pricing and receipt options'}
        </p>
      </div>

      <div className="card space-y-4 p-5">
        <Field label="Restaurant name">
          <Input value={form.restaurantName ?? ''} disabled={readOnly} onChange={(e) => setForm({ ...form, restaurantName: e.target.value })} />
        </Field>
        <Field label="Logo URL">
          <Input value={form.logo ?? ''} disabled={readOnly} onChange={(e) => setForm({ ...form, logo: e.target.value })} placeholder="https://…" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Currency">
            <Input value={form.currency ?? ''} disabled={readOnly} maxLength={3} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} />
          </Field>
          <Field label="Tax %">
            <Input type="number" step="0.1" min="0" value={form.taxPercent ?? 0} disabled={readOnly} onChange={(e) => setForm({ ...form, taxPercent: Number(e.target.value) })} />
          </Field>
          <Field label="Service charge %">
            <Input type="number" step="0.1" min="0" value={form.serviceChargePercent ?? 0} disabled={readOnly} onChange={(e) => setForm({ ...form, serviceChargePercent: Number(e.target.value) })} />
          </Field>
        </div>
        <Field label="Receipt footer">
          <Textarea value={form.receiptFooter ?? ''} disabled={readOnly} onChange={(e) => setForm({ ...form, receiptFooter: e.target.value })} />
        </Field>

        {!readOnly && (
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? 'Saving…' : 'Save settings'}
          </Button>
        )}
      </div>
    </div>
  );
}