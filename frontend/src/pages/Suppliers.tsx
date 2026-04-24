import { useState, useEffect } from 'react';
import { Truck, Plus, Trash2, FileText, Clock, CheckCircle, X } from 'lucide-react';
import { fetchSuppliers, createSupplier, deleteSupplier, type Supplier, fetchProducts, fetchPOs, createPO, type PurchaseOrder } from '../services/api';
import type { Product } from '../types';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'suppliers' | 'orders'>('suppliers');

  const loadData = () => {
    setLoading(true);
    Promise.all([fetchSuppliers(), fetchProducts(), fetchPOs()]).then(([s, p, o]) => {
      setSuppliers(s); setProducts(p); setOrders(o); setLoading(false);
    });
  };

  useEffect(() => { loadData(); }, []);

  // Supplier form
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', contactPerson: '', email: '', phone: '', category: '' });
  const [supplierMsg, setSupplierMsg] = useState<string | null>(null);

  // PO form
  const [showPOModal, setShowPOModal] = useState(false);
  const [poSupplierId, setPoSupplierId] = useState(0);
  const [poSelectedProducts, setPoSelectedProducts] = useState<number[]>([]);
  const [poTotalAmount, setPoTotalAmount] = useState(0);
  const [poMsg, setPoMsg] = useState<string | null>(null);

  const handleSaveSupplier = async () => {
    if (!form.name.trim()) return;
    setSupplierMsg(null);
    try {
      const result = await createSupplier({ ...form, status: 'Active' });
      if (result && result.id) {
        setSupplierMsg('✓ Supplier created!');
        setTimeout(() => {
          setShowModal(false);
          setForm({ name: '', contactPerson: '', email: '', phone: '', category: '' });
          setSupplierMsg(null);
          loadData();
        }, 1200);
      } else {
        setSupplierMsg('Failed to create supplier');
      }
    } catch {
      setSupplierMsg('Failed to create supplier — server error');
    }
  };

  const handleDeleteSupplier = async (id: number) => {
    if (!confirm('Delete this supplier?')) return;
    try {
      await deleteSupplier(id);
      setSuppliers(prev => prev.filter(s => s.id !== id));
    } catch { /* ignore */ }
  };

  const toggleProduct = (pid: number) => {
    setPoSelectedProducts(prev =>
      prev.includes(pid) ? prev.filter(id => id !== pid) : [...prev, pid]
    );
  };

  const selectedProductNames = poSelectedProducts
    .map(id => products.find(p => p.id === id)?.name || '')
    .filter(Boolean)
    .join(', ');

  const handleCreatePO = async () => {
    if (!poSupplierId || poSelectedProducts.length === 0 || poTotalAmount <= 0) return;
    const supplier = suppliers.find(s => s.id === poSupplierId);
    try {
      await createPO({
        supplierId: poSupplierId,
        supplierName: supplier?.name || '',
        productNames: selectedProductNames,
        totalAmount: poTotalAmount,
        status: 'Pending',
        orderDate: new Date().toISOString(),
      });
      setPoMsg('✓ Purchase Order created!');
      setTimeout(() => { setShowPOModal(false); setPoMsg(null); setPoSelectedProducts([]); setPoTotalAmount(0); loadData(); }, 1500);
    } catch {
      setPoMsg('Failed to create PO');
    }
  };

  const statusBadge = (status: string) => (
    <span className={`badge badge-${status.toLowerCase()}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {status === 'Received' ? <CheckCircle size={12} /> : <Clock size={12} />}
      {status}
    </span>
  );

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <>
      <div className="page-header">
        <h2>Suppliers & Purchase Orders</h2>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => tab === 'suppliers' ? setShowModal(true) : setShowPOModal(true)}>
            <Plus size={18} /> {tab === 'suppliers' ? 'Add Supplier' : 'New PO'}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="tabs">
            <button className={`tab ${tab === 'suppliers' ? 'active' : ''}`} onClick={() => setTab('suppliers')}>
              <Truck size={16} /> Suppliers ({suppliers.length})
            </button>
            <button className={`tab ${tab === 'orders' ? 'active' : ''}`} onClick={() => setTab('orders')}>
              <FileText size={16} /> Purchase Orders ({orders.length})
            </button>
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {tab === 'suppliers' ? (
            <table className="data-table">
              <thead><tr><th>ID</th><th>Supplier</th><th>Contact</th><th>Email</th><th>Phone</th><th>Category</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {suppliers.map(s => (
                  <tr key={s.id}>
                    <td>#{s.id}</td>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td>{s.contactPerson}</td>
                    <td>{s.email}</td>
                    <td>{s.phone}</td>
                    <td>{s.category}</td>
                    <td><span className="badge badge-success">{s.status || 'Active'}</span></td>
                    <td>
                      <button className="btn btn-icon" style={{ color: 'var(--accent-red)' }} onClick={() => handleDeleteSupplier(s.id)}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {suppliers.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>No suppliers yet. Click "Add Supplier" to create one.</td></tr>}
              </tbody>
            </table>
          ) : (
            <table className="data-table">
              <thead><tr><th>PO #</th><th>Supplier</th><th>Products</th><th>Amount</th><th>Date</th><th>Status</th></tr></thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td>#{o.id}</td>
                    <td>{o.supplierName}</td>
                    <td>{o.productNames}</td>
                    <td style={{ fontWeight: 600 }}>₹{o.totalAmount.toLocaleString()}</td>
                    <td>{new Date(o.orderDate).toLocaleDateString()}</td>
                    <td>{statusBadge(o.status)}</td>
                  </tr>
                ))}
                {orders.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>No purchase orders yet.</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Supplier Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add New Supplier</h3>
              <button className="close-btn" onClick={() => { setShowModal(false); setSupplierMsg(null); }}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Supplier Name *</label>
                <input className="form-input" type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Company name" />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Person</label>
                <input className="form-input" type="text" value={form.contactPerson} onChange={e => setForm({...form, contactPerson: e.target.value})} placeholder="Contact name" />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Phone</label>
                  <input className="form-input" type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <input className="form-input" type="text" value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="e.g. Electronics, Food, Dairy" />
              </div>
              {supplierMsg && (
                <div style={{ padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, marginBottom: 8,
                  background: supplierMsg.startsWith('✓') ? 'var(--accent-green-light)' : 'var(--accent-red-light)',
                  color: supplierMsg.startsWith('✓') ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                  {supplierMsg}
                </div>
              )}
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setShowModal(false); setSupplierMsg(null); }}>Cancel</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSaveSupplier} disabled={!form.name.trim()}>Save Supplier</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New PO Modal */}
      {showPOModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3>Create Purchase Order</h3>
              <button className="close-btn" onClick={() => { setShowPOModal(false); setPoMsg(null); setPoSelectedProducts([]); }}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Supplier *</label>
                <select className="form-select" value={poSupplierId} onChange={e => setPoSupplierId(Number(e.target.value))}>
                  <option value={0}>— Select Supplier —</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Select Products *</label>
                <div style={{ border: '1px solid var(--border-color)', borderRadius: 8, maxHeight: 180, overflowY: 'auto', padding: 8 }}>
                  {products.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: 8 }}>No products available</div>}
                  {products.map(p => (
                    <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, cursor: 'pointer',
                      background: poSelectedProducts.includes(p.id) ? 'var(--accent-blue-light, rgba(59,130,246,0.08))' : 'transparent' }}>
                      <input type="checkbox" checked={poSelectedProducts.includes(p.id)} onChange={() => toggleProduct(p.id)}
                        style={{ accentColor: 'var(--accent-blue)' }} />
                      <span style={{ flex: 1, fontSize: 13, fontWeight: poSelectedProducts.includes(p.id) ? 600 : 400 }}>{p.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>₹{p.price} • Stock: {p.stockQuantity}</span>
                    </label>
                  ))}
                </div>
                {poSelectedProducts.length > 0 && (
                  <div style={{ fontSize: 11, color: 'var(--accent-blue)', marginTop: 4 }}>
                    Selected: {selectedProductNames}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Total Amount (₹) *</label>
                <input className="form-input" type="number" value={poTotalAmount || ''} onChange={e => setPoTotalAmount(Number(e.target.value))} min={1} />
              </div>

              {poMsg && (
                <div style={{ padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, marginBottom: 12,
                  background: poMsg.startsWith('✓') ? 'var(--accent-green-light)' : 'var(--accent-red-light)',
                  color: poMsg.startsWith('✓') ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                  {poMsg}
                </div>
              )}
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setShowPOModal(false); setPoMsg(null); setPoSelectedProducts([]); }}>Cancel</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleCreatePO}
                  disabled={!poSupplierId || poSelectedProducts.length === 0 || poTotalAmount <= 0}>
                  Create PO
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
