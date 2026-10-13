import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, RefreshCw, QrCode, Pencil } from 'lucide-react';
import * as ep from '../../shared/api/endpoints';
import { Badge, Button, EmptyState, Field, Input, Modal, Select } from '../../shared/components/ui';
import { toast } from '../../shared/components/Toaster';
import { apiUrl } from '../../shared/api/client';
import { useSocketEvent } from '../../shared/hooks/useSocketEvent';
import type { Table, TableStatus } from '../../shared/types';
import clsx from 'clsx';

const STATUS_TONE: Record<TableStatus, 'green' | 'amber' | 'blue'> = { FREE: 'green', OCCUPIED: 'amber', RESERVED: 'blue' };
const STATUS_RING: Record<TableStatus, string> = {
  FREE: 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800',
  OCCUPIED: 'border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800',
  RESERVED: 'border-sky-300 bg-sky-50 dark:bg-sky-900/20 dark:border-sky-800',
};

export default function TablesPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Table> | null>(null);
  const [qrTable, setQrTable] = useState<Table | null>(null);

  const { data: tables = [], isLoading } = useQuery({ queryKey: ['tables'], queryFn: ep.listTables });

  useSocketEvent('table:statusChanged', () => qc.invalidateQueries({ queryKey: ['tables'] }));

  const save = useMutation({
    mutationFn: (payload: Partial<Table>) =>
      payload.id ? ep.updateTable(payload.id, payload) : ep.createTable(payload as never),
    onSuccess: () => { toast.success('Table saved'); setEditing(null); qc.invalidateQueries({ queryKey: ['tables'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TableStatus }) => ep.setTableStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tables'] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const regenerate = useMutation({
    mutationFn: (id: string) => ep.regenerateQr(id),
    onSuccess: () => { toast.success('QR token regenerated — reprint the code!'); qc.invalidateQueries({ queryKey: ['tables'] }); },
  });

  const remove = useMutation({
    mutationFn: (id: string) => ep.deleteTable(id),
    onSuccess: () => { toast.success('Table deleted'); qc.invalidateQueries({ queryKey: ['tables'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Tables</h1>
          <p className="text-sm text-slate-500">
            {tables.filter((t) => t.status === 'OCCUPIED').length} occupied · {tables.length} total
          </p>
        </div>
        <Button onClick={() => setEditing({ capacity: 4, status: 'FREE' })}><Plus size={17} /> New table</Button>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => <div key={i} className="skeleton h-36" />)}
        </div>
      ) : tables.length === 0 ? (
        <EmptyState title="No tables yet" description="Add tables to generate QR codes for your guests." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {tables.map((t) => (
            <div key={t.id} className={clsx('rounded-2xl border-2 p-4 transition', STATUS_RING[t.status])}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-2xl font-extrabold leading-none">#{t.number}</p>
                  {t.name && <p className="mt-1 text-xs font-semibold text-slate-500">{t.name}</p>}
                </div>
                <Badge tone={STATUS_TONE[t.status]}>{t.status}</Badge>
              </div>

              <p className="mt-3 text-xs text-slate-500">
                Seats {t.capacity}
                {t.orders?.length ? ` · ${t.orders.length} active order${t.orders.length === 1 ? '' : 's'}` : ''}
              </p>

              <Select
                value={t.status}
                onChange={(e) => setStatus.mutate({ id: t.id, status: e.target.value as TableStatus })}
                className="mt-3 py-1.5 text-xs"
              >
                <option value="FREE">Free</option>
                <option value="OCCUPIED">Occupied</option>
                <option value="RESERVED">Reserved</option>
              </Select>

              <div className="mt-3 flex items-center gap-1">
                <button onClick={() => setQrTable(t)} className="rounded-lg p-2 text-slate-500 hover:bg-white/70 dark:hover:bg-slate-800" title="Show QR"><QrCode size={16} /></button>
                <button onClick={() => setEditing(t)} className="rounded-lg p-2 text-slate-500 hover:bg-white/70 dark:hover:bg-slate-800" title="Edit"><Pencil size={16} /></button>
                <button
                  onClick={() => { if (confirm('Regenerate the QR token? Existing printed codes will stop working.')) regenerate.mutate(t.id); }}
                  className="rounded-lg p-2 text-slate-500 hover:bg-white/70 dark:hover:bg-slate-800"
                  title="Regenerate QR token"
                >
                  <RefreshCw size={16} />
                </button>
                <button
                  onClick={() => { if (confirm(`Delete table #${t.number}?`)) remove.mutate(t.id); }}
                  className="ml-auto rounded-lg p-2 text-rose-500 hover:bg-white/70 dark:hover:bg-slate-800"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / edit */}
      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing?.id ? `Edit table #${editing.number}` : 'New table'}>
        {editing && (
          <div className="space-y-4">
            <Field label="Table number">
              <Input type="number" min="1" value={editing.number ?? ''} onChange={(e) => setEditing({ ...editing, number: Number(e.target.value) })} />
            </Field>
            <Field label="Label (optional)">
              <Input value={editing.name ?? ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="e.g. Terrace 1" />
            </Field>
            <Field label="Capacity">
              <Input type="number" min="1" value={editing.capacity ?? 4} onChange={(e) => setEditing({ ...editing, capacity: Number(e.target.value) })} />
            </Field>
            <Button className="w-full" onClick={() => save.mutate(editing)} disabled={save.isPending || !editing.number}>
              Save table
            </Button>
          </div>
        )}
      </Modal>

      {/* QR preview */}
      <Modal open={Boolean(qrTable)} onClose={() => setQrTable(null)} title={`QR — Table #${qrTable?.number}`}>
        {qrTable && (
          <div className="flex flex-col items-center gap-4">
            <img src={apiUrl(`/api/public/tables/${qrTable.qrToken}/qr.png?size=560`)} alt={`Table ${qrTable.number} QR`} className="w-full max-w-xs rounded-xl border border-slate-200" />
            <p className="break-all text-center text-xs text-slate-500">
              {`${window.location.origin}/menu/${qrTable.qrToken}`}
            </p>
            <div className="flex w-full gap-2">
              <a
                href={apiUrl(`/api/public/tables/${qrTable.qrToken}/qr.png?size=1024`)}
                download={`table-${qrTable.number}-qr.png`}
                className="btn-outline flex-1"
              >
                Download PNG
              </a>
              <Button className="flex-1" onClick={() => window.print()}>Print</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}