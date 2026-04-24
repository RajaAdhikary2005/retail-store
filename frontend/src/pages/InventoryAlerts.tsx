import { useState, useEffect } from 'react';
import { AlertTriangle, Package, TrendingDown, Archive, X } from 'lucide-react';
import { fetchProducts } from '../services/api';
import type { Product } from '../types';

export default function InventoryAlerts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchProducts().then(data => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  const status = (qty: number) => {
    if (qty <= 5) return { label: qty === 0 ? 'Out of Stock' : 'Critical', color: '#ef4444', bg: 'var(--accent-red-light)', level: 'critical' };
    if (qty <= 20) return { label: 'Low Stock', color: '#f59e0b', bg: 'var(--accent-orange-light)', level: 'low' };
    return { label: 'Normal', color: '#10b981', bg: 'var(--accent-green-light)', level: 'normal' };
  };

  const filteredProducts = products
    .filter(p => filter === 'all' || status(p.stockQuantity).level === filter)
    .sort((a, b) => a.stockQuantity - b.stockQuantity);

  return (
    <>
      <div className="page-header">
        <h2>Inventory Alerts</h2>
        <p>Monitor low stock levels and manage restock requirements.</p>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 24 }}>
        <div className="stat-card" onClick={() => setFilter('critical')} style={{ cursor: 'pointer', border: filter === 'critical' ? '2px solid var(--accent-red)' : 'none' }}>
          <div className="stat-info">
            <h4>Critical / Out</h4>
            <div className="stat-value" style={{ color: 'var(--accent-red)' }}>{products.filter(p => status(p.stockQuantity).level === 'critical').length}</div>
          </div>
          <div className="stat-icon red"><AlertTriangle size={22} /></div>
        </div>
        <div className="stat-card" onClick={() => setFilter('low')} style={{ cursor: 'pointer', border: filter === 'low' ? '2px solid var(--accent-orange)' : 'none' }}>
          <div className="stat-info">
            <h4>Low Stock</h4>
            <div className="stat-value" style={{ color: 'var(--accent-orange)' }}>{products.filter(p => status(p.stockQuantity).level === 'low').length}</div>
          </div>
          <div className="stat-icon orange"><TrendingDown size={22} /></div>
        </div>
        <div className="stat-card" onClick={() => setFilter('all')} style={{ cursor: 'pointer', border: filter === 'all' ? '2px solid var(--accent-blue)' : 'none' }}>
          <div className="stat-info">
            <h4>Total Products</h4>
            <div className="stat-value">{products.length}</div>
          </div>
          <div className="stat-icon blue"><Package size={22} /></div>
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Current Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(p => {
                const s = status(p.stockQuantity);
                return (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td>{p.category}</td>
                    <td style={{ fontWeight: 700 }}>{p.stockQuantity}</td>
                    <td>
                      <span className="badge" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                    </td>
                    <td>
                      <button className="btn btn-sm btn-primary">Create PO</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
