

export interface ReturnItem {
  id: number;
  orderId: number;
  customerId: number;
  productId: number;
  customerName: string;
  productName: string;
  quantity: number;
  reason: string;
  amount: number;
  status: 'pending' | 'approved' | 'refunded' | 'rejected';
  createdAt: string;
  requestedBy: string;
}

export const RETURNS: ReturnItem[] = [
  { id: 1, orderId: 1001, customerId: 3, productId: 1, customerName: 'Rahul Gupta', productName: 'Wireless Bluetooth Headphones', quantity: 1, reason: 'Defective', amount: 79.99, status: 'pending', createdAt: '2026-04-22', requestedBy: 'Amit Kumar' },
  { id: 2, orderId: 1005, customerId: 7, productId: 12, customerName: 'Karan Mehta', productName: 'Wireless Charging Pad', quantity: 1, reason: 'Not as described', amount: 29.99, status: 'approved', createdAt: '2026-04-20', requestedBy: 'Priya Sharma' },
  { id: 3, orderId: 1003, customerId: 1, productId: 6, customerName: 'Arjun Sharma', productName: 'Cotton T-Shirt Pack (3)', quantity: 1, reason: 'Wrong item', amount: 34.99, status: 'refunded', createdAt: '2026-04-18', requestedBy: 'Raja Adhikary' },
];

import { logAction } from './api';

export function addReturn(ret: ReturnItem) {
  RETURNS.unshift(ret);
  logAction('System User', 'Submitted return request', `Order #${ret.orderId}`, 'info', 'Package');
}

export function updateReturnStatus(id: number, status: ReturnItem['status']) {
  const ret = RETURNS.find(r => r.id === id);
  if (ret) {
    ret.status = status;
    logAction('System User', 'Updated return status', `Return #${id} → ${status}`, 'warning', 'Edit');
  }
}
