import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, ChefHat, Bell, UtensilsCrossed, XCircle, ArrowLeft } from 'lucide-react';
import * as ep from '../../shared/api/endpoints';
import { useTableRoom, useSocketEvent } from '../../shared/hooks/useSocketEvent';
import type { Order, OrderStatus } from '../../shared/types';
import clsx from 'clsx';

const STEPS: { key: OrderStatus; label: string; icon: typeof Bell }[] = [
  { key: 'PENDING', label: 'Order received', icon: Bell },
  { key: 'ACCEPTED', label: 'Accepted', icon: CheckCircle2 },
  { key: 'PREPARING', label: 'Preparing', icon: ChefHat },
  { key: 'READY', label: 'Ready', icon: UtensilsCrossed },
  { key: 'SERVED', label: 'Served', icon: CheckCircle2 },
];

export default function OrderTrackPage() {
  const { qrToken = '', orderId = '' } = useParams();
  const queryClient = useQueryClient();
  useTableRoom(qrToken);

  const { data: order, isLoading } = useQuery({
    queryKey: ['public-order', orderId],
    queryFn: () => ep.getPublicOrder(orderId),
    refetchInterval: 20_000, // fallback if socket drops
  });

  useSocketEvent<{ orderId: string; status: OrderStatus }>('order:statusChanged', (payload) => {
    if (payload.orderId !== orderId) return;
    queryClient.setQueryData<Order>(['public-order', orderId], (prev) => (prev ? { ...prev, status: payload.status } : prev));
  });

  if (isLoading || !order) {
    return <div className="flex min-h-screen items-center justify-center"><div className="skeleton h-6 w-40" /></div>;
  }

  const cancelled = order.status === 'CANCELLED';
  const currentIndex = STEPS.findIndex((s) => s.key === order.status);

  return (
    <div className="min-h-screen bg-slate-50 pb-10 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link to={`/menu/${qrToken}`} className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Back to menu">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-base font-bold">{order.orderNumber}</h1>
            <p className="text-xs text-slate-500">Table {order.table.number}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-5 px-4 py-5">
        {cancelled ? (
          <div className="card flex items-center gap-3 border-rose-200 bg-rose-50 p-5 dark:border-rose-900 dark:bg-rose-950/40">
            <XCircle className="text-rose-600" />
            <div>
              <p className="font-bold text-rose-700 dark:text-rose-300">Order cancelled</p>
              <p className="text-sm text-rose-600/80 dark:text-rose-400/80">
                {order.cancelReason ?? 'Please speak with a staff member.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="card p-5">
            <h2 className="mb-5 text-sm font-bold uppercase tracking-wide text-slate-500">Live status</h2>
            <ol className="space-y-0">
              {STEPS.map((step, i) => {
                const done = i <= currentIndex;
                const active = i === currentIndex;
                const Icon = step.icon;
                return (
                  <li key={step.key} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={clsx(
                        'flex h-10 w-10 items-center justify-center rounded-full transition',
                        done ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-400 dark:bg-slate-800',
                        active && 'animate-pulse-ring',
                      )}>
                        <Icon size={18} />
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className={clsx('w-0.5 flex-1', i < currentIndex ? 'bg-brand-600' : 'bg-slate-200 dark:bg-slate-800')} />
                      )}
                    </div>
                    <div className={clsx('pb-7 pt-2.5 text-sm font-semibold', done ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400')}>
                      {step.label}
                      {active && !['SERVED'].includes(step.key) && (
                        <span className="ml-2 text-xs font-normal text-brand-600">in progress…</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        <section className="card p-4">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Order summary</h2>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {order.items.map((i) => (
              <li key={i.id} className="flex items-start justify-between gap-3 py-2.5 text-sm">
                <div>
                  <span className="font-semibold">{i.quantity}× {i.name}</span>
                  {i.note && <p className="text-xs text-slate-500">“{i.note}”</p>}
                </div>
                <span className="tabular-nums">${(Number(i.unitPrice) * i.quantity).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3 dark:border-slate-800">
            <span className="font-bold">Total</span>
            <span className="text-xl font-extrabold text-brand-600 tabular-nums">${Number(order.totalAmount).toFixed(2)}</span>
          </div>
        </section>

        <Link to={`/menu/${qrToken}`} className="btn-outline w-full">Order something else</Link>
      </main>
    </div>
  );
}