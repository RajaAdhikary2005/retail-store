export interface PurchaseOrder {
  id: number;
  supplierId: number;
  productId: number;
  items: string; // Used as a fallback/display string
  quantity: number;
  status: 'draft' | 'sent' | 'received';
  total: number;
  date: string;
}

export const PURCHASE_ORDERS: PurchaseOrder[] = [
  { id: 5001, supplierId: 1, productId: 1, items: 'Wireless Bluetooth Headphones × 50', quantity: 50, status: 'received', total: 2500, date: '2025-04-10' },
  { id: 5002, supplierId: 2, productId: 11, items: 'Almond Butter Organic × 100', quantity: 100, status: 'sent', total: 600, date: '2025-04-18' },
  { id: 5003, supplierId: 4, productId: 8, items: 'Ceramic Coffee Mug Set × 30', quantity: 30, status: 'draft', total: 450, date: '2025-04-22' },
];

export function getPendingPOQuantity(productId: number): number {
  return PURCHASE_ORDERS
    .filter(po => po.status === 'sent' || po.status === 'draft')
    .filter(po => po.productId === productId)
    .reduce((sum, po) => sum + po.quantity, 0);
}
