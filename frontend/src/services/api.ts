import type { Product, Customer, Order, DashboardStats, AnalyticsData } from '../types';

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://localhost:8080/api' : 'https://retail-store-k6pr.onrender.com/api')
).replace(/\/$/, '');

function getAuthToken(): string | null {
  try {
    const raw = localStorage.getItem('retailstore-user');
    if (!raw) return null;
    const user = JSON.parse(raw) as { token?: string };
    return user.token || null;
  } catch {
    return null;
  }
}

function buildHeaders(withJson = true): HeadersInit {
  const headers: Record<string, string> = {};
  if (withJson) headers['Content-Type'] = 'application/json';
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function buildUrl(path: string): string {
  return `${API_BASE}${path}`;
}

function friendlyApiError(status: number, serverMsg: string): string {
  if (serverMsg && !serverMsg.startsWith('{') && !serverMsg.startsWith('<') && serverMsg.length < 200) {
    return serverMsg;
  }
  if (status === 400) return 'The request was invalid. Please check your input and try again.';
  if (status === 401) return 'You are not authorized. Please log in again.';
  if (status === 403) return 'You do not have permission to perform this action.';
  if (status === 404) return 'The requested resource was not found.';
  if (status === 409) return 'A conflict occurred. The item may already exist.';
  if (status >= 500) return 'The server encountered an issue. Please try again in a moment.';
  return 'Request failed. Please try again.';
}

async function apiFetch<T>(path: string, fallback: () => T): Promise<T> {
  try {
    const res = await fetch(buildUrl(path), { headers: buildHeaders(false) });
    if (res.ok) return await res.json() as T;
    console.warn(`API ${path} returned ${res.status}`);
  } catch (err) {
    console.warn(`API ${path} failed:`, err);
  }
  return fallback();
}

async function apiPost<T>(path: string, body: any): Promise<T> {
  const res = await fetch(buildUrl(path), {
    method: 'POST',
    headers: buildHeaders(true),
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(friendlyApiError(res.status, errText));
  }
  const text = await res.text();
  if (!text) return {} as T;
  try { return JSON.parse(text) as T; }
  catch { return {} as T; }
}

async function apiPut<T>(path: string, body: any): Promise<T> {
  const res = await fetch(buildUrl(path), {
    method: 'PUT',
    headers: buildHeaders(true),
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(friendlyApiError(res.status, errText));
  }
  const text = await res.text();
  if (!text) return {} as T;
  try { return JSON.parse(text) as T; }
  catch { return {} as T; }
}

async function apiDelete(path: string): Promise<void> {
  const res = await fetch(buildUrl(path), {
    method: 'DELETE',
    headers: buildHeaders(false)
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(friendlyApiError(res.status, errText));
  }
}

async function apiPatch<T>(path: string, body: any): Promise<T> {
  const res = await fetch(buildUrl(path), {
    method: 'PATCH',
    headers: buildHeaders(true),
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(friendlyApiError(res.status, errText));
  }
  const text = await res.text();
  if (!text) return {} as T;
  try { return JSON.parse(text) as T; }
  catch { return {} as T; }
}

// ===================== PRODUCTS =====================
export async function fetchProducts(): Promise<Product[]> {
  const products = await apiFetch<any[]>('/products', () => []);
  return products.map(p => ({
    ...p,
    category: p.categoryName || p.category || 'Uncategorized',
    sku: p.sku || `SKU-${p.id || 0}`,
  }));
}

export async function createProduct(product: any): Promise<Product> {
  const body = {
    name: product.name,
    categoryName: product.category || product.categoryName,
    categoryId: product.categoryId,
    price: product.price,
    stockQuantity: product.stockQuantity || 0,
    description: product.description || '',
    imageUrl: product.imageUrl || ''
  };
  return apiPost('/products', body);
}

export { createProduct as saveProduct };

export async function updateProduct(id: number, product: any): Promise<Product> {
  const body = {
    name: product.name,
    categoryName: product.category || product.categoryName,
    categoryId: product.categoryId,
    price: product.price,
    stockQuantity: product.stockQuantity,
    description: product.description,
  };
  return apiPut(`/products/${id}`, body);
}

export async function deleteProduct(id: number): Promise<void> {
  return apiDelete(`/products/${id}`);
}

// ===================== CUSTOMERS =====================
export async function fetchCustomers(): Promise<Customer[]> {
  return apiFetch('/customers', () => []);
}

export async function createCustomer(customer: any): Promise<Customer> {
  return apiPost('/customers', customer);
}

export async function updateCustomer(id: number, customer: any): Promise<Customer> {
  return apiPut(`/customers/${id}`, customer);
}

// ===================== ORDERS =====================
export async function fetchOrders(): Promise<Order[]> {
  return apiFetch('/orders', () => []);
}

export async function createOrder(order: any): Promise<Order> {
  return apiPost('/orders', order);
}

export async function updateOrderStatus(id: number, status: string): Promise<any> {
  return apiPatch(`/orders/${id}/status`, { status });
}

// ===================== SUPPLIERS =====================
export interface Supplier {
  id: number;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  category: string;
  status: string;
}

export async function fetchSuppliers(): Promise<Supplier[]> {
  return apiFetch('/suppliers', () => []);
}

export async function createSupplier(s: any): Promise<Supplier> {
  return apiPost('/suppliers', s);
}

export async function updateSupplier(id: number, s: any): Promise<Supplier> {
  return apiPut(`/suppliers/${id}`, s);
}

export async function deleteSupplier(id: number): Promise<void> {
  return apiDelete(`/suppliers/${id}`);
}

// ===================== PURCHASE ORDERS =====================
export interface PurchaseOrder {
  id: number;
  supplierId: number;
  supplierName: string;
  productNames: string;
  totalAmount: number;
  status: string;
  orderDate: string;
  orderedQuantity?: number;
  receivedQuantity?: number;
}

export async function fetchPOs(): Promise<PurchaseOrder[]> {
  return apiFetch('/purchase-orders', () => []);
}

export async function createPO(po: any): Promise<PurchaseOrder> {
  return apiPost('/purchase-orders', po);
}

export async function updatePOStatus(id: number, status: string, receivedQuantity?: number): Promise<PurchaseOrder> {
  return apiPatch(`/purchase-orders/${id}/status`, { status, receivedQuantity });
}

export async function updateProductStock(productId: number, additionalStock: number): Promise<any> {
  return apiPatch(`/products/${productId}/stock`, { additionalStock });
}

// ===================== DUES =====================
export interface Due {
  id: number;
  type: string;
  entityId: number;
  entityName: string;
  contact: string;
  totalDue: number;
  status: string;
  lastOrderDate: string;
  pendingOrders: number;
}

export async function fetchDues(type?: string): Promise<Due[]> {
  const path = type ? `/dues?type=${encodeURIComponent(type)}` : '/dues';
  return apiFetch(path, () => []);
}

export async function createDue(due: any): Promise<Due> {
  return apiPost('/dues', due);
}

export async function payDue(id: number, amount: number): Promise<Due> {
  return apiPut(`/dues/${id}/pay`, { amount });
}

// ===================== AUDIT LOGS =====================
export type Severity = 'info' | 'warning' | 'critical';
export interface LogEntry {
  id: number;
  user: string;
  action: string;
  target: string;
  severity: string;
  timestamp: string;
  iconStr: string;
}

export async function fetchAuditLogs(): Promise<LogEntry[]> {
  return apiFetch('/audit-logs', () => []);
}

export async function logAction(log: any) {
  try { await apiPost('/audit-logs', log); } catch {}
}

// ===================== RETURNS =====================
export interface ReturnRequest {
  id: number;
  orderId: number;
  customerName: string;
  amount: number;
  reason: string;
  status: string;
  createdAt: string;
}

export async function fetchReturns(): Promise<ReturnRequest[]> {
  return apiFetch('/returns', () => []);
}

export async function createReturn(ret: any): Promise<ReturnRequest> {
  return apiPost('/returns', ret);
}

export async function updateReturnStatus(id: number, status: string): Promise<ReturnRequest> {
  return apiPut(`/returns/${id}/status`, { status });
}

// ===================== PROMOTIONS =====================
export interface Promotion {
  id: number;
  name: string;
  type: string;
  description: string;
  code: string;
  discountValue: number;
  status: string;
  startDate: string;
  endDate: string;
}

export async function fetchPromotions(): Promise<Promotion[]> {
  return apiFetch('/promotions', () => []);
}

export async function createPromotion(promo: any): Promise<Promotion> {
  return apiPost('/promotions', promo);
}

export async function findPromoByCode(code: string): Promise<Promotion | null> {
  const promos = await fetchPromotions();
  return promos.find(p => p.code?.toUpperCase() === code.toUpperCase() && p.status === 'Active') || null;
}

export async function deletePromotion(id: number): Promise<void> {
  return apiDelete(`/promotions/${id}`);
}

// ===================== CATEGORIES =====================
export interface Category {
  id: number;
  name: string;
  description: string;
}

export async function fetchCategories(): Promise<Category[]> {
  return apiFetch('/categories', () => []);
}

// ===================== USERS =====================
export async function fetchUsers(_storeId?: number): Promise<any[]> {
  return apiFetch('/auth/users', () => []);
}

export async function updateUserStatus(id: number, status: string): Promise<any> {
  return apiPut(`/auth/users/${id}/status`, { status });
}

export async function updateUserRole(id: number, role: string): Promise<any> {
  return apiPut(`/auth/users/${id}/role`, { role });
}

export async function deleteUser(id: number): Promise<void> {
  return apiDelete(`/auth/users/${id}`);
}

// ===================== DASHBOARD & ANALYTICS =====================
export async function fetchDashboardStats(): Promise<DashboardStats> {
  return apiFetch('/dashboard/stats', () => ({
    totalSales: 0, totalOrders: 0, totalCustomers: 0, monthlyRevenue: 0,
    salesGrowth: 0, orderGrowth: 0, customerGrowth: 0, revenueGrowth: 0,
  }));
}

export async function fetchAnalytics(): Promise<AnalyticsData> {
  try {
    const [products, orders] = await Promise.all([
      fetchProducts(), fetchOrders()
    ]);

    const monthMap: Record<string, { sales: number; orders: number }> = {};
    orders.forEach(o => {
      const month = o.orderDate?.substring(0, 7) || 'Unknown';
      if (!monthMap[month]) monthMap[month] = { sales: 0, orders: 0 };
      monthMap[month].sales += o.totalAmount || 0;
      monthMap[month].orders += 1;
    });
    const salesTrends = Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data }));

    const prodRevenue: Record<string, { name: string; sales: number; revenue: number }> = {};
    orders.forEach(o => {
      (o.items || []).forEach((item: any) => {
        const key = item.productName || `Product #${item.productId}`;
        if (!prodRevenue[key]) prodRevenue[key] = { name: key, sales: 0, revenue: 0 };
        prodRevenue[key].sales += item.quantity || 0;
        prodRevenue[key].revenue += item.totalPrice || 0;
      });
    });
    const topProducts = Object.values(prodRevenue)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((p, i) => ({ ...p, rank: i + 1 }));

    const catMap: Record<string, number> = {};
    products.forEach(p => {
      const cat = p.category || 'Uncategorized';
      catMap[cat] = (catMap[cat] || 0) + 1;
    });
    const total = products.length || 1;
    const categoryDistribution = Object.entries(catMap).map(([category, count]) => ({
      category, count, percentage: Math.round(count / total * 100)
    }));

    const custSpend: Record<number, { id: number; name: string; totalOrders: number; totalSpent: number }> = {};
    orders.forEach(o => {
      if (!custSpend[o.customerId]) custSpend[o.customerId] = { id: o.customerId, name: o.customerName, totalOrders: 0, totalSpent: 0 };
      custSpend[o.customerId].totalOrders += 1;
      custSpend[o.customerId].totalSpent += o.totalAmount || 0;
    });
    const topCustomers = Object.values(custSpend)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5)
      .map((c, i) => ({ ...c, rank: i + 1 }));

    const monthlyRevenue = salesTrends.map((m, i) => ({
      month: m.month,
      revenue: m.sales,
      growth: i === 0 ? 0 : Math.round((m.sales - salesTrends[i - 1].sales) / (salesTrends[i - 1].sales || 1) * 100 * 10) / 10
    }));

    const inventoryAlerts = products
      .filter(p => p.stockQuantity <= 20)
      .sort((a, b) => a.stockQuantity - b.stockQuantity)
      .slice(0, 5)
      .map(p => ({
        productId: p.id,
        productName: p.name,
        currentStock: p.stockQuantity,
        status: (p.stockQuantity <= 5 ? 'Critical' : 'Low') as 'Critical' | 'Low'
      }));

    return { salesTrends, topProducts, categoryDistribution, topCustomers, monthlyRevenue, inventoryAlerts };
  } catch {
    return {
      salesTrends: [], topProducts: [], categoryDistribution: [],
      topCustomers: [], monthlyRevenue: [], inventoryAlerts: []
    } as any;
  }
}

// ===================== CSV EXPORT =====================
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
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
