import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MenuItem } from '../types';

export interface CartLine {
  menuItemId: string;
  name: string;
  price: number;
  image?: string | null;
  quantity: number;
  note?: string;
}

interface CartState {
  qrToken: string | null;
  lines: CartLine[];
  add: (item: MenuItem, qty?: number, note?: string) => void;
  remove: (menuItemId: string) => void;
  setQty: (menuItemId: string, qty: number) => void;
  setNote: (menuItemId: string, note: string) => void;
  clear: () => void;
  bindTable: (qrToken: string) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      qrToken: null,
      lines: [],
      bindTable: (qrToken) => {
        if (get().qrToken !== qrToken) set({ qrToken, lines: [] });
      },
      add: (item, qty = 1, note) =>
        set((s) => {
          const existing = s.lines.find((l) => l.menuItemId === item.id);
          if (existing) {
            return {
              lines: s.lines.map((l) =>
                l.menuItemId === item.id
                  ? { ...l, quantity: l.quantity + qty, note: note ?? l.note }
                  : l,
              ),
            };
          }
          return {
            lines: [
              ...s.lines,
              { menuItemId: item.id, name: item.name, price: Number(item.price), image: item.image, quantity: qty, note },
            ],
          };
        }),
      remove: (id) => set((s) => ({ lines: s.lines.filter((l) => l.menuItemId !== id) })),
      setQty: (id, qty) =>
        set((s) => ({
          lines: qty <= 0
            ? s.lines.filter((l) => l.menuItemId !== id)
            : s.lines.map((l) => (l.menuItemId === id ? { ...l, quantity: qty } : l)),
        })),
      setNote: (id, note) =>
        set((s) => ({ lines: s.lines.map((l) => (l.menuItemId === id ? { ...l, note } : l)) })),
      clear: () => set({ lines: [] }),
    }),
    { name: 'dm_cart' },
  ),
);

export const cartSubtotal = (lines: CartLine[]) =>
  lines.reduce((sum, l) => sum + l.price * l.quantity, 0);