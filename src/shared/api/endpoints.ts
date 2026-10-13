import { api } from './client';
import type { Category, MenuItem, Order, OrderStatus, Settings, Table, AuthUser, OrderItemStatus } from '../types';

/* ---------- Auth ---------- */
export const login = (email: string, password: string) =>
  api<{ accessToken: string; user: AuthUser }>('/api/auth/login', { method: 'POST', body: { email, password }, auth: false });

export const logout = () => api<null>('/api/auth/logout', { method: 'POST' });
export const me = () => api<AuthUser>('/api/auth/me');

/* ---------- Public / Customer ---------- */
export const getPublicMenu = (qrToken: string) =>
  api<{ table: Pick<Table, 'id' | 'number' | 'name' | 'status'>; categories: (Category & { items: MenuItem[] })[] }>(
    `/api/public/menu/${qrToken}`,
    { auth: false },
  );

export const getPublicOrder = (orderId: string) => api<Order>(`/api/public/orders/${orderId}`, { auth: false });

export const placeOrder = (
  qrToken: string,
  payload: {
    customerName?: string;
    customerPhone?: string;
    note?: string;
    items: { menuItemId: string; quantity: number; note?: string }[];
  },
) => api<Order>(`/api/public/tables/${qrToken}/orders`, { method: 'POST', body: payload, auth: false });

export const callWaiter = (qrToken: string) =>
  api<unknown>(`/api/public/tables/${qrToken}/call-waiter`, { method: 'POST', auth: false });

export const requestBill = (qrToken: string) =>
  api<unknown>(`/api/public/tables/${qrToken}/request-bill`, { method: 'POST', auth: false });

/* ---------- Admin ---------- */
export const listCategories = () => api<Category[]>('/api/admin/categories');
export const createCategory = (body: Partial<Category>) => api<Category>('/api/admin/categories', { method: 'POST', body });
export const updateCategory = (id: string, body: Partial<Category>) => api<Category>(`/api/admin/categories/${id}`, { method: 'PATCH', body });
export const deleteCategory = (id: string) => api<null>(`/api/admin/categories/${id}`, { method: 'DELETE' });
export const reorderCategories = (ids: string[]) => api<null>('/api/admin/categories/reorder', { method: 'POST', body: { ids } });

export const listMenuItems = (params: { categoryId?: string; search?: string } = {}) => {
  const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as string[][]).toString();
  return api<MenuItem[]>(`/api/admin/menu-items${q ? `?${q}` : ''}`);
};
export const createMenuItem = (body: Record<string, unknown>) => api<MenuItem>('/api/admin/menu-items', { method: 'POST', body });
export const updateMenuItem = (id: string, body: Record<string, unknown>) => api<MenuItem>(`/api/admin/menu-items/${id}`, { method: 'PATCH', body });
export const deleteMenuItem = (id: string) => api<null>(`/api/admin/menu-items/${id}`, { method: 'DELETE' });

export const listTables = () => api<Table[]>('/api/admin/tables');
export const createTable = (body: { number: number; name?: string; capacity?: number }) => api<Table>('/api/admin/tables', { method: 'POST', body });
export const updateTable = (id: string, body: Record<string, unknown>) => api<Table>(`/api/admin/tables/${id}`, { method: 'PATCH', body });
export const deleteTable = (id: string) => api<null>(`/api/admin/tables/${id}`, { method: 'DELETE' });
export const setTableStatus = (id: string, status: string) => api<Table>(`/api/admin/tables/${id}/status`, { method: 'PATCH', body: { status } });
export const regenerateQr = (id: string) => api<Table>(`/api/admin/tables/${id}/regenerate-token`, { method: 'POST' });

export const getSettings = () => api<Settings>('/api/admin/settings');
export const updateSettings = (body: Partial<Settings>) => api<Settings>('/api/admin/settings', { method: 'PATCH', body });

export const listUsers = () => api<AuthUser[]>('/api/admin/users');
export const createUser = (body: Record<string, unknown>) => api<AuthUser>('/api/admin/users', { method: 'POST', body });
export const updateUser = (id: string, body: Record<string, unknown>) => api<AuthUser>(`/api/admin/users/${id}`, { method: 'PATCH', body });
export const deleteUser = (id: string) => api<null>(`/api/admin/users/${id}`, { method: 'DELETE' });

export const todayStats = () =>
  api<{ ordersToday: number; revenueToday: number; activeTables: number; topItems: { name: string; quantity: number }[] }>(
    '/api/orders/stats/today',
  );

export const reportSummary = (from?: string, to?: string) => {
  const q = new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) }).toString();
  return api<{
    totals: { orders: number; revenue: number; averageOrder: number };
    daily: { date: string; orders: number; revenue: number }[];
    items: { name: string; quantity: number; revenue: number }[];
  }>(`/api/admin/reports/summary?${q}`);
};

/* ---------- Orders (ADMIN / STAFF / CHEF) ---------- */
export const listOrders = (params: Record<string, string | number | boolean | undefined> = {}) => {
  const q = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => [k, String(v)]),
  ).toString();
  return api<Order[]>(`/api/orders${q ? `?${q}` : ''}`);
};

export const setOrderStatus = (id: string, status: OrderStatus, cancelReason?: string) =>
  api<Order>(`/api/orders/${id}/status`, { method: 'PATCH', body: { status, cancelReason } });

export const setOrderItemStatus = (orderId: string, itemId: string, status: OrderItemStatus) =>
  api<Order>(`/api/orders/${orderId}/items/${itemId}/status`, { method: 'PATCH', body: { status } });

export const setItemAvailability = (id: string, isAvailable: boolean) =>
  api<MenuItem>(`/api/orders/menu-items/${id}/availability`, { method: 'PATCH', body: { isAvailable } });

/* ---------- Chef ---------- */
export const getKitchenBoard = () => api<Order[]>('/api/chef/board');
export const getKitchenHistory = () => api<Order[]>('/api/chef/history');

export const uploadImage = (file: File) => {
  const fd = new FormData();
  fd.append('file', file);
  return api<{ url: string }>('/api/admin/uploads', { method: 'POST', body: fd });
};