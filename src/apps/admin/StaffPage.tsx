import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Pencil } from 'lucide-react';
import * as ep from '../../shared/api/endpoints';
import { Badge, Button, Field, Input, Modal, Select } from '../../shared/components/ui';
import { toast } from '../../shared/components/Toaster';
import type { AuthUser, Role } from '../../shared/types';

const ROLE_TONE: Record<Role, 'violet' | 'blue' | 'amber'> = { ADMIN: 'violet', STAFF: 'blue', CHEF: 'amber' };

interface FormState { id?: string; name: string; email: string; password: string; role: Role; isActive: boolean }

export default function StaffPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<FormState | null>(null);

  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: ep.listUsers });

  const save = useMutation({
    mutationFn: (payload: FormState) =>
      payload.id
        ? ep.updateUser(payload.id, {
            name: payload.name,
            role: payload.role,
            isActive: payload.isActive,
            ...(payload.password ? { password: payload.password } : {}),
          })
        : ep.createUser(payload as unknown as Record<string, unknown>),
    onSuccess: () => { toast.success('Saved'); setEditing(null); qc.invalidateQueries({ queryKey: ['users'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => ep.deleteUser(id),
    onSuccess: () => { toast.success('User deleted'); qc.invalidateQueries({ queryKey: ['users'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Staff</h1>
          <p className="text-sm text-slate-500">{users.length} account(s)</p>
        </div>
        <Button onClick={() => setEditing({ name: '', email: '', password: '', role: 'STAFF', isActive: true })}>
          <Plus size={17} /> New user
        </Button>
      </div>

      <div className="card divide-y divide-slate-100 dark:divide-slate-800">
        {users.map((u: AuthUser) => (
          <div key={u.id} className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-extrabold dark:bg-slate-800">
              {u.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{u.name}</p>
              <p className="truncate text-xs text-slate-500">{u.email}</p>
            </div>
            <Badge tone={ROLE_TONE[u.role]}>{u.role}</Badge>
            {!u.isActive && <Badge tone="red">Disabled</Badge>}
            <button
              onClick={() => setEditing({ id: u.id, name: u.name, email: u.email, password: '', role: u.role, isActive: u.isActive })}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Pencil size={16} />
            </button>
            <button
              onClick={() => { if (confirm(`Delete ${u.name}?`)) remove.mutate(u.id); }}
              className="rounded-lg p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing?.id ? 'Edit user' : 'New user'}>
        {editing && (
          <div className="space-y-4">
            <Field label="Name"><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
            <Field label="Email">
              <Input type="email" value={editing.email} disabled={Boolean(editing.id)} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
            </Field>
            <Field label={editing.id ? 'New password (leave blank to keep)' : 'Password'}>
              <Input type="password" value={editing.password} onChange={(e) => setEditing({ ...editing, password: e.target.value })} minLength={8} />
            </Field>
            <Field label="Role">
              <Select value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value as Role })}>
                <option value="ADMIN">ADMIN</option>
                <option value="STAFF">STAFF</option>
                <option value="CHEF">CHEF</option>
              </Select>
            </Field>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={editing.isActive} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} />
              Account active
            </label>
            <Button className="w-full" onClick={() => save.mutate(editing)} disabled={save.isPending || !editing.name || (!editing.id && !editing.email)}>
              Save user
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}