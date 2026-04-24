import { useState, useEffect } from 'react';
import { Truck, Plus, Edit, Trash2, Package, Phone, Mail, MapPin, FileText, Clock, CheckCircle } from 'lucide-react';
import { PURCHASE_ORDERS, type PurchaseOrder } from '../services/poStore';
import { fetchSuppliers, createSupplier, updateSupplier, deleteSupplier, type Supplier, fetchProducts } from '../services/api';
import type { Product } from '../types';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [, forceUpdate] = useState(0);
  const orders = PURCHASE_ORDERS;
  
  const refresh = () => forceUpdate(n => n + 1);

  useEffect(() => {
    fetchSuppliers().then(setSuppliers);
    fetchProducts().then(setProducts);
  }, []);

  const [showModal, setShowModal] = useState(false);
  const [showPOModal, setShowPOModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', contact: '', email: '', phone: '', address: '', products: '' as string | number[] });
  const [poForm, setPoForm] = useState({ supplierId: 0, productId: 0, items: '', quantity: 1, total: 0 });
  const [tab, setTab] = useState<'suppliers' | 'orders'>('suppliers');

  const openEdit = (s: Supplier) => { 
    setEditId(s.id); 
    const pNames = s.products.map(id => products.find(p => p.id === id)?.name || '').filter(Boolean).join(', ');
    setForm({ name: s.name, contact: s.contact, email: s.email, phone: s.phone, address: s.address, products: pNames }); 
    setShowModal(true); 
  };
  const openNew = () => { setEditId(null); setForm({ name: '', contact: '', email: '', phone: '', address: '', products: '' }); setShowModal(true); };

  const saveSupplier = async () => {
    const prodStr = form.products as string;
    const prodIds = prodStr.split(',').map(name => {
      const p = products.find(prod => prod.name.toLowerCase() === name.trim().toLowerCase());
      return p ? p.id : 0;
    }).filter(id => id !== 0);

    if (editId) { 
      await updateSupplier(editId, { ...form, products: prodIds }); 
    } else { 
      await createSupplier({ ...form, products: prodIds }); 
    }
    fetchSuppliers().then(setSuppliers);
    setShowModal(false);
  };

  const handleDelete = async (id: number) => {
    await deleteSupplier(id);
    fetchSuppliers().then(setSuppliers);
  };

  const createPO = () => {
    const newId = 5000 + PURCHASE_ORDERS.length + 1;
    PURCHASE_ORDERS.push({ id: newId, ...poForm, status: 'draft', date: new Date().toISOString().split('T')[0] });
    import('../services/api').then(api => api.logAction('System User', 'Created Purchase Order', `PO #${newId}`, 'info', 'FileText'));
    setShowPOModal(false); setPoForm({ supplierId: 0, productId: 0, items: '', quantity: 1, total: 0 });
    refresh();
  };

  const updatePOStatus = (id: number, status: PurchaseOrder['status']) => {
    const order = PURCHASE_ORDERS.find(o => o.id === id);
    if (!order) return;
    
    if (status === 'received' && order.status !== 'received') {
      const prod = products.find(p => p.id === order.productId);
      if (prod) {
        prod.stockQuantity += order.quantity;
        import('../services/api').then(({ updateProduct, logAction }) => {
          logAction('System User', 'Received Purchase Order', `PO #${id} Restocked ${order.quantity} units`, 'warning', 'Truck');
          updateProduct(prod.id, { stockQuantity: prod.stockQuantity }).catch(console.error);
        });
      }
    } else {
      import('../services/api').then(api => api.logAction('System User', 'Sent Purchase Order', `PO #${id} → ${status}`, 'info', 'FileText'));
    }
    
    order.status = status;
    refresh();
  };

  const statusCfg: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
    draft: { bg: 'var(--bg-primary)', color: 'var(--text-secondary)', icon: <FileText size={12} /> },
    sent: { bg: 'var(--accent-blue-light)', color: 'var(--accent-blue)', icon: <Clock size={12} /> },
    received: { bg: 'var(--accent-green-light)', color: 'var(--accent-green)', icon: <CheckCircle size={12} /> },
  };

  return (
    <>
      <div className="page-header"><h2>Suppliers & Purchase Orders</h2><p>Manage your vendor network and track purchase orders for restocking.</p></div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card"><div className="stat-info"><h4>Suppliers</h4><div className="stat-value">{suppliers.length}</div></div><div className="stat-icon blue"><Truck size={22} /></div></div>
        <div className="stat-card"><div className="stat-info"><h4>Active POs</h4><div className="stat-value" style={{ color: 'var(--accent-orange)' }}>{orders.filter(o => o.status !== 'received').length}</div></div><div className="stat-icon orange"><Package size={22} /></div></div>
        <div className="stat-card"><div className="stat-info"><h4>Completed POs</h4><div className="stat-value" style={{ color: 'var(--accent-green)' }}>{orders.filter(o => o.status === 'received').length}</div></div><div className="stat-icon green"><CheckCircle size={22} /></div></div>
      </div>

      <div className="toolbar">
        <div className="toolbar-left" style={{ gap: 6 }}>
          <button className={`btn btn-sm ${tab === 'suppliers' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('suppliers')}>Suppliers</button>
          <button className={`btn btn-sm ${tab === 'orders' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('orders')}>Purchase Orders</button>
        </div>
        <div className="toolbar-right">
          {tab === 'suppliers' && <button className="btn btn-primary btn-sm" onClick={openNew}><Plus size={14} /> Add Supplier</button>}
          {tab === 'orders' && <button className="btn btn-primary btn-sm" onClick={() => setShowPOModal(true)}><Plus size={14} /> New PO</button>}
        </div>
      </div>

      {tab === 'suppliers' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {suppliers.map(s => (
            <div key={s.id} className="card" style={{ overflow: 'hidden' }}>
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div><div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{s.name}</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.contact}</div></div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(s)}><Edit size={13} /></button>
                    <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(s.id)}><Trash2 size={13} /></button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Mail size={12} style={{ color: 'var(--text-muted)' }} /> {s.email}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Phone size={12} style={{ color: 'var(--text-muted)' }} /> {s.phone}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={12} style={{ color: 'var(--text-muted)' }} /> {s.address}</div>
                </div>
                <div style={{ marginTop: 12, padding: '8px 10px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', fontSize: 11 }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Products: </span>
                  {s.products.map(id => products.find(p => p.id === id)?.name || `ID #${id}`).join(' · ')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'orders' && (
        <div className="card"><div className="card-body" style={{ padding: 0 }}>
          <table className="data-table"><thead><tr><th>PO #</th><th>Supplier</th><th>Items</th><th>Qty</th><th>Total</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{orders.map(o => { 
              const sc = statusCfg[o.status]; 
              const sup = suppliers.find(s => s.id === o.supplierId);
              const prod = products.find(p => p.id === o.productId);
              const itemsDisplay = prod ? `${prod.name} × ${o.quantity}` : o.items;
              return (
              <tr key={o.id}>
                <td style={{ fontWeight: 600 }}>#{o.id}</td>
                <td>{sup?.name || 'Unknown'}</td>
                <td style={{ fontSize: 12 }}>{itemsDisplay}</td>
                <td>{o.quantity}</td>
                <td style={{ fontWeight: 600 }}>₹{o.total.toFixed(2)}</td>
                <td style={{ fontSize: 12 }}>{o.date}</td>
                <td><span className="badge" style={{ background: sc.bg, color: sc.color, gap: 4 }}>{sc.icon} {o.status}</span></td>
                <td><div style={{ display: 'flex', gap: 4 }}>
                  {o.status === 'draft' && <button className="btn btn-primary btn-sm" onClick={() => updatePOStatus(o.id, 'sent')} style={{ padding: '4px 8px' }}>Send</button>}
                  {o.status === 'sent' && <button className="btn btn-success btn-sm" onClick={() => updatePOStatus(o.id, 'received')} style={{ padding: '4px 8px' }}>Received</button>}
                  {o.status === 'received' && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Complete</span>}
                </div></td>
              </tr>); })}</tbody></table></div></div>
      )}

      {showModal && <div className="modal-overlay" onClick={() => setShowModal(false)}><div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h3>{editId ? 'Edit Supplier' : 'Add Supplier'}</h3><button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-muted)' }}>×</button></div>
        <div className="modal-body">
          <div className="form-group"><label className="form-label">Company Name</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Contact Person</label><input className="form-input" value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Address</label><input className="form-input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Products (comma separated)</label><input className="form-input" value={form.products} onChange={e => setForm({ ...form, products: e.target.value })} /></div>
        </div>
        <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={saveSupplier}>Save</button></div>
      </div></div>}

      {showPOModal && <div className="modal-overlay" onClick={() => setShowPOModal(false)}><div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h3>Create Purchase Order</h3><button onClick={() => setShowPOModal(false)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-muted)' }}>×</button></div>
        <div className="modal-body">
          <div className="form-group"><label className="form-label">Supplier</label><select className="form-select" value={poForm.supplierId} onChange={e => setPoForm({ ...poForm, supplierId: Number(e.target.value) })}><option value={0} disabled>Select supplier...</option>{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Product</label>
            <select className="form-select" value={poForm.productId} onChange={e => {
              const pid = Number(e.target.value);
              const pName = products.find(p => p.id === pid)?.name || '';
              setPoForm({ ...poForm, productId: pid, items: `${pName} × ${poForm.quantity}` });
            }}>
              <option value={0} disabled>Select product...</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Quantity</label><input className="form-input" type="number" min={1} value={poForm.quantity} onChange={e => {
            const qty = Number(e.target.value);
            const pName = products.find(p => p.id === poForm.productId)?.name || '';
            setPoForm({ ...poForm, quantity: qty, items: poForm.productId ? `${pName} × ${qty}` : '' });
          }} /></div>
          <div className="form-group"><label className="form-label">Total Amount (₹)</label><input className="form-input" type="number" value={poForm.total} onChange={e => setPoForm({ ...poForm, total: Number(e.target.value) })} /></div>
        </div>
        <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowPOModal(false)}>Cancel</button><button className="btn btn-primary" onClick={createPO} disabled={!poForm.supplierId || !poForm.productId}>Create PO</button></div>
      </div></div>}
    </>
  );
}
