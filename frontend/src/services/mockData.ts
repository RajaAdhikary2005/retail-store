import type { Product, Customer, Order, DashboardStats, SalesTrend, TopProduct, CategoryDistribution, TopCustomer, MonthlyRevenue, InventoryAlert } from '../types';

export const mockProducts: Product[] = [
  { id: 1, name: 'Wireless Bluetooth Headphones', category: 'Electronics', price: 79.99, stockQuantity: 145, description: 'Premium sound quality', imageUrl: '', createdAt: '2025-01-15', updatedAt: '2025-03-10' },
  { id: 2, name: 'Organic Green Tea (50 bags)', category: 'Groceries', price: 12.49, stockQuantity: 320, description: 'Natural organic tea', imageUrl: '', createdAt: '2025-01-20', updatedAt: '2025-03-12' },
  { id: 3, name: 'Running Shoes - Pro Series', category: 'Footwear', price: 129.99, stockQuantity: 67, description: 'Lightweight performance shoes', imageUrl: '', createdAt: '2025-02-01', updatedAt: '2025-03-15' },
  { id: 4, name: 'Stainless Steel Water Bottle', category: 'Home & Kitchen', price: 24.99, stockQuantity: 210, description: 'Insulated 750ml bottle', imageUrl: '', createdAt: '2025-02-05', updatedAt: '2025-03-18' },
  { id: 5, name: 'LED Desk Lamp', category: 'Electronics', price: 45.99, stockQuantity: 89, description: 'Adjustable brightness', imageUrl: '', createdAt: '2025-02-10', updatedAt: '2025-03-20' },
  { id: 6, name: 'Cotton T-Shirt Pack (3)', category: 'Clothing', price: 34.99, stockQuantity: 5, description: 'Premium cotton blend', imageUrl: '', createdAt: '2025-02-15', updatedAt: '2025-03-22' },
  { id: 7, name: 'Yoga Mat - Premium', category: 'Sports', price: 39.99, stockQuantity: 156, description: 'Non-slip surface', imageUrl: '', createdAt: '2025-02-20', updatedAt: '2025-03-25' },
  { id: 8, name: 'Ceramic Coffee Mug Set', category: 'Home & Kitchen', price: 29.99, stockQuantity: 3, description: 'Set of 4 mugs', imageUrl: '', createdAt: '2025-03-01', updatedAt: '2025-03-28' },
  { id: 9, name: 'Backpack - Urban Style', category: 'Accessories', price: 59.99, stockQuantity: 78, description: 'Water-resistant', imageUrl: '', createdAt: '2025-03-05', updatedAt: '2025-04-01' },
  { id: 10, name: 'Smartphone Case - Clear', category: 'Electronics', price: 15.99, stockQuantity: 450, description: 'Shockproof design', imageUrl: '', createdAt: '2025-03-10', updatedAt: '2025-04-05' },
  { id: 11, name: 'Almond Butter Organic', category: 'Groceries', price: 9.99, stockQuantity: 0, description: 'Natural spread', imageUrl: '', createdAt: '2025-03-12', updatedAt: '2025-04-08' },
  { id: 12, name: 'Wireless Charging Pad', category: 'Electronics', price: 29.99, stockQuantity: 112, description: 'Fast charging 15W', imageUrl: '', createdAt: '2025-03-15', updatedAt: '2025-04-10' },
];

export const mockCustomers: Customer[] = [
  { id: 1, name: 'Arjun Sharma', email: 'arjun.sharma@email.com', phone: '+91 98765 43210', address: '42 MG Road', city: 'Bangalore', state: 'Karnataka', zipCode: '560001', joinDate: '2024-06-15', totalOrders: 12, totalSpent: 1456.78 },
  { id: 2, name: 'Priya Patel', email: 'priya.patel@email.com', phone: '+91 87654 32109', address: '15 Marine Drive', city: 'Mumbai', state: 'Maharashtra', zipCode: '400001', joinDate: '2024-07-20', totalOrders: 8, totalSpent: 987.50 },
  { id: 3, name: 'Rahul Gupta', email: 'rahul.gupta@email.com', phone: '+91 76543 21098', address: '78 Connaught Place', city: 'New Delhi', state: 'Delhi', zipCode: '110001', joinDate: '2024-08-10', totalOrders: 15, totalSpent: 2345.90 },
  { id: 4, name: 'Sneha Reddy', email: 'sneha.reddy@email.com', phone: '+91 65432 10987', address: '23 Jubilee Hills', city: 'Hyderabad', state: 'Telangana', zipCode: '500033', joinDate: '2024-09-05', totalOrders: 6, totalSpent: 678.25 },
  { id: 5, name: 'Vikram Singh', email: 'vikram.singh@email.com', phone: '+91 54321 09876', address: '56 Park Street', city: 'Kolkata', state: 'West Bengal', zipCode: '700016', joinDate: '2024-10-12', totalOrders: 20, totalSpent: 3567.40 },
  { id: 6, name: 'Ananya Iyer', email: 'ananya.iyer@email.com', phone: '+91 43210 98765', address: '89 Anna Nagar', city: 'Chennai', state: 'Tamil Nadu', zipCode: '600040', joinDate: '2024-11-08', totalOrders: 3, totalSpent: 234.99 },
  { id: 7, name: 'Karan Mehta', email: 'karan.mehta@email.com', phone: '+91 32109 87654', address: '12 SG Highway', city: 'Ahmedabad', state: 'Gujarat', zipCode: '380015', joinDate: '2024-12-01', totalOrders: 9, totalSpent: 1123.60 },
  { id: 8, name: 'Divya Nair', email: 'divya.nair@email.com', phone: '+91 21098 76543', address: '34 MG Road', city: 'Kochi', state: 'Kerala', zipCode: '682011', joinDate: '2025-01-15', totalOrders: 5, totalSpent: 567.80 },
];

export const mockOrders: Order[] = [
  { id: 1001, customerId: 3, customerName: 'Rahul Gupta', orderDate: '2025-04-20', status: 'Delivered', totalAmount: 259.97, items: [{ id: 1, orderId: 1001, productId: 1, productName: 'Wireless Bluetooth Headphones', quantity: 1, unitPrice: 79.99, totalPrice: 79.99 }, { id: 2, orderId: 1001, productId: 3, productName: 'Running Shoes - Pro Series', quantity: 1, unitPrice: 129.99, totalPrice: 129.99 }, { id: 3, orderId: 1001, productId: 10, productName: 'Smartphone Case - Clear', quantity: 1, unitPrice: 15.99, totalPrice: 15.99 }], shippingAddress: '78 Connaught Place, New Delhi' },
  { id: 1002, customerId: 5, customerName: 'Vikram Singh', orderDate: '2025-04-19', status: 'Shipped', totalAmount: 154.97, items: [{ id: 4, orderId: 1002, productId: 5, productName: 'LED Desk Lamp', quantity: 1, unitPrice: 45.99, totalPrice: 45.99 }, { id: 5, orderId: 1002, productId: 7, productName: 'Yoga Mat - Premium', quantity: 1, unitPrice: 39.99, totalPrice: 39.99 }, { id: 6, orderId: 1002, productId: 9, productName: 'Backpack - Urban Style', quantity: 1, unitPrice: 59.99, totalPrice: 59.99 }], shippingAddress: '56 Park Street, Kolkata' },
  { id: 1003, customerId: 1, customerName: 'Arjun Sharma', orderDate: '2025-04-18', status: 'Processing', totalAmount: 94.97, items: [{ id: 7, orderId: 1003, productId: 6, productName: 'Cotton T-Shirt Pack (3)', quantity: 1, unitPrice: 34.99, totalPrice: 34.99 }, { id: 8, orderId: 1003, productId: 4, productName: 'Stainless Steel Water Bottle', quantity: 1, unitPrice: 24.99, totalPrice: 24.99 }, { id: 9, orderId: 1003, productId: 8, productName: 'Ceramic Coffee Mug Set', quantity: 1, unitPrice: 29.99, totalPrice: 29.99 }], shippingAddress: '42 MG Road, Bangalore' },
  { id: 1004, customerId: 2, customerName: 'Priya Patel', orderDate: '2025-04-17', status: 'Pending', totalAmount: 172.47, items: [{ id: 10, orderId: 1004, productId: 3, productName: 'Running Shoes - Pro Series', quantity: 1, unitPrice: 129.99, totalPrice: 129.99 }, { id: 11, orderId: 1004, productId: 2, productName: 'Organic Green Tea (50 bags)', quantity: 2, unitPrice: 12.49, totalPrice: 24.98 }, { id: 12, orderId: 1004, productId: 10, productName: 'Smartphone Case - Clear', quantity: 1, unitPrice: 15.99, totalPrice: 15.99 }], shippingAddress: '15 Marine Drive, Mumbai' },
  { id: 1005, customerId: 7, customerName: 'Karan Mehta', orderDate: '2025-04-16', status: 'Delivered', totalAmount: 109.98, items: [{ id: 13, orderId: 1005, productId: 1, productName: 'Wireless Bluetooth Headphones', quantity: 1, unitPrice: 79.99, totalPrice: 79.99 }, { id: 14, orderId: 1005, productId: 12, productName: 'Wireless Charging Pad', quantity: 1, unitPrice: 29.99, totalPrice: 29.99 }], shippingAddress: '12 SG Highway, Ahmedabad' },
  { id: 1006, customerId: 4, customerName: 'Sneha Reddy', orderDate: '2025-04-15', status: 'Shipped', totalAmount: 79.98, items: [{ id: 15, orderId: 1006, productId: 7, productName: 'Yoga Mat - Premium', quantity: 2, unitPrice: 39.99, totalPrice: 79.98 }], shippingAddress: '23 Jubilee Hills, Hyderabad' },
  { id: 1007, customerId: 8, customerName: 'Divya Nair', orderDate: '2025-04-14', status: 'Cancelled', totalAmount: 45.99, items: [{ id: 16, orderId: 1007, productId: 5, productName: 'LED Desk Lamp', quantity: 1, unitPrice: 45.99, totalPrice: 45.99 }], shippingAddress: '34 MG Road, Kochi' },
  { id: 1008, customerId: 6, customerName: 'Ananya Iyer', orderDate: '2025-04-13', status: 'Delivered', totalAmount: 189.96, items: [{ id: 17, orderId: 1008, productId: 9, productName: 'Backpack - Urban Style', quantity: 1, unitPrice: 59.99, totalPrice: 59.99 }, { id: 18, orderId: 1008, productId: 3, productName: 'Running Shoes - Pro Series', quantity: 1, unitPrice: 129.99, totalPrice: 129.99 }], shippingAddress: '89 Anna Nagar, Chennai' },
];

export const mockDashboardStats: DashboardStats = { totalSales: 284750, totalOrders: 1847, totalCustomers: 892, monthlyRevenue: 42350, salesGrowth: 12.5, orderGrowth: 8.3, customerGrowth: 15.2, revenueGrowth: 10.8 };

export const mockSalesTrends: SalesTrend[] = [
  { month: 'Oct', sales: 28400, orders: 156 }, { month: 'Nov', sales: 35200, orders: 198 },
  { month: 'Dec', sales: 42100, orders: 245 }, { month: 'Jan', sales: 31800, orders: 178 },
  { month: 'Feb', sales: 38500, orders: 212 }, { month: 'Mar', sales: 41200, orders: 234 },
  { month: 'Apr', sales: 42350, orders: 241 },
];

export const mockTopProducts: TopProduct[] = [
  { name: 'Running Shoes', sales: 342, revenue: 44470, rank: 1 },
  { name: 'BT Headphones', sales: 289, revenue: 23110, rank: 2 },
  { name: 'Backpack Urban', sales: 234, revenue: 14034, rank: 3 },
  { name: 'LED Desk Lamp', sales: 198, revenue: 9106, rank: 4 },
  { name: 'Yoga Mat', sales: 176, revenue: 7038, rank: 5 },
];

export const mockCategoryDistribution: CategoryDistribution[] = [
  { category: 'Electronics', count: 4, percentage: 33 }, { category: 'Groceries', count: 2, percentage: 17 },
  { category: 'Footwear', count: 1, percentage: 8 }, { category: 'Home & Kitchen', count: 2, percentage: 17 },
  { category: 'Clothing', count: 1, percentage: 8 }, { category: 'Sports', count: 1, percentage: 9 },
  { category: 'Accessories', count: 1, percentage: 8 },
];

export const mockTopCustomers: TopCustomer[] = [
  { id: 5, name: 'Vikram Singh', totalOrders: 20, totalSpent: 3567.40, rank: 1 },
  { id: 3, name: 'Rahul Gupta', totalOrders: 15, totalSpent: 2345.90, rank: 2 },
  { id: 1, name: 'Arjun Sharma', totalOrders: 12, totalSpent: 1456.78, rank: 3 },
  { id: 7, name: 'Karan Mehta', totalOrders: 9, totalSpent: 1123.60, rank: 4 },
  { id: 2, name: 'Priya Patel', totalOrders: 8, totalSpent: 987.50, rank: 5 },
];

export const mockMonthlyRevenue: MonthlyRevenue[] = [
  { month: 'Oct', revenue: 28400, growth: 0 }, { month: 'Nov', revenue: 35200, growth: 23.9 },
  { month: 'Dec', revenue: 42100, growth: 19.6 }, { month: 'Jan', revenue: 31800, growth: -24.5 },
  { month: 'Feb', revenue: 38500, growth: 21.1 }, { month: 'Mar', revenue: 41200, growth: 7.0 },
  { month: 'Apr', revenue: 42350, growth: 2.8 },
];

export const mockInventoryAlerts: InventoryAlert[] = [
  { productId: 11, productName: 'Almond Butter Organic', currentStock: 0, status: 'Critical' },
  { productId: 8, productName: 'Ceramic Coffee Mug Set', currentStock: 3, status: 'Critical' },
  { productId: 6, productName: 'Cotton T-Shirt Pack (3)', currentStock: 5, status: 'Low' },
  { productId: 3, productName: 'Running Shoes - Pro Series', currentStock: 67, status: 'Normal' },
];
