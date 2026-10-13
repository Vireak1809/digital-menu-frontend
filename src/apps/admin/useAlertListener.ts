import { useQueryClient } from '@tanstack/react-query';
import { useSocketEvent } from '../../shared/hooks/useSocketEvent';
import { toast } from '../../shared/components/Toaster';
import type { Order } from '../../shared/types';

/** Global realtime listener for the admin panel: orders, waiter calls, table changes. */
export function useAlertListener() {
  const queryClient = useQueryClient();

  useSocketEvent<Order>('order:new', (order) => {
    toast.success(`New order ${order.orderNumber} · Table ${order.table.number}`);
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['tables'] });
    queryClient.invalidateQueries({ queryKey: ['stats-today'] });
  });

  useSocketEvent('order:statusChanged', () => {
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['stats-today'] });
  });

  useSocketEvent<{ tableId: string; status: string }>('table:statusChanged', () => {
    queryClient.invalidateQueries({ queryKey: ['tables'] });
  });

  useSocketEvent<{ tableNumber: number }>('waiter:called', (p) => {
    toast.success(`🙋 Waiter requested at table ${p.tableNumber}`);
  });

  useSocketEvent<{ tableNumber: number }>('bill:requested', (p) => {
    toast.success(`🧾 Bill requested at table ${p.tableNumber}`);
  });
}