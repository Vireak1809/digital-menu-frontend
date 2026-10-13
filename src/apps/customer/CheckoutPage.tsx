import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import * as ep from '../../shared/api/endpoints';
import { useCartStore, cartSubtotal } from '../../shared/store/cart.store';
import { Button, Field, Input, Textarea } from '../../shared/components/ui';
import { toast } from '../../shared/components/Toaster';

export default function CheckoutPage() {
  const { qrToken = '' } = useParams();
  const navigate = useNavigate();
  const { lines, clear } = useCartStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');

  const subtotal = cartSubtotal(lines);
  const taxPercent = 5;
  const servicePercent = 10;
  const tax = (subtotal * taxPercent) / 100;
  const service = (subtotal * servicePercent) / 100;
  const total = subtotal + tax + service;

  const mutation = useMutation({
    mutationFn: () =>
      ep.placeOrder(qrToken, {
        customerName: name.trim() || undefined,
        customerPhone: phone.trim() || undefined,
        note: note.trim() || undefined,
        items: lines.map((l) => ({ menuItemId: l.menuItemId, quantity: l.quantity, note: l.note })),
      }),
    onSuccess: (order) => {
      clear();
      toast.success(`Order ${order.orderNumber} placed!`);
      navigate(`/menu/${qrToken}/order/${order.id}`, { replace: true });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (lines.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-lg font-bold">Your cart is empty</p>
        <Link to={`/menu/${qrToken}`} className="btn-primary">Back to menu</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-28 dark:bg-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link to={`/menu/${qrToken}`} className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Back">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-base font-bold">Confirm your order</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-5 px-4 py-5">
        <section className="card p-4">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Items</h2>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {lines.map((l) => (
              <li key={l.menuItemId} className="flex items-start justify-between gap-3 py-2.5 text-sm">
                <div>
                  <span className="font-semibold">{l.quantity}× {l.name}</span>
                  {l.note && <p className="text-xs text-slate-500">“{l.note}”</p>}
                </div>
                <span className="font-semibold tabular-nums">${(l.price * l.quantity).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card space-y-4 p-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Your details (optional)</h2>
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Alex" maxLength={80} />
          </Field>
          <Field label="Phone">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 012 345 678" inputMode="tel" maxLength={30} />
          </Field>
          <Field label="Note for the kitchen">
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Allergies, timing, celebration…" maxLength={300} />
          </Field>
        </section>

        <section className="card p-4">
          <dl className="space-y-2 text-sm">
            <Row label="Subtotal" value={`$${subtotal.toFixed(2)}`} />
            <Row label="Tax" value={`$${tax.toFixed(2)}`} />
            <Row label="Service charge" value={`$${service.toFixed(2)}`} />
            <div className="flex items-center justify-between border-t border-slate-200 pt-3 dark:border-slate-800">
              <dt className="text-base font-bold">Total</dt>
              <dd className="text-xl font-extrabold text-brand-600 tabular-nums">${total.toFixed(2)}</dd>
            </div>
          </dl>
          <p className="mt-3 text-[11px] text-slate-400">Final amount is calculated by the restaurant and may include tax & service charge.</p>
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 p-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95"
           style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
        <div className="mx-auto max-w-2xl">
          <Button className="w-full py-3.5 text-base" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? <><Loader2 size={18} className="animate-spin" /> Placing order…</> : `Place order · $${total.toFixed(2)}`}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}