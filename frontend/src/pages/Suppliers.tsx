import { useState, useEffect } from 'react';
import { Truck, Plus, Trash2, FileText, Clock, CheckCircle, X, Check, XCircle, Package } from 'lucide-react';
import { fetchSuppliers, createSupplier, deleteSupplier, type Supplier, fetchProducts, fetchPOs, createPO, updatePOStatus, updateProductStock, type PurchaseOrder } from '../services/api';
import type { Product } from '../types';
import { type UserRole } from '../services/auth';

interface Props { userRole?: UserRole; }

export default function Suppliers({ userRole = 'admin' }: Props) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [_loading, setLoading] = useState(true);
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
  const [saving, setSaving] = useState(false);

  // PO form
  const [showPOModal, setShowPOModal] = useState(false);
  const [poSupplierId, setPoSupplierId] = useState(0);
  const [poSelectedProducts, setPoSelectedProducts] = useState<number[]>([]);
  const [poQuantity, setPoQuantity] = useState<number>(0);
  const [poUnitPrice, setPoUnitPrice] = useState<number>(0);
  const [poTotalAmount, setPoTotalAmount] = useState<number>(0);
  const [poMsg, setPoMsg] = useState<string | null>(null);

  // Receive PO modal
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [receivePO, setReceivePO] = useState<PurchaseOrder | null>(null);
  const [receiveQty, setReceiveQty] = useState<number>(0);
  const [receiveMsg, setReceiveMsg] = useState<string | null>(null);

  // Auto-calc: when quantity changes, update total from unit price
  const handleQtyChange = (qty: number) => {
    setPoQuantity(qty);
    if (poUnitPrice > 0) setPoTotalAmount(qty * poUnitPrice);
  };

  // Auto-calc: when unit price changes, update total from quantity
  const handleUnitPriceChange = (price: number) => {
    setPoUnitPrice(price);
    if (poQuantity > 0) setPoTotalAmount(poQuantity * price);
  };

  // Auto-calc: when total changes, update unit price from quantity
  const handleTotalChange = (total: number) => {
    setPoTotalAmount(total);
    if (poQuantity > 0) setPoUnitPrice(Math.round((total / poQuantity) * 100) / 100);
  };

  const handleSaveSupplier = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    setSupplierMsg(null);
    try {
      await createSupplier({
        name: form.name.trim(), contactPerson: form.contactPerson.trim(),
        email: form.email.trim(), phone: form.phone.trim(), category: form.category.trim(),
        status: 'Active', totalOrdersValue: 0, pendingDeliveries: 0
      });
      setSupplierMsg('✓ Supplier created successfully!');
      setTimeout(() => {
        setShowModal(false); setForm({ name: '', contactPerson: '', email: '', phone: '', category: '' });
        setSupplierMsg(null); loadData();
      }, 1200);
    } catch (err: any) {
      setSupplierMsg(`✗ ${err?.message || 'Failed to create supplier'}`);
    } finally { setSaving(false); }
  };

  const handleDeleteSupplier = async (id: number) => {
    if (!confirm('Delete this supplier?')) return;
    try { await deleteSupplier(id); setSuppliers(prev => prev.filter(s => s.id !== id)); } catch { /* ignore */ }
  };

  const toggleProduct = (pid: number) => {
    setPoSelectedProducts(prev => prev.includes(pid) ? prev.filter(id => id !== pid) : [...prev, pid]);
  };

  const selectedProductNames = poSelectedProducts.map(id => products.find(p => p.id === id)?.name || '').filter(Boolean).join(', ');

  const handleCreatePO = async () => {
    if (!poSupplierId || poSelectedProducts.length === 0 || poTotalAmount <= 0) return;
    const supplier = suppliers.find(s => s.id === poSupplierId);
    try {
      await createPO({
        supplierId: poSupplierId, supplierName: supplier?.name || '',
        productNames: selectedProductNames, totalAmount: poTotalAmount,
        orderedQuantity: poQuantity || 0, receivedQuantity: 0,
        status: 'Pending',
      });
      setPoMsg('✓ Purchase Order created!');
      setTimeout(() => {
        setShowPOModal(false); setPoMsg(null); setPoSelectedProducts([]);
        setPoTotalAmount(0); setPoQuantity(0); setPoUnitPrice(0); setPoSupplierId(0); loadData();
      }, 1500);
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.toLowerCase().includes('json') || msg.toLowerCase().includes('unexpected token'))
        setPoMsg('Unable to create PO — server communication error. Please try again.');
      else if (msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('network'))
        setPoMsg('Unable to connect to the server. Please check your connection.');
      else
        setPoMsg(`✗ ${msg || 'Failed to create PO. Please try again.'}`);
    }
  };

  // Handle marking PO as Cancelled
  const handleCancelPO = async (po: PurchaseOrder) => {
    if (!confirm(`Cancel PO #${po.id}?`)) return;
    try {
      await updatePOStatus(po.id, 'Cancelled');
      loadData();
    } catch { alert('Failed to cancel PO'); }
  };

  // Open receive modal
  const openReceiveModal = (po: PurchaseOrder) => {
    setReceivePO(po);
    setReceiveQty(0);
    setReceiveMsg(null);
    setShowReceiveModal(true);
  };

  // Handle receiving stock
  const handleReceivePO = async () => {
    if (!receivePO || receiveQty <= 0) return;
    const ordered = receivePO.orderedQuantity || 0;
    const alreadyReceived = receivePO.receivedQuantity || 0;
    const totalAfter = alreadyReceived + receiveQty;
    const newStatus = ordered > 0 && totalAfter < ordered ? 'Partially Received' : 'Received';

    try {
      await updatePOStatus(receivePO.id, newStatus, totalAfter);

      // Auto-add to product stock for each selected product
      const productNamesList = (receivePO.productNames || '').split(',').map(n => n.trim()).filter(Boolean);
      const perProductQty = productNamesList.length > 0 ? Math.floor(receiveQty / productNamesList.length) : receiveQty;
      for (const pName of productNamesList) {
        const product = products.find(p => p.name.toLowerCase() === pName.toLowerCase());
        if (product) {
          try { await updateProductStock(product.id, perProductQty); } catch { /* best effort */ }
        }
      }

      setReceiveMsg(`✓ Received ${receiveQty} units. Stock updated automatically.`);
      setTimeout(() => { setShowReceiveModal(false); setReceiveMsg(null); loadData(); }, 1800);
    } catch { setReceiveMsg('✗ Failed to update PO'); }
  };

  const statusBadge = (status: string) => {
    const icon = status === 'Received' ? <CheckCircle size={12} />
      : status === 'Cancelled' ? <XCircle size={12} />
      : status === 'Partially Received' ? <Package size={12} />
      : <Clock size={12} />;
    const cls = status === 'Received' ? 'badge-delivered'
      : status === 'Cancelled' ? 'badge-cancelled'
      : status === 'Partially Received' ? 'badge-processing'
      : 'badge-pending';
    return <span className={`badge ${cls}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>{icon}{status}</span>;
  };

  return (
    <>
      <div className="page-header">
        <h2>Suppliers & Purchase Orders</h2>
        <div className="header-actions">
          {userRole !== 'manager' && tab === 'suppliers' && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={18} /> Add Supplier
            </button>
          )}
          {tab === 'orders' && (
            <button className="btn btn-primary" onClick={() => setShowPOModal(true)}>
              <Plus size={18} /> New PO
            </button>
          )}
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
                    <td>{s.contactPerson}</td><td>{s.email}</td><td>{s.phone}</td><td>{s.category}</td>
                    <td><span className="badge badge-success">{s.status || 'Active'}</span></td>
                    <td><button className="btn btn-icon" style={{ color: 'var(--accent-red)' }} onClick={() => handleDeleteSupplier(s.id)}><Trash2 size={16} /></button></td>
                  </tr>
                ))}
                {suppliers.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>No suppliers yet. Click "Add Supplier" to create one.</td></tr>}
              </tbody>
            </table>
          ) : (
            <table className="data-table">
              <thead><tr><th>PO #</th><th>Supplier</th><th>Products</th><th>Qty</th><th>Amount</th><th>Received</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 600 }}>PO-{o.id.toString().padStart(4, '0')}</td>
                    <td>{o.supplierName}</td>
                    <td>{o.productNames}</td>
                    <td>{o.orderedQuantity || '—'}</td>
                    <td style={{ fontWeight: 600 }}>₹{o.totalAmount.toLocaleString()}</td>
                    <td>
                      {o.receivedQuantity != null && o.orderedQuantity ? (
                        <span style={{ fontWeight: 500 }}>{o.receivedQuantity}/{o.orderedQuantity}</span>
                      ) : o.receivedQuantity ? (
                        <span>{o.receivedQuantity}</span>
                      ) : '—'}
                    </td>
                    <td>{new Date(o.orderDate).toLocaleDateString()}</td>
                    <td>{statusBadge(o.status)}</td>
                    <td>
                      {o.status === 'Pending' || o.status === 'Partially Received' ? (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-sm btn-success" style={{ fontSize: 11, gap: 4 }} onClick={() => openReceiveModal(o)}>
                            <CheckCircle size={12} /> Approve & Receive
                          </button>
                          {o.status === 'Pending' && (
                            <button className="btn btn-sm btn-danger" style={{ fontSize: 11, gap: 4 }} onClick={() => handleCancelPO(o)}>
                              <XCircle size={12} /> Cancel
                            </button>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && <tr><td colSpan={9} style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>No purchase orders yet.</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Supplier Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setSupplierMsg(null); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
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
                <div style={{ padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, marginBottom: 8,
                  background: supplierMsg.startsWith('✓') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  color: supplierMsg.startsWith('✓') ? '#10b981' : '#ef4444' }}>{supplierMsg}</div>
              )}
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setShowModal(false); setSupplierMsg(null); }}>Cancel</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSaveSupplier} disabled={!form.name.trim() || saving}>
                  {saving ? 'Saving...' : 'Save Supplier'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New PO Modal — with quantity field & auto-calc */}
      {showPOModal && (
        <div className="modal-overlay" onClick={() => { setShowPOModal(false); setPoMsg(null); setPoSelectedProducts([]); }}>
          <div className="modal-content" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
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
                <label className="form-label" style={{ marginBottom: 8 }}>Select Products *</label>
                <div style={{ border: '1px solid var(--border-color)', borderRadius: 8, maxHeight: 200, overflowY: 'auto', background: 'var(--bg-primary)' }}>
                  {products.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: 16, textAlign: 'center' }}>No products available</div>}
                  {products.map(p => {
                    const selected = poSelectedProducts.includes(p.id);
                    return (
                      <div key={p.id} onClick={() => toggleProduct(p.id)} style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer',
                        borderBottom: '1px solid var(--border-color)', background: selected ? 'rgba(59,130,246,0.06)' : 'transparent', transition: 'background 0.15s ease',
                      }}>
                        <div style={{ width: 20, height: 20, borderRadius: 4, flexShrink: 0,
                          border: selected ? '2px solid #3b82f6' : '2px solid var(--border-color)',
                          background: selected ? '#3b82f6' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease',
                        }}>{selected && <Check size={13} color="#fff" strokeWidth={3} />}</div>
                        <span style={{ flex: 1, fontSize: 13, fontWeight: selected ? 600 : 400 }}>{p.name}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>₹{p.price}</span>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 500,
                          background: p.stockQuantity <= 5 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                          color: p.stockQuantity <= 5 ? '#ef4444' : '#10b981',
                        }}>Stock: {p.stockQuantity}</span>
                      </div>
                    );
                  })}
                </div>
                {poSelectedProducts.length > 0 && (
                  <div style={{ fontSize: 12, color: '#3b82f6', marginTop: 6, fontWeight: 500 }}>
                    {poSelectedProducts.length} selected: {selectedProductNames}
                  </div>
                )}
              </div>

              {/* Quantity & Price fields with auto-calc */}
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Quantity *</label>
                  <input className="form-input" type="number" value={poQuantity || ''} onChange={e => handleQtyChange(Number(e.target.value))} min={1} placeholder="e.g. 10" />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Unit Price (₹)</label>
                  <input className="form-input" type="number" value={poUnitPrice || ''} onChange={e => handleUnitPriceChange(Number(e.target.value))} min={0} step="0.01" placeholder="e.g. 7" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Total Amount (₹) *</label>
                <input className="form-input" type="number" value={poTotalAmount || ''} onChange={e => handleTotalChange(Number(e.target.value))} min={1} placeholder="Auto-calculated or enter manually" />
                {poQuantity > 0 && poUnitPrice > 0 && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    {poQuantity} × ₹{poUnitPrice} = ₹{(poQuantity * poUnitPrice).toLocaleString()}
                  </div>
                )}
              </div>

              {poMsg && (
                <div style={{ padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, marginBottom: 12,
                  background: poMsg.startsWith('✓') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  color: poMsg.startsWith('✓') ? '#10b981' : '#ef4444' }}>{poMsg}</div>
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

      {/* Receive PO Modal */}
      {showReceiveModal && receivePO && (
        <div className="modal-overlay" onClick={() => setShowReceiveModal(false)}>
          <div className="modal-content" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Receive PO #{receivePO.id}</h3>
              <button className="close-btn" onClick={() => setShowReceiveModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div style={{ padding: 14, background: 'var(--bg-primary)', borderRadius: 8, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Supplier</span>
                  <span style={{ fontWeight: 600 }}>{receivePO.supplierName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Products</span>
                  <span style={{ fontWeight: 500 }}>{receivePO.productNames}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Ordered Qty</span>
                  <span style={{ fontWeight: 600 }}>{receivePO.orderedQuantity || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Already Received</span>
                  <span style={{ fontWeight: 600, color: 'var(--accent-green)' }}>{receivePO.receivedQuantity || 0}</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Quantity Received Now *</label>
                <input className="form-input" type="number" min={1}
                  max={receivePO.orderedQuantity ? receivePO.orderedQuantity - (receivePO.receivedQuantity || 0) : undefined}
                  value={receiveQty || ''} onChange={e => setReceiveQty(Number(e.target.value))}
                  placeholder="Enter quantity received" />
                {receivePO.orderedQuantity && receivePO.orderedQuantity > 0 && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    Remaining: {(receivePO.orderedQuantity || 0) - (receivePO.receivedQuantity || 0)} units
                  </div>
                )}
              </div>

              <div style={{ padding: '10px 14px', background: 'var(--accent-blue-light)', borderRadius: 8, fontSize: 12, marginBottom: 12, color: 'var(--accent-blue)' }}>
                💡 Stock will be automatically added to the product(s) when you confirm.
              </div>

              {receiveMsg && (
                <div style={{ padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, marginBottom: 12,
                  background: receiveMsg.startsWith('✓') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  color: receiveMsg.startsWith('✓') ? '#10b981' : '#ef4444' }}>{receiveMsg}</div>
              )}

              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowReceiveModal(false)}>Cancel</button>
                <button className="btn btn-success" style={{ flex: 1 }} disabled={receiveQty <= 0} onClick={handleReceivePO}>
                  <CheckCircle size={14} /> Confirm Receive
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
