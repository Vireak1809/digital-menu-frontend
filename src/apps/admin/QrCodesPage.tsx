import { useQuery } from '@tanstack/react-query';
import { Printer, Download } from 'lucide-react';
import * as ep from '../../shared/api/endpoints';
import { apiUrl } from '../../shared/api/client';
import { Button } from '../../shared/components/ui';

export default function QrCodesPage() {
  const { data: tables = [] } = useQuery({ queryKey: ['tables'], queryFn: ep.listTables });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">QR codes</h1>
          <p className="text-sm text-slate-500">Print and place a code on every table</p>
        </div>
        <Button onClick={() => window.open(apiUrl('/api/admin/tables-print?print=1'), '_blank')}>
          <Printer size={17} /> Print all
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tables.map((t) => (
          <div key={t.id} className="card flex flex-col items-center gap-3 p-5">
            <img
              src={apiUrl(`/api/public/tables/${t.qrToken}/qr.png?size=400`)}
              alt={`Table ${t.number}`}
              loading="lazy"
              className="w-full max-w-[200px] rounded-xl border border-slate-200"
            />
            <div className="text-center">
              <p className="font-extrabold">Table #{t.number}</p>
              {t.name && <p className="text-xs text-slate-500">{t.name}</p>}
            </div>
            <a
              href={apiUrl(`/api/public/tables/${t.qrToken}/qr.png?size=1024`)}
              download={`table-${t.number}-qr.png`}
              className="btn-outline w-full"
            >
              <Download size={15} /> Download
            </a>
          </div>
        ))}
        {tables.length === 0 && <p className="col-span-full py-16 text-center text-sm text-slate-500">Create tables first to generate QR codes.</p>}
      </div>
    </div>
  );
}