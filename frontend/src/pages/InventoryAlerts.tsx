import { useState, useEffect } from 'react';
import { AlertTriangle, Package, TrendingDown, Plus, X } from 'lucide-react';
import { fetchProducts, fetchSuppliers, createPO, type Supplier } from '../services/api';
import type { Product } from '../types';

export default function InventoryAlerts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const [showPOModal, setShowPOModal] = useState(false);
  const [poProduct, setPOProduct] = useState<Product | null>(null);
  const [poSupplierId, setPOSupplierId] = useState(0);
  const [poQty, setPOQty] = useState(50);
  const [poMsg, setPOMsg] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchProducts(), fetchSuppliers()]).then(([p, s]) => {
      setProducts(p);
      setSuppliers(s);
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

  const openPOModal = (p: Product) => {
    setPOProduct(p);
    setPOQty(50);
    setPOSupplierId(suppliers.length > 0 ? suppliers[0].id : 0);
    setPOMsg(null);
    setShowPOModal(true);
  };

  const handleCreatePO = async () => {
    if (!poProduct || !poSupplierId || poQty <= 0) return;
    const supplier = suppliers.find(s => s.id === poSupplierId);
    try {
      await createPO({
        supplierId: poSupplierId,
        supplierName: supplier?.name || '',
        productNames: poProduct.name,
        totalAmount: poProduct.price * poQty,
        status: 'Pending',
        orderDate: new Date().toISOString(),
      });
      setPOMsg(`✓ PO created for ${poQty} units of ${poProduct.name}`);
      setTimeout(() => { setShowPOModal(false); setPOMsg(null); }, 2000);
    } catch {
      setPOMsg('Failed to create PO');
    }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

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
              <tr><th>Product</th><th>Category</th><th>Current Stock</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filteredProducts.map(p => {
                const s = status(p.stockQuantity);
                return (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td>{p.category}</td>
                    <td style={{ fontWeight: 700 }}>{p.stockQuantity}</td>
                    <td><span className="badge" style={{ background: s.bg, color: s.color }}>{s.label}</span></td>
                    <td>
                      <button className="btn btn-sm btn-primary" onClick={() => openPOModal(p)}>
                        <Plus size={12} /> Create PO
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create PO Modal */}
      {showPOModal && poProduct && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3>Create Purchase Order</h3>
              <button className="close-btn" onClick={() => setShowPOModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div style={{ padding: '12px 16px', background: 'var(--bg-primary)', borderRadius: 8, marginBottom: 16 }}>
                <div style={{ fontWeight: 600 }}>{poProduct.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Current Stock: {poProduct.stockQuantity} • Price: ₹{poProduct.price}</div>
              </div>
              <div className="form-group">
                <label className="form-label">Supplier</label>
                <select className="form-select" value={poSupplierId} onChange={e => setPOSupplierId(Number(e.target.value))}>
                  {suppliers.length === 0 && <option value={0}>No suppliers available</option>}
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Order Quantity</label>
                <input className="form-input" type="number" value={poQty} onChange={e => setPOQty(Number(e.target.value))} min={1} />
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                Estimated Cost: <strong>₹{(poProduct.price * poQty).toLocaleString()}</strong>
              </div>
              {poMsg && (
                <div style={{ padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, marginBottom: 12,
                  background: poMsg.startsWith('✓') ? 'var(--accent-green-light)' : 'var(--accent-red-light)',
                  color: poMsg.startsWith('✓') ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                  {poMsg}
                </div>
              )}
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowPOModal(false)}>Cancel</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleCreatePO} disabled={!poSupplierId || poQty <= 0}>Create PO</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
