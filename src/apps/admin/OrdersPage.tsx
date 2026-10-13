import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Printer, X } from 'lucide-react';
import * as ep from '../../shared/api/endpoints';
import { Badge, Button, EmptyState, Modal, Select } from '../../shared/components/ui';
import { toast } from '../../shared/components/Toaster';
import { useSocketEvent } from '../../shared/hooks/useSocketEvent';
import type { Order, OrderStatus } from '../../shared/types';

const STATUSES: OrderStatus[] = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED', 'CANCELLED'];

const TONE: Record<OrderStatus, 'amber' | 'blue' | 'violet' | 'green' | 'slate' | 'red'> = {
  PENDING: 'amber', ACCEPTED: 'blue', PREPARING: 'violet', READY: 'green',
  SERVED: 'slate', COMPLETED: 'slate', CANCELLED: 'red',
};

export default function OrdersPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<string>('');
  const [receipt, setReceipt] = useState<Order | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders', status],
    queryFn: () => ep.listOrders(status ? { status } : { limit: 150 }),
    refetchInterval: 30_000,
  });

  useSocketEvent('order:new', () => qc.invalidateQueries({ queryKey: ['orders'] }));
  useSocketEvent('order:statusChanged', () => qc.invalidateQueries({ queryKey: ['orders'] }));

  const mutation = useMutation({
    mutationFn: ({ id, next }: { id: string; next: OrderStatus }) => ep.setOrderStatus(id, next),
    onSuccess: () => { toast.success('Order updated'); qc.invalidateQueries({ queryKey: ['orders'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const cancel = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => ep.setOrderStatus(id, 'CANCELLED', reason),
    onSuccess: () => { toast.success('Order cancelled'); qc.invalidateQueries({ queryKey: ['orders'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Orders</h1>
          <p className="text-sm text-slate-500">{orders.length} order(s)</p>
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-44">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-20" />)}</div>
      ) : orders.length === 0 ? (
        <EmptyState title="No orders" description="Orders placed by customers will appear here instantly." />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500 dark:bg-slate-800/60">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Table</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3">
                      <p className="font-bold">{o.orderNumber}</p>
                      <p className="text-xs text-slate-500">{new Date(o.createdAt).toLocaleTimeString()}</p>
                    </td>
                    <td className="px-4 py-3">#{o.table.number}</td>
                    <td className="max-w-[220px] truncate px-4 py-3 text-slate-500">
                      {o.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                    </td>
                    <td className="px-4 py-3"><Badge tone={TONE[o.status]}>{o.status}</Badge></td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums">${Number(o.totalAmount).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <Select
                          value={o.status}
                          onChange={(e) => mutation.mutate({ id: o.id, next: e.target.value as OrderStatus })}
                          className="w-36 py-1.5 text-xs"
                        >
                          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </Select>
                        <button onClick={() => setReceipt(o)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" title="Print receipt">
                          <Printer size={16} />
                        </button>
                        {!['COMPLETED', 'CANCELLED'].includes(o.status) && (
                          <button
                            onClick={() => {
                              const reason = window.prompt('Cancellation reason?');
                              if (reason) cancel.mutate({ id: o.id, reason });
                            }}
                            className="rounded-lg p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                            title="Cancel order"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ReceiptModal order={receipt} onClose={() => setReceipt(null)} />
    </div>
  );
}

/** 80mm thermal-printer friendly receipt. */
function ReceiptModal({ order, onClose }: { order: Order | null; onClose: () => void }) {
  if (!order) return null;
  return (
    <Modal open onClose={onClose} title="Receipt">
      <div id="receipt-print" className="mx-auto max-w-[300px] bg-white font-mono text-[12px] leading-tight text-black">
        <div className="text-center">
          <p className="text-base font-bold">THE DIGITAL BISTRO</p>
          <p>Table {order.table.number}</p>
          <p>{new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <hr className="my-2 border-dashed border-black" />
        {order.items.map((i) => (
          <div key={i.id} className="flex justify-between">
            <span>{i.quantity}× {i.name}</span>
            <span>${(Number(i.unitPrice) * i.quantity).toFixed(2)}</span>
          </div>
        ))}
        <hr className="my-2 border-dashed border-black" />
        <div className="flex justify-between"><span>Subtotal</span><span>${Number(order.subtotal).toFixed(2)}</span></div>
        <div className="flex justify-between"><span>Tax</span><span>${Number(order.taxAmount).toFixed(2)}</span></div>
        <div className="flex justify-between"><span>Service</span><span>${Number(order.serviceAmount).toFixed(2)}</span></div>
        <div className="mt-1 flex justify-between border-t border-black pt-1 text-sm font-bold">
          <span>TOTAL</span><span>${Number(order.totalAmount).toFixed(2)}</span>
        </div>
        <hr className="my-2 border-dashed border-black" />
        <p className="text-center">Thank you for dining with us!</p>
      </div>

      <div className="mt-5 flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onClose}>Close</Button>
        <Button className="flex-1" onClick={() => printReceipt()}>Print</Button>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #receipt-print, #receipt-print * { visibility: visible !important; }
          #receipt-print { position: fixed; inset: 0 auto auto 0; width: 80mm; padding: 4mm; }
          @page { size: 80mm auto; margin: 0; }
        }
      `}</style>
    </Modal>
  );
}

function printReceipt() {
  window.print();
}