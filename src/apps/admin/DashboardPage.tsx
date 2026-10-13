import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ClipboardList, DollarSign, Users, TrendingUp } from 'lucide-react';
import * as ep from '../../shared/api/endpoints';
import { Badge } from '../../shared/components/ui';
import type { OrderStatus } from '../../shared/types';

const STATUS_TONE: Record<OrderStatus, 'amber' | 'blue' | 'violet' | 'green' | 'slate' | 'red'> = {
  PENDING: 'amber', ACCEPTED: 'blue', PREPARING: 'violet', READY: 'green',
  SERVED: 'slate', COMPLETED: 'slate', CANCELLED: 'red',
};

export default function DashboardPage() {
  const { data: stats } = useQuery({ queryKey: ['stats-today'], queryFn: ep.todayStats, refetchInterval: 30_000 });
  const { data: orders = [] } = useQuery({
    queryKey: ['orders', 'active'],
    queryFn: () => ep.listOrders({ active: true, limit: 12 }),
    refetchInterval: 20_000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Dashboard</h1>
        <p className="text-sm text-slate-500">Live overview of today's service</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ClipboardList} label="Orders today" value={stats?.ordersToday ?? 0} tone="bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300" />
        <StatCard icon={DollarSign} label="Revenue today" value={`$${(stats?.revenueToday ?? 0).toFixed(2)}`} tone="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" />
        <StatCard icon={Users} label="Active tables" value={stats?.activeTables ?? 0} tone="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" />
        <StatCard icon={TrendingUp} label="Top item" value={stats?.topItems?.[0]?.name ?? '—'} tone="bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" small />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="card lg:col-span-2">
          <header className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 dark:border-slate-800">
            <h2 className="font-bold">Live orders</h2>
            <Link to="/admin/orders" className="text-xs font-semibold text-brand-600 hover:underline">View all</Link>
          </header>
          {orders.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">No active orders right now.</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {orders.map((o) => (
                <li key={o.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">{o.orderNumber}</p>
                    <p className="truncate text-xs text-slate-500">
                      Table {o.table.number} · {o.items.length} item{o.items.length === 1 ? '' : 's'}
                      {o.customerName ? ` · ${o.customerName}` : ''}
                    </p>
                  </div>
                  <Badge tone={STATUS_TONE[o.status]}>{o.status}</Badge>
                  <span className="w-20 text-right text-sm font-bold tabular-nums">${Number(o.totalAmount).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <header className="border-b border-slate-200 px-5 py-3.5 dark:border-slate-800">
            <h2 className="font-bold">Top sellers today</h2>
          </header>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {(stats?.topItems ?? []).map((item, i) => (
              <li key={item.name} className="flex items-center gap-3 px-5 py-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-xs font-extrabold dark:bg-slate-800">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{item.name}</span>
                <span className="text-sm font-bold tabular-nums text-slate-500">{item.quantity}</span>
              </li>
            ))}
            {!stats?.topItems?.length && <li className="p-8 text-center text-sm text-slate-500">No sales yet today.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone, small }: { icon: typeof Users; label: string; value: string | number; tone: string; small?: boolean }) {
  return (
    <div className="card flex items-center gap-4 p-4">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className={`truncate font-extrabold ${small ? 'text-base' : 'text-2xl'}`}>{value}</p>
      </div>
    </div>
  );
}