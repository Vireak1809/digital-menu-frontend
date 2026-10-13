import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, ShoppingBag, Bell, Receipt, Flame, Leaf, Clock } from 'lucide-react';
import * as ep from '../../shared/api/endpoints';
import { useCartStore, cartSubtotal } from '../../shared/store/cart.store';
import { useTableRoom } from '../../shared/hooks/useSocketEvent';
import { MenuSkeleton } from '../../shared/components/Skeleton';
import { Badge, EmptyState, Input } from '../../shared/components/ui';
import { toast } from '../../shared/components/Toaster';
import ItemSheet from './ItemSheet';
import CartDrawer from './CartDrawer';
import type { MenuItem } from '../../shared/types';
import clsx from 'clsx';

export default function MenuPage() {
  const { qrToken = '' } = useParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [vegOnly, setVegOnly] = useState(false);
  const [spicyOnly, setSpicyOnly] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  const cart = useCartStore();
  cart.bindTable(qrToken);
  useTableRoom(qrToken);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['public-menu', qrToken],
    queryFn: () => ep.getPublicMenu(qrToken),
    enabled: Boolean(qrToken),
  });

  const categories = data?.categories ?? [];

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return categories
      .filter((c) => !activeCategory || c.id === activeCategory)
      .map((c) => ({
        ...c,
        items: c.items.filter((i) => {
          if (term && !`${i.name} ${i.description ?? ''}`.toLowerCase().includes(term)) return false;
          if (vegOnly && !i.tags?.includes('veg')) return false;
          if (spicyOnly && !i.tags?.includes('spicy')) return false;
          return true;
        }),
      }))
      .filter((c) => c.items.length > 0);
  }, [categories, search, activeCategory, vegOnly, spicyOnly]);

  const totalItems = cart.lines.reduce((s, l) => s + l.quantity, 0);
  const subtotal = cartSubtotal(cart.lines);

  if (isLoading) return <div className="min-h-screen bg-white dark:bg-slate-950"><MenuSkeleton /></div>;

  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <EmptyState
          title="Menu unavailable"
          description={(error as Error)?.message ?? 'This QR code may have been regenerated. Please ask a staff member.'}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32 dark:bg-slate-950">
      {/* ---------- Header ---------- */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-lg font-extrabold tracking-tight">
                {data?.table.name ?? `Table ${data?.table.number}`}
              </h1>
              <p className="text-xs text-slate-500">Scan · Order · Enjoy</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                onClick={async () => { await ep.callWaiter(qrToken); toast.success('A waiter is on the way 🙋'); }}
                className="rounded-xl p-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Call waiter"
              >
                <Bell size={20} />
              </button>
              <button
                onClick={async () => { await ep.requestBill(qrToken); toast.success('Bill requested 🧾'); }}
                className="rounded-xl p-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Request bill"
              >
                <Receipt size={20} />
              </button>
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search dishes…" className="pl-9" />
            </div>
            <button
              onClick={() => setVegOnly((v) => !v)}
              className={clsx('rounded-xl border px-3 text-xs font-semibold transition',
                vegOnly ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30' : 'border-slate-300 text-slate-500 dark:border-slate-700')}
            >
              <Leaf size={16} />
            </button>
            <button
              onClick={() => setSpicyOnly((v) => !v)}
              className={clsx('rounded-xl border px-3 text-xs font-semibold transition',
                spicyOnly ? 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-900/30' : 'border-slate-300 text-slate-500 dark:border-slate-700')}
            >
              <Flame size={16} />
            </button>
          </div>

          {/* Category chips */}
          <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Chip active={!activeCategory} onClick={() => setActiveCategory(null)}>All</Chip>
            {categories.map((c) => (
              <Chip key={c.id} active={activeCategory === c.id} onClick={() => setActiveCategory(c.id)}>
                {c.name}
              </Chip>
            ))}
          </div>
        </div>
      </header>

      {/* ---------- Menu ---------- */}
      <main className="mx-auto max-w-3xl px-4 py-4">
        {filtered.length === 0 ? (
          <EmptyState title="No dishes found" description="Try a different search or filter." />
        ) : (
          filtered.map((category) => (
            <section key={category.id} className="mb-8">
              <h2 className="mb-3 text-base font-extrabold tracking-tight">{category.name}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {category.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className="card group flex gap-3 overflow-hidden p-3 text-left transition active:scale-[.99] hover:shadow-md"
                  >
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                      {item.image ? (
                        <img src={item.image} alt={item.name} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-2xl">🍴</div>
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="line-clamp-2 text-sm font-bold leading-snug">{item.name}</h3>
                        <span className="shrink-0 text-sm font-extrabold text-brand-600">
                          ${Number(item.price).toFixed(2)}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500">{item.description}</p>
                      <div className="mt-auto flex items-center gap-2 pt-2">
                        {item.tags?.includes('veg') && <Badge tone="green">Veg</Badge>}
                        {item.tags?.includes('spicy') && <Badge tone="red">Spicy</Badge>}
                        {item.tags?.includes('popular') && <Badge tone="amber">Popular</Badge>}
                        <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-slate-400">
                          <Clock size={12} /> {item.prepTime}m
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      {/* ---------- Sticky cart bar ---------- */}
      {totalItems > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 p-3 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95"
             style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            <button onClick={() => setCartOpen(true)} className="btn-primary flex-1 animate-pulse-ring">
              <ShoppingBag size={18} />
              View cart · {totalItems}
              <span className="ml-auto font-extrabold">${subtotal.toFixed(2)}</span>
            </button>
          </div>
        </div>
      )}

      <ItemSheet item={selectedItem} onClose={() => setSelectedItem(null)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} onCheckout={() => { setCartOpen(false); navigate(`/menu/${qrToken}/checkout`); }} />
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold transition',
        active
          ? 'bg-brand-600 text-white shadow-sm'
          : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700',
      )}
    >
      {children}
    </button>
  );
}