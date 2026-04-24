import type { Product, Customer, Order, DashboardStats, AnalyticsData } from '../types';
import { mockProducts, mockCustomers, mockOrders } from './mockData';

// Simulated API delay for realistic UX
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const API_BASE = 'https://retail-store-k6pr.onrender.com/api';

// Helper to safely call API with fallback to mock data
async function apiFetch<T>(path: string, fallback: () => T, delayMs = 400): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${path}`);
    if (res.ok) {
      const data = await res.json();
      return data as T;
    }
  } catch {
    // Backend not available — fall through to mock data
  }
  await delay(delayMs);
  return fallback();
}

// ---- Products ----
export async function fetchProducts(): Promise<Product[]> {
  return apiFetch('/products', () => [...mockProducts]);
}

export async function createProduct(product: Partial<Product>): Promise<Product> {
  try {
    const res = await fetch(`${API_BASE}/products`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(product) });
    if (res.ok) return await res.json();
  } catch { /* fallback */ }
  await delay(300);
  const newProd = { ...product, id: Date.now(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Product;
  mockProducts.push(newProd);
  logAction('System User', 'Created new product', newProd.name || 'Unknown', 'info', 'Plus');
  return newProd;
}

export async function updateProduct(id: number, product: Partial<Product>): Promise<Product> {
  try {
    const res = await fetch(`${API_BASE}/products/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(product) });
    if (res.ok) return await res.json();
  } catch { /* fallback */ }
  await delay(300);
  const existing = mockProducts.find(p => p.id === id);
  if (existing) {
    Object.assign(existing, product, { updatedAt: new Date().toISOString() });
    logAction('System User', 'Updated product', existing.name, 'warning', 'Edit');
  }
  return existing as Product;
}

export async function deleteProduct(id: number): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/products/${id}`, { method: 'DELETE' });
    if (res.ok) return;
  } catch { /* fallback */ }
  await delay(300);
  const index = mockProducts.findIndex(p => p.id === id);
  if (index !== -1) {
    logAction('System User', 'Deleted product', mockProducts[index].name, 'critical', 'Trash2');
    mockProducts.splice(index, 1);
  }
}

// ---- Customers ----
export async function fetchCustomers(): Promise<Customer[]> {
  return apiFetch('/customers', () => [...mockCustomers]);
}

export async function createCustomer(customer: Partial<Customer>): Promise<Customer> {
  try {
    const res = await fetch(`${API_BASE}/customers`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(customer) });
    if (res.ok) return await res.json();
  } catch { /* fallback */ }
  await delay(300);
  const newCust = { ...customer, id: Date.now() } as Customer;
  mockCustomers.push(newCust);
  logAction('System User', 'Created new customer', newCust.name || 'Unknown', 'info', 'Plus');
  return newCust;
}

// ---- Orders ----
export async function fetchOrders(): Promise<Order[]> {
  return apiFetch('/orders', () => [...mockOrders]);
}

export async function createOrder(order: Partial<Order>): Promise<Order> {
  try {
    const res = await fetch(`${API_BASE}/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(order) });
    if (res.ok) return await res.json();
  } catch { /* fallback */ }
  await delay(300);
  const newOrder = { ...order, id: Date.now() } as Order;
  mockOrders.unshift(newOrder as any);
  logAction('System User', 'Created order', `Order #${newOrder.id}`, 'info', 'Plus');
  return newOrder;
}

export async function updateOrderStatus(id: number, status: Order['status']): Promise<Order> {
  try {
    const res = await fetch(`${API_BASE}/orders/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    if (res.ok) return await res.json();
  } catch { /* fallback */ }
  await delay(300);
  const existing = mockOrders.find(o => o.id === id);
  if (existing) {
    existing.status = status;
    logAction('System User', 'Updated order status', `Order #${id} → ${status}`, 'warning', 'Edit');
  }
  return existing!;
}

// ---- Dashboard ----
export async function fetchDashboardStats(): Promise<DashboardStats> {
  return apiFetch('/dashboard/stats', () => {
    const validOrders = mockOrders.filter(o => o.status !== 'Cancelled');
    const totalSales = validOrders.reduce((acc, o) => acc + o.totalAmount, 0);
    const totalOrders = mockOrders.length;
    const totalCustomers = mockCustomers.length;

    // Simplistic monthly logic
    const thisMonth = new Date().toISOString().slice(0, 7);
    const thisMonthOrders = validOrders.filter(o => o.orderDate.startsWith(thisMonth));
    const monthlyRevenue = thisMonthOrders.reduce((acc, o) => acc + o.totalAmount, 0);

    return {
      totalSales,
      totalOrders,
      totalCustomers,
      monthlyRevenue,
      salesGrowth: 12.5,
      orderGrowth: 8.4,
      customerGrowth: 5.2,
      revenueGrowth: 15.3,
    };
  }, 300);
}

// ---- Analytics ----
export async function fetchAnalytics(): Promise<AnalyticsData> {
  return apiFetch('/analytics', () => {
    const validOrders = mockOrders.filter(o => o.status !== 'Cancelled');

    const productSales: Record<number, { name: string; sales: number; revenue: number }> = {};
    validOrders.forEach(o => {
      o.items.forEach(item => {
        if (!productSales[item.productId]) {
          const p = mockProducts.find(x => x.id === item.productId);
          productSales[item.productId] = { name: p ? p.name : item.productName, sales: 0, revenue: 0 };
        }
        productSales[item.productId].sales += item.quantity;
        productSales[item.productId].revenue += item.totalPrice;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .map((p, i) => ({ ...p, rank: i + 1 }))
      .slice(0, 5);

    const customerStats: Record<number, { name: string; totalOrders: number; totalSpent: number }> = {};
    validOrders.forEach(o => {
      if (!customerStats[o.customerId]) {
        const c = mockCustomers.find(x => x.id === o.customerId);
        customerStats[o.customerId] = { name: c ? c.name : o.customerName, totalOrders: 0, totalSpent: 0 };
      }
      customerStats[o.customerId].totalOrders += 1;
      customerStats[o.customerId].totalSpent += o.totalAmount;
    });

    const topCustomers = Object.values(customerStats)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .map((c, i) => ({ id: i + 1, ...c, rank: i + 1 }))
      .slice(0, 5);

    const catCounts: Record<string, number> = {};
    mockProducts.forEach(p => { catCounts[p.category] = (catCounts[p.category] || 0) + 1; });
    const categoryDistribution = Object.entries(catCounts).map(([category, count]) => ({
      category, count, percentage: Math.round((count / mockProducts.length) * 100)
    }));

    const monthsObj: Record<string, { sales: number; orders: number }> = {};
    validOrders.forEach(o => {
      const month = o.orderDate.slice(0, 7);
      if (!monthsObj[month]) monthsObj[month] = { sales: 0, orders: 0 };
      monthsObj[month].orders += 1;
      monthsObj[month].sales += o.totalAmount;
    });

    const salesTrends = Object.entries(monthsObj)
      .map(([month, data]) => ({ month, sales: data.sales, orders: data.orders }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const monthlyRevenue = salesTrends.map(t => ({ month: t.month, revenue: t.sales, growth: 5.5 }));

    const inventoryAlerts = mockProducts
      .filter(p => p.stockQuantity < 20)
      .map(p => ({
        productId: p.id,
        productName: p.name,
        currentStock: p.stockQuantity,
        threshold: 20,
        status: (p.stockQuantity === 0 ? 'Critical' : 'Low') as 'Critical' | 'Low' | 'Normal'
      })).slice(0, 5);

    return {
      salesTrends,
      topProducts,
      categoryDistribution,
      topCustomers,
      monthlyRevenue,
      inventoryAlerts,
    };
  }, 400);
}

// ---- CSV Export ----
export function exportToCSV(data: Record<string, unknown>[], filename: string) {
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

// ---- Audit Logs ----
export type Severity = 'info' | 'warning' | 'critical';
export interface LogEntry {
  id: number; user: string; action: string; target: string;
  severity: Severity; timestamp: string; iconStr: string;
}

const mockAuditLogs: LogEntry[] = [
  { id: 1, user: 'Raja Adhikary', action: 'Updated product price', target: 'Running Shoes - Pro Series (₹129.99 → ₹119.99)', severity: 'warning', timestamp: '2025-04-24 08:45:12', iconStr: 'Edit' },
  { id: 2, user: 'Priya Sharma', action: 'Deleted order', target: 'Order #1007', severity: 'critical', timestamp: '2025-04-24 08:30:05', iconStr: 'Trash2' },
  { id: 3, user: 'Amit Kumar', action: 'Logged in', target: 'Staff portal', severity: 'info', timestamp: '2025-04-24 08:15:00', iconStr: 'LogIn' },
  { id: 4, user: 'Raja Adhikary', action: 'Created new product', target: 'Bamboo Water Bottle', severity: 'info', timestamp: '2025-04-24 07:55:30', iconStr: 'Plus' },
];
// ---- Suppliers ----
export interface Supplier { id: number; name: string; contact: string; email: string; phone: string; address: string; products: number[]; }

const mockSuppliers: Supplier[] = [
  { id: 1, name: 'TechWorld Electronics', contact: 'Rajesh Kumar', email: 'rajesh@techworld.com', phone: '+91 98765 11111', address: 'Electronic City, Bangalore', products: [1, 5, 10, 12] },
  { id: 2, name: 'GreenLeaf Organics', contact: 'Meera Joshi', email: 'meera@greenleaf.com', phone: '+91 98765 22222', address: 'Anand Niketan, Delhi', products: [2, 11] },
  { id: 3, name: 'SportsPro India', contact: 'Anil Verma', email: 'anil@sportspro.in', phone: '+91 98765 33333', address: 'Koramangala, Bangalore', products: [3, 7] },
  { id: 4, name: 'HomeEssentials Co.', contact: 'Sunita Patel', email: 'sunita@homeess.com', phone: '+91 98765 44444', address: 'Andheri, Mumbai', products: [4, 8] },
];

export async function fetchSuppliers(): Promise<Supplier[]> {
  return apiFetch('/suppliers', () => [...mockSuppliers], 300);
}

export async function createSupplier(supplier: Partial<Supplier>): Promise<Supplier> {
  await delay(300);
  const newSupp = { ...supplier, id: Date.now() } as Supplier;
  mockSuppliers.push(newSupp);
  logAction('System User', 'Created new supplier', newSupp.name || 'Unknown', 'info', 'Truck');
  return newSupp;
}

export async function updateSupplier(id: number, supplier: Partial<Supplier>): Promise<Supplier> {
  await delay(300);
  const existing = mockSuppliers.find(s => s.id === id);
  if (existing) {
    Object.assign(existing, supplier);
    logAction('System User', 'Updated supplier', existing.name, 'warning', 'Edit');
  }
  return existing!;
}

export async function deleteSupplier(id: number): Promise<void> {
  await delay(300);
  const index = mockSuppliers.findIndex(s => s.id === id);
  if (index !== -1) {
    logAction('System User', 'Deleted supplier', mockSuppliers[index].name, 'critical', 'Trash2');
    mockSuppliers.splice(index, 1);
  }
}
export function logAction(user: string, action: string, target: string, severity: Severity = 'info', iconStr: string = 'FileText') {
  const newLog: LogEntry = {
    id: Date.now(),
    user,
    action,
    target,
    severity,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    iconStr
  };
  mockAuditLogs.unshift(newLog);
}

export async function fetchAuditLogs(): Promise<LogEntry[]> {
  return apiFetch('/audit-logs', () => [...mockAuditLogs], 300);
}
