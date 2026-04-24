// ============================================
// Type Definitions for Retail Store Application
// ============================================

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stockQuantity: number;
  description?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  joinDate: string;
  totalOrders: number;
  totalSpent: number;
}

export interface Order {
  id: number;
  customerId: number;
  customerName: string;
  orderDate: string;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  totalAmount: number;
  items: OrderItem[];
  shippingAddress: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  productCount: number;
}

export interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  totalCustomers: number;
  monthlyRevenue: number;
  salesGrowth: number;
  orderGrowth: number;
  customerGrowth: number;
  revenueGrowth: number;
}

export interface SalesTrend {
  month: string;
  sales: number;
  orders: number;
}

export interface TopProduct {
  name: string;
  sales: number;
  revenue: number;
  rank: number;
}

export interface CategoryDistribution {
  category: string;
  count: number;
  percentage: number;
}

export interface TopCustomer {
  id: number;
  name: string;
  totalOrders: number;
  totalSpent: number;
  rank: number;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  growth: number;
}

export interface InventoryAlert {
  productId: number;
  productName: string;
  currentStock: number;
  status: 'Critical' | 'Low' | 'Normal';
}

export interface AnalyticsData {
  salesTrends: SalesTrend[];
  topProducts: TopProduct[];
  categoryDistribution: CategoryDistribution[];
  topCustomers: TopCustomer[];
  monthlyRevenue: MonthlyRevenue[];
  inventoryAlerts: InventoryAlert[];
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  avatar?: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  key: string;
  direction: SortDirection;
}
