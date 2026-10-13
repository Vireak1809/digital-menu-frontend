import { useEffect, useState } from 'react';
import { Minus, Plus, Clock } from 'lucide-react';
import type { MenuItem } from '../../shared/types';
import { useCartStore } from '../../shared/store/cart.store';
import { Badge, Button, Modal, Textarea } from '../../shared/components/ui';
import { toast } from '../../shared/components/Toaster';

export default function ItemSheet({ item, onClose }: { item: MenuItem | null; onClose: () => void }) {
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');
  const add = useCartStore((s) => s.add);

  useEffect(() => { setQty(1); setNote(''); }, [item?.id]);

  if (!item) return null;

  const handleAdd = () => {
    add(item, qty, note.trim() || undefined);
    toast.success(`${qty}× ${item.name} added`);
    onClose();
  };

  return (
    <Modal open={Boolean(item)} onClose={onClose} title={item.name}>
      {item.image && (
        <img src={item.image} alt={item.name} className="-mt-5 mb-4 h-52 w-full rounded-xl object-cover" />
      )}

      <div className="flex flex-wrap gap-1.5">
        {item.tags?.map((t) => (
          <Badge key={t} tone={t === 'veg' ? 'green' : t === 'spicy' ? 'red' : 'amber'}>{t}</Badge>
        ))}
        <Badge tone="slate"><Clock size={11} className="mr-1" />{item.prepTime} min</Badge>
      </div>

      {item.description && <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{item.description}</p>}

      <p className="mt-4 text-2xl font-extrabold text-brand-600">${Number(item.price).toFixed(2)}</p>

      <div className="mt-5">
        <span className="label">Special instructions</span>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. no onions, extra spicy…" maxLength={200} />
      </div>

      <div className="mt-5 flex items-center gap-4">
        <div className="flex items-center gap-3 rounded-xl border border-slate-300 p-1 dark:border-slate-700">
          <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Decrease">
            <Minus size={16} />
          </button>
          <span className="w-8 text-center text-lg font-bold tabular-nums">{qty}</span>
          <button onClick={() => setQty((q) => Math.min(50, q + 1))} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Increase">
            <Plus size={16} />
          </button>
        </div>
        <Button onClick={handleAdd} className="flex-1">
          Add · ${(Number(item.price) * qty).toFixed(2)}
        </Button>
      </div>
    </Modal>
  );
}