const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://localhost:8080/api' : 'https://retail-store-k6pr.onrender.com/api')
).replace(/\/$/, '');

export type UserRole = 'admin' | 'manager' | 'staff';

export interface UserInfo {
  id?: number;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  storeId?: number;
  status?: string;
  token?: string;
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

export interface Store {
  id: number;
  name: string;
  adminEmail?: string;
  createdAt?: string;
}

export const ROLES: Record<UserRole, RolePermissions> = {
  admin: {
    label: 'Admin',
    description: 'Full system access - users, suppliers, promotions, audit logs, and all modules',
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

function getStoredToken(): string | null {
  try {
    const raw = localStorage.getItem('retailstore-user');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserInfo;
    return parsed.token || null;
  } catch {
    return null;
  }
}

function authHeaders(): HeadersInit {
  const token = getStoredToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

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

export async function verifyOtpApi(email: string, otp: string): Promise<any> {
  const res = await fetch(`${API_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || 'Invalid OTP');
  }
  return await res.json();
}

export async function setNewPasswordApi(email: string, otp: string, newPassword: string): Promise<any> {
  const res = await fetch(`${API_BASE}/auth/set-new-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp, newPassword }),
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || 'Failed to reset password');
  }
  return await res.json();
}

export async function fetchStoresFromApi(): Promise<Store[]> {
  try {
    const res = await fetch(`${API_BASE}/stores/public`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Error fetching stores:', err);
  }
  return [];
}

export async function deleteStoreApi(storeId: number): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/stores/${storeId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return res.ok;
  } catch (err) {
    console.error('Error deleting store:', err);
    return false;
  }
}

export async function updateProfileApi(name: string, email: string): Promise<UserInfo> {
  const res = await fetch(`${API_BASE}/auth/update-profile`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ name, email }),
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || 'Failed to update profile');
  }
  return await res.json() as UserInfo;
}

export async function updatePasswordApi(currentPassword: string, newPassword: string): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/update-password`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || 'Failed to update password');
  }
}

export function getPendingCountForAdmin(_adminEmail: string): number {
  return 0;
}

export function canAccessPage(role: UserRole, page: string): boolean {
  return ROLES[role].allowedPages.includes(page);
}

export function canEditModule(role: UserRole, module: keyof RolePermissions['canEdit']): boolean {
  return ROLES[role].canEdit[module];
}

export function canDeleteInModule(role: UserRole, module: keyof RolePermissions['canDelete']): boolean {
  return ROLES[role].canDelete[module];
}
