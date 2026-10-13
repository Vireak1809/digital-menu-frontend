export type Role = 'ADMIN' | 'STAFF' | 'CHEF';
export type OrderStatus = 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'SERVED' | 'COMPLETED' | 'CANCELLED';
export type OrderItemStatus = 'PENDING' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED';
export type TableStatus = 'FREE' | 'OCCUPIED' | 'RESERVED';

export interface AuthUser { id: string; name: string; email: string; role: Role; isActive: boolean }

export interface Category { id: string; name: string; image?: string | null; sortOrder: number; isActive: boolean }

export interface MenuItem {
  id: string; categoryId: string; name: string; description?: string | null;
  price: number; image?: string | null; isAvailable: boolean;
  prepTime: number; tags: string[]; sortOrder: number;
  category?: { id: string; name: string };
}

export interface Table {
  id: string; number: number; name?: string | null; qrToken: string;
  status: TableStatus; capacity: number;
  orders?: { id: string; orderNumber: string; status: OrderStatus; totalAmount: number }[];
}

export interface OrderItem {
  id: string; menuItemId: string; name: string; quantity: number;
  unitPrice: number; note?: string | null; itemStatus: OrderItemStatus;
}

export interface Order {
  id: string; orderNumber: string; tableId: string;
  table: { id: string; number: number; name?: string | null };
  customerName?: string | null; customerPhone?: string | null;
  status: OrderStatus; subtotal: number; taxAmount: number; serviceAmount: number;
  totalAmount: number; note?: string | null; cancelReason?: string | null;
  items: OrderItem[]; createdAt: string; updatedAt: string;
}

export interface Settings {
  id: string; restaurantName: string; logo?: string | null; currency: string;
  taxPercent: number; serviceChargePercent: number; receiptFooter: string;
}

export interface ApiEnvelope<T> { success: boolean; data: T; message: string; errors: unknown }