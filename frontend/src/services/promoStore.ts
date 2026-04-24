// Shared promo/coupon store — used by both Promotions page and Coupon Checker

export interface Promo {
  id: number;
  code: string;
  type: 'percentage' | 'flat';
  value: number;
  startDate: string;
  endDate: string;
  maxUses: number;
  usedCount: number;
  enabled: boolean;
  description: string;
}

// Mutable in-memory promo list — shared across pages
export const PROMOS: Promo[] = [
  { id: 1, code: 'WELCOME10', type: 'percentage', value: 10, startDate: '2026-01-01', endDate: '2026-12-31', maxUses: 500, usedCount: 127, enabled: true, description: 'Welcome discount for new customers' },
  { id: 2, code: 'FLAT200OFF', type: 'flat', value: 200, startDate: '2026-04-01', endDate: '2026-06-30', maxUses: 100, usedCount: 43, enabled: true, description: 'Flat ₹200 off on orders above ₹1000' },
  { id: 3, code: 'SUMMER25', type: 'percentage', value: 25, startDate: '2026-05-01', endDate: '2026-08-31', maxUses: 300, usedCount: 0, enabled: true, description: 'Summer sale — 25% off everything' },
  { id: 4, code: 'LOYALTY15', type: 'percentage', value: 15, startDate: '2026-03-01', endDate: '2026-05-31', maxUses: 200, usedCount: 85, enabled: true, description: 'Loyalty reward for returning customers' },
];

export function addPromo(promo: Promo) {
  PROMOS.push(promo);
}

export function removePromo(id: number) {
  const idx = PROMOS.findIndex(p => p.id === id);
  if (idx !== -1) PROMOS.splice(idx, 1);
}

export function togglePromo(id: number) {
  const p = PROMOS.find(p => p.id === id);
  if (p) p.enabled = !p.enabled;
}

export function findPromoByCode(code: string): Promo | undefined {
  return PROMOS.find(p => p.code.toUpperCase() === code.toUpperCase());
}
