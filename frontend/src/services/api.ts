import type { Product, Customer, Order, DashboardStats, AnalyticsData } from '../types';
import { mockProducts, mockCustomers, mockOrders } from './mockData';

const API_BASE = 'https://retail-store-k6pr.onrender.com/api';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function apiFetch<T>(path: string, fallback: () => T, delayMs = 400): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${path}`);
    if (res.ok) return await res.json() as T;
  } catch {}
  await delay(delayMs);
  return fallback();
}

async function apiPost<T>(path: string, body: any): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error('Failed to post data');
  return await res.json() as T;
}

// ---- Products ----
export async function fetchProducts(): Promise<Product[]> {
  return apiFetch('/products', () => [...mockProducts]);
}

export async function saveProduct(product: Partial<Product>): Promise<Product> {
  try {
    return await apiPost('/products', product);
  } catch {
    const newProd = { ...product, id: Date.now() } as Product;
    mockProducts.unshift(newProd);
    return newProd;
  }
}

// ---- Customers ----
export async function fetchCustomers(): Promise<Customer[]> {
  return apiFetch('/customers', () => [...mockCustomers]);
}

// ---- Orders ----
export async function fetchOrders(): Promise<Order[]> {
  return apiFetch('/orders', () => [...mockOrders]);
}

export async function createOrder(order: any): Promise<Order> {
  try {
    return await apiPost('/orders', order);
  } catch {
    const newOrder = { ...order, id: Date.now(), orderDate: new Date().toISOString() } as Order;
    mockOrders.unshift(newOrder);
    return newOrder;
  }
}

export async function updateOrderStatus(id: number, status: string): Promise<any> {
  const res = await fetch(`${API_BASE}/orders/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  return res.ok ? await res.json() : null;
}

// ---- Suppliers & POs ----
export interface Supplier { id: number; name: string; contactPerson: string; email: string; phone: string; category: string; status: string; }
export interface PurchaseOrder { id: number; supplierId: number; supplierName: string; productNames: string; totalAmount: number; status: string; orderDate: string; }

export async function fetchSuppliers(): Promise<Supplier[]> {
  return apiFetch('/suppliers', () => []);
}

export async function createSupplier(s: any): Promise<Supplier> {
  return apiPost('/suppliers', s);
}

export async function fetchPOs(): Promise<PurchaseOrder[]> {
  return apiFetch('/purchase-orders', () => []);
}

export async function createPO(po: any): Promise<PurchaseOrder> {
  return apiPost('/purchase-orders', po);
}

// ---- Dues ----
export interface Due { id: number; type: 'CUSTOMER' | 'SUPPLIER'; entityId: number; entityName: string; totalDue: number; status: string; lastOrderDate: string; }

export async function fetchDues(type?: string): Promise<Due[]> {
  return apiFetch(`/dues${type ? '?type=' + type : ''}`, () => []);
}

export async function createDue(due: any): Promise<Due> {
  return apiPost('/dues', due);
}

// ---- Audit Logs ----
export interface LogEntry { id: number; user: string; action: string; target: string; severity: string; timestamp: string; iconStr: string; }

export async function fetchAuditLogs(): Promise<LogEntry[]> {
  return apiFetch('/audit-logs', () => []);
}

export async function logAction(log: any) {
  try { await apiPost('/audit-logs', log); } catch {}
}

// ---- Returns ----
export interface ReturnRequest { id: number; orderId: number; customerName: string; amount: number; reason: string; status: string; createdAt: string; }

export async function fetchReturns(): Promise<ReturnRequest[]> {
  return apiFetch('/returns', () => []);
}

export async function createReturn(ret: any): Promise<ReturnRequest> {
  return apiPost('/returns', ret);
}

// ---- Analytics & Dashboard ----
export async function fetchDashboardStats(): Promise<DashboardStats> {
  return apiFetch('/dashboard/stats', () => ({} as any));
}

export async function fetchAnalytics(): Promise<AnalyticsData> {
  return apiFetch('/analytics', () => ({} as any));
}

// ---- CSV Export ----
export function exportToCSV(data: any[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  for (const row of data) {
    csvRows.push(headers.map(h => {
      const val = row[h];
      const str = typeof val === 'string' ? val : String(val ?? '');
      return `"${str.replace(/"/g, '""')}"`;
    }).join(','));
  }
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${filename}.csv`; a.click();
  URL.revokeObjectURL(url);
}
