import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCartStore, cartSubtotal } from '../../shared/store/cart.store';
import { Button, EmptyState, Modal, Textarea } from '../../shared/components/ui';

export default function CartDrawer({ open, onClose, onCheckout }: { open: boolean; onClose: () => void; onCheckout: () => void }) {
  const { lines, setQty, remove, setNote, clear } = useCartStore();
  const subtotal = cartSubtotal(lines);

  return (
    <Modal open={open} onClose={onClose} title={`Your order (${lines.length})`}>
      {lines.length === 0 ? (
        <EmptyState title="Your cart is empty" description="Browse the menu and add something delicious." />
      ) : (
        <>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {lines.map((line) => (
              <li key={line.menuItemId} className="flex gap-3 py-3.5">
                {line.image && <img src={line.image} alt="" className="h-16 w-16 rounded-lg object-cover" />}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold leading-snug">{line.name}</p>
                    <p className="shrink-0 text-sm font-bold tabular-nums">${(line.price * line.quantity).toFixed(2)}</p>
                  </div>
                  <Textarea
                    value={line.note ?? ''}
                    onChange={(e) => setNote(line.menuItemId, e.target.value)}
                    placeholder="Add a note…"
                    className="mt-2 min-h-[40px] py-2 text-xs"
                    rows={1}
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700">
                      <button onClick={() => setQty(line.menuItemId, line.quantity - 1)} className="p-1.5" aria-label="Decrease"><Minus size={14} /></button>
                      <span className="w-6 text-center text-sm font-semibold tabular-nums">{line.quantity}</span>
                      <button onClick={() => setQty(line.menuItemId, line.quantity + 1)} className="p-1.5" aria-label="Increase"><Plus size={14} /></button>
                    </div>
                    <button onClick={() => remove(line.menuItemId)} className="ml-auto rounded-lg p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20" aria-label="Remove">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-800">
            <span className="text-sm font-semibold text-slate-500">Subtotal</span>
            <span className="text-xl font-extrabold tabular-nums">${subtotal.toFixed(2)}</span>
          </div>

          <div className="mt-4 flex gap-2">
            <Button variant="outline" onClick={clear}>Clear</Button>
            <Button className="flex-1" onClick={onCheckout}>
              <ShoppingBag size={17} /> Checkout
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}