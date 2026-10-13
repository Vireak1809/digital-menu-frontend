import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Check, ChefHat, Clock, Volume2, Ban, ArrowRight, Utensils } from 'lucide-react';
import * as ep from '../../shared/api/endpoints';
import { useSocketEvent } from '../../shared/hooks/useSocketEvent';
import { toast } from '../../shared/components/Toaster';
import type { Order, OrderStatus } from '../../shared/types';
import clsx from 'clsx';

type Context = { notify: () => void };

const LANES: { key: OrderStatus[]; title: string; accent: string }[] = [
  { key: ['PENDING'], title: 'New', accent: 'border-t-amber-500' },
  { key: ['ACCEPTED', 'PREPARING'], title: 'Preparing', accent: 'border-t-sky-500' },
  { key: ['READY'], title: 'Ready to serve', accent: 'border-t-emerald-500' },
];

export default function KdsPage() {
  const { notify } = useOutletContext<Context>();
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['kitchen-board'],
    queryFn: ep.getKitchenBoard,
    refetchInterval: 30_000,
  });

  /* ---------- Real-time ---------- */
  useSocketEvent<Order>('order:new', (order) => {
    queryClient.setQueryData<Order[]>(['kitchen-board'], (prev = []) =>
      prev.some((o) => o.id === order.id) ? prev : [...prev, order],
    );
    notify();
    if (Notification?.permission === 'granted') {
      new Notification(`New order ${order.orderNumber}`, {
        body: `Table ${order.table.number} · ${order.items.length} item(s)`,
        tag: order.id,
      });
    }
    toast.success(`New order · Table ${order.table.number}`);
  });

  useSocketEvent<{ orderId: string; status: OrderStatus }>('order:statusChanged', ({ orderId, status }) => {
    queryClient.setQueryData<Order[]>(['kitchen-board'], (prev = []) => {
      const next = prev.map((o) => (o.id === orderId ? { ...o, status } : o));
      return next.filter((o) => !['SERVED', 'COMPLETED', 'CANCELLED'].includes(o.status));
    });
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) => ep.setOrderStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['kitchen-board'] });
      const previous = queryClient.getQueryData<Order[]>(['kitchen-board']);
      queryClient.setQueryData<Order[]>(['kitchen-board'], (prev = []) =>
        prev.map((o) => (o.id === id ? { ...o, status } : o)).filter((o) => !['SERVED', 'COMPLETED', 'CANCELLED'].includes(o.status)),
      );
      return { previous };
    },
    onError: (e: Error, _v, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(['kitchen-board'], ctx.previous);
      toast.error(e.message);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['kitchen-board'] }),
  });

  const grouped = useMemo(
    () =>
      LANES.map((lane) => ({
        ...lane,
        orders: orders
          .filter((o) => lane.key.includes(o.status))
          .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)),
      })),
    [orders],
  );

  const totalActive = orders.filter((o) => !['SERVED', 'COMPLETED', 'CANCELLED'].includes(o.status)).length;

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b border-slate-800 bg-slate-900/60 px-4 py-2">
        <span className="text-sm font-semibold text-slate-300">{totalActive} active order{totalActive === 1 ? '' : 's'}</span>
        <button
          onClick={() => Notification?.requestPermission?.()}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
        >
          <Volume2 size={14} /> Enable alerts
        </button>
      </div>

      {isLoading ? (
        <div className="grid flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-full bg-slate-800" />)}
        </div>
      ) : (
        <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto p-4 lg:grid-cols-3 lg:overflow-hidden">
          {grouped.map((lane) => (
            <section key={lane.title} className={clsx('flex min-h-0 flex-col rounded-2xl border-t-4 bg-slate-900/70 lg:overflow-hidden', lane.accent)}>
              <header className="flex shrink-0 items-center justify-between px-4 py-3">
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-300">{lane.title}</h2>
                <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-bold text-slate-300">{lane.orders.length}</span>
              </header>

              <div className="space-y-3 overflow-y-auto px-3 pb-3 lg:flex-1">
                {lane.orders.length === 0 && (
                  <p className="py-10 text-center text-sm text-slate-600">Nothing here 🎉</p>
                )}
                {lane.orders.map((order) => (
                  <OrderCard key={order.id} order={order} onAdvance={statusMutation.mutate} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function OrderCard({ order, onAdvance }: { order: Order; onAdvance: (v: { id: string; status: OrderStatus }) => void }) {
  const elapsed = useElapsed(order.createdAt);
  const tone = elapsed < 300 ? 'text-emerald-400' : elapsed < 600 ? 'text-amber-400' : 'text-rose-400';
  const border = elapsed < 300 ? 'border-slate-700' : elapsed < 600 ? 'border-amber-600/60' : 'border-rose-600/70';

  const next: { label: string; status: OrderStatus; icon: typeof Check } | null =
    order.status === 'PENDING'
      ? { label: 'Accept', status: 'ACCEPTED', icon: Check }
      : order.status === 'ACCEPTED'
        ? { label: 'Start cooking', status: 'PREPARING', icon: ChefHat }
        : order.status === 'PREPARING'
          ? { label: 'Mark ready', status: 'READY', icon: Utensils }
          : order.status === 'READY'
            ? { label: 'Served', status: 'SERVED', icon: ArrowRight }
            : null;

  return (
    <article className={clsx('rounded-xl border-2 bg-slate-800/80 p-3.5 shadow-lg', border)}>
      <header className="mb-2.5 flex items-start justify-between gap-2">
        <div>
          <p className="text-lg font-extrabold leading-none text-white">{order.orderNumber}</p>
          <p className="mt-1 text-sm font-semibold text-slate-400">
            Table {order.table.number}
            {order.table.name ? ` · ${order.table.name}` : ''}
          </p>
        </div>
        <span className={clsx('inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2 py-1 text-sm font-bold tabular-nums', tone)}>
          <Clock size={13} /> {formatElapsed(elapsed)}
        </span>
      </header>

      <ul className="mb-3 space-y-1.5">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-start gap-2 text-sm">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand-600 text-xs font-extrabold text-white">
              {item.quantity}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-snug text-slate-100">{item.name}</p>
              {item.note && <p className="text-xs italic text-amber-400">⚠ {item.note}</p>}
            </div>
          </li>
        ))}
      </ul>

      {order.note && (
        <p className="mb-3 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs text-amber-300">📝 {order.note}</p>
      )}

      <div className="flex gap-2">
        {next && (
          <button
            onClick={() => onAdvance({ id: order.id, status: next.status })}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-600 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700 active:scale-[.98]"
          >
            <next.icon size={16} /> {next.label}
          </button>
        )}
        {order.status === 'PENDING' && (
          <button
            onClick={() => {
              const reason = window.prompt('Reason for cancelling?') ?? undefined;
              if (reason !== undefined) ep.setOrderStatus(order.id, 'CANCELLED', reason).catch((e) => toast.error(e.message));
            }}
            className="rounded-lg border border-rose-700 px-3 text-rose-400 transition hover:bg-rose-900/30"
            title="Cancel order"
          >
            <Ban size={16} />
          </button>
        )}
      </div>
    </article>
  );
}

function useElapsed(createdAt: string) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return Math.max(0, Math.floor((now - new Date(createdAt).getTime()) / 1000));
}

function formatElapsed(s: number) {
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}