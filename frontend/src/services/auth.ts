// Role-Based Access Control System
const API_BASE = 'https://retail-store-k6pr.onrender.com/api';

export type UserRole = 'admin' | 'manager' | 'staff';

export interface UserInfo {
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  storeId?: number;
}

export interface RolePermissions {
  label: string;
  description: string;
  color: string;
  allowedPages: string[];
  canEdit: {
    products: boolean;
    customers: boolean;
    orders: boolean;
    dues: boolean;
    settings: boolean;
  };
  canDelete: {
    products: boolean;
    customers: boolean;
    orders: boolean;
  };
  canExport: boolean;
}

// Store entity
export interface Store {
  id: number;
  name: string;
  adminEmail: string;
  createdAt: string;
}

// Signup request for manager/staff
export interface SignupRequest {
  id: number;
  name: string;
  email: string;
  password: string;
  role: 'manager' | 'staff';
  storeId: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

// Role definitions with permissions
export const ROLES: Record<UserRole, RolePermissions> = {
  admin: {
    label: 'Admin',
    description: 'Full system access — users, suppliers, promotions, audit logs, and all modules',
    color: '#ef4444',
    allowedPages: ['dashboard', 'products', 'customers', 'orders', 'dues', 'analytics', 'settings', 'requests', 'customer-lookup', 'inventory-alerts', 'returns', 'user-management', 'audit-logs', 'suppliers', 'promotions', 'take-order'],
    canEdit: { products: true, customers: true, orders: true, dues: true, settings: true },
    canDelete: { products: true, customers: true, orders: true },
    canExport: true,
  },
  manager: {
    label: 'Manager',
    description: 'Manage inventory, returns, customers. View analytics and dues',
    color: '#f59e0b',
    allowedPages: ['dashboard', 'products', 'customers', 'orders', 'dues', 'analytics', 'settings', 'customer-lookup', 'inventory-alerts', 'returns', 'take-order', 'suppliers'],
    canEdit: { products: true, customers: false, orders: true, dues: false, settings: true },
    canDelete: { products: false, customers: false, orders: false },
    canExport: true,
  },
  staff: {
    label: 'Staff',
    description: 'Process orders, look up customers. Day-to-day store operations',
    color: '#3b82f6',
    allowedPages: ['dashboard', 'products', 'customers', 'orders', 'settings', 'customer-lookup', 'take-order'],
    canEdit: { products: false, customers: false, orders: true, dues: false, settings: false },
    canDelete: { products: false, customers: false, orders: false },
    canExport: false,
  },
};

// In-memory stores list (seeded with a default store)
export const STORES: Store[] = [
  { id: 1, name: 'RetailStore Main', adminEmail: 'admin@retailstore.com', createdAt: '2025-01-01' },
];

// In-memory signup requests
export const SIGNUP_REQUESTS: SignupRequest[] = [];

// Mock user accounts
export const USERS: Record<string, { password: string; user: UserInfo }> = {
  'admin@retailstore.com': {
    password: 'password123',
    user: { name: 'Raja Adhikary', email: 'admin@retailstore.com', role: 'admin', avatar: 'RA', storeId: 1 },
  },
  'manager@retailstore.com': {
    password: 'password123',
    user: { name: 'Priya Sharma', email: 'manager@retailstore.com', role: 'manager', avatar: 'PS', storeId: 1 },
  },
  'staff@retailstore.com': {
    password: 'password123',
    user: { name: 'Amit Kumar', email: 'staff@retailstore.com', role: 'staff', avatar: 'AK', storeId: 1 },
  },
};

// ---- Real Backend Auth ----
export async function loginApi(email: string, password: string): Promise<UserInfo> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || 'Failed to login');
  }
  
  return await res.json() as UserInfo;
}

export async function signupApi(data: any): Promise<any> {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || 'Failed to signup');
  }
  
  return await res.json();
}

export async function resetPasswordApi(email: string): Promise<any> {
  const res = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || 'Failed to reset password');
  }
  
  return await res.json();
}

// ---- Store Helpers (fetches from backend API) ----

export async function fetchStoresFromApi(): Promise<Store[]> {
  try {
    const res = await fetch(`${API_BASE}/stores`);
    if (res.ok) {
      return await res.json();
    }
    console.warn('Failed to fetch stores from API');
  } catch (err) {
    console.warn('Error fetching stores:', err);
  }
  return [];
}

export async function deleteStoreApi(storeId: number): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/stores/${storeId}`, { method: 'DELETE' });
    return res.ok;
  } catch (err) {
    console.error('Error deleting store:', err);
    return false;
  }
}

// Kept for backward compat but returns the in-memory array
// Use fetchStoresFromApi() for real data
export function getStores(): Store[] {
  return [...STORES];
}

export function getStoresByAdmin(adminEmail: string): Store[] {
  return STORES.filter(s => s.adminEmail === adminEmail);
}

let nextStoreId = 2;
let nextRequestId = 1;

export function createStore(name: string, adminEmail: string): Store {
  const store: Store = {
    id: nextStoreId++,
    name,
    adminEmail,
    createdAt: new Date().toISOString().split('T')[0],
  };
  STORES.push(store);
  return store;
}

export function getStoreName(storeId: number): string {
  const store = STORES.find(s => s.id === storeId);
  return store ? store.name : 'Unknown Store';
}

// ---- Signup Request Helpers ----
export function submitSignupRequest(
  name: string,
  email: string,
  password: string,
  role: 'manager' | 'staff',
  storeId: number
): SignupRequest {
  const request: SignupRequest = {
    id: nextRequestId++,
    name,
    email,
    password,
    role,
    storeId,
    status: 'pending',
    createdAt: new Date().toISOString().split('T')[0],
  };
  SIGNUP_REQUESTS.push(request);
  return request;
}

export function getRequestsForAdmin(adminEmail: string): SignupRequest[] {
  const adminStoreIds = STORES.filter(s => s.adminEmail === adminEmail).map(s => s.id);
  return SIGNUP_REQUESTS.filter(r => adminStoreIds.includes(r.storeId));
}

export function getPendingCountForAdmin(adminEmail: string): number {
  return getRequestsForAdmin(adminEmail).filter(r => r.status === 'pending').length;
}

export function approveRequest(requestId: number): UserInfo | null {
  const request = SIGNUP_REQUESTS.find(r => r.id === requestId);
  if (!request || request.status !== 'pending') return null;

  request.status = 'approved';

  // Create the user account
  const avatar = request.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  const newUser: UserInfo = {
    name: request.name,
    email: request.email,
    role: request.role,
    avatar,
    storeId: request.storeId,
  };
  USERS[request.email.toLowerCase()] = { password: request.password, user: newUser };
  return newUser;
}

export function rejectRequest(requestId: number): boolean {
  const request = SIGNUP_REQUESTS.find(r => r.id === requestId);
  if (!request || request.status !== 'pending') return false;
  request.status = 'rejected';
  return true;
}

export function isEmailPending(email: string): boolean {
  return SIGNUP_REQUESTS.some(r => r.email.toLowerCase() === email.toLowerCase() && r.status === 'pending');
}

// Helper to check page access
export function canAccessPage(role: UserRole, page: string): boolean {
  return ROLES[role].allowedPages.includes(page);
}

// Helper to check edit permission
export function canEditModule(role: UserRole, module: keyof RolePermissions['canEdit']): boolean {
  return ROLES[role].canEdit[module];
}

// Helper to check delete permission
export function canDeleteInModule(role: UserRole, module: keyof RolePermissions['canDelete']): boolean {
  return ROLES[role].canDelete[module];
}
