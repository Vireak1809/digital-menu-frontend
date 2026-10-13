import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import * as ep from '../../shared/api/endpoints';
import { apiUrl } from '../../shared/api/client';
import { Input } from '../../shared/components/ui';

export default function ReportsPage() {
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 6); return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));

  const { data, isLoading } = useQuery({
    queryKey: ['report', from, to],
    queryFn: () => ep.reportSummary(from, to),
  });

  const max = Math.max(1, ...(data?.daily ?? []).map((d) => d.revenue));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Reports</h1>
          <p className="text-sm text-slate-500">Sales performance for the selected period</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="block"><span className="label">From</span><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
          <label className="block"><span className="label">To</span><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
          <a href={apiUrl(`/api/admin/reports/export.csv?from=${from}&to=${to}`)} className="btn-outline">
            <Download size={16} /> CSV
          </a>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-28" />)}</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Metric label="Orders" value={data?.totals.orders ?? 0} />
            <Metric label="Revenue" value={`$${(data?.totals.revenue ?? 0).toFixed(2)}`} />
            <Metric label="Average order" value={`$${(data?.totals.averageOrder ?? 0).toFixed(2)}`} />
          </div>

          <section className="card p-5">
            <h2 className="mb-5 font-bold">Revenue by day</h2>
            <div className="flex h-52 items-end gap-2">
              {(data?.daily ?? []).map((d) => (
                <div key={d.date} className="group flex flex-1 flex-col items-center gap-2">
                  <span className="text-[10px] font-bold tabular-nums text-slate-500 opacity-0 transition group-hover:opacity-100">
                    ${d.revenue.toFixed(0)}
                  </span>
                  <div
                    className="w-full rounded-t-lg bg-brand-500 transition hover:bg-brand-600"
                    style={{ height: `${Math.max(4, (d.revenue / max) * 100)}%` }}
                    title={`${d.date}: $${d.revenue.toFixed(2)} (${d.orders} orders)`}
                  />
                  <span className="text-[10px] text-slate-500">{d.date.slice(5)}</span>
                </div>
              ))}
              {!data?.daily.length && <p className="w-full text-center text-sm text-slate-500">No data in this range.</p>}
            </div>
          </section>

          <section className="card overflow-hidden">
            <header className="border-b border-slate-200 px-5 py-3.5 dark:border-slate-800">
              <h2 className="font-bold">Item performance</h2>
            </header>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-sm">
                <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500 dark:bg-slate-800/60">
                  <tr><th className="px-5 py-3">Item</th><th className="px-5 py-3 text-right">Sold</th><th className="px-5 py-3 text-right">Revenue</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(data?.items ?? []).map((i) => (
                    <tr key={i.name}>
                      <td className="px-5 py-3 font-semibold">{i.name}</td>
                      <td className="px-5 py-3 text-right tabular-nums">{i.quantity}</td>
                      <td className="px-5 py-3 text-right font-bold tabular-nums">${i.revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-extrabold tabular-nums">{value}</p>
    </div>
  );
}