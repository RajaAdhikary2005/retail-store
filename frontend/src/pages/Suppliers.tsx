import { useState, useEffect } from 'react';
import { Truck, Plus, Edit, Trash2, Package, Phone, Mail, MapPin, FileText, Clock, CheckCircle, X } from 'lucide-react';
import { fetchSuppliers, createSupplier, type Supplier, fetchProducts, fetchPOs, createPO, type PurchaseOrder } from '../services/api';
import type { Product } from '../types';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'suppliers' | 'orders'>('suppliers');
  
  const [, forceUpdate] = useState(0);
  const refresh = () => forceUpdate(n => n + 1);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchSuppliers(), fetchProducts(), fetchPOs()]).then(([s, p, o]) => {
      setSuppliers(s);
      setProducts(p);
      setOrders(o);
      setLoading(false);
    });
  }, [forceUpdate]);

  const [showModal, setShowModal] = useState(false);
  const [showPOModal, setShowPOModal] = useState(false);
  const [form, setForm] = useState({ name: '', contactPerson: '', email: '', phone: '', category: '' });
  const [poForm, setPoForm] = useState({ supplierId: 0, supplierName: '', productNames: '', totalAmount: 0 });

  const handleSaveSupplier = () => {
    createSupplier(form).then(() => {
      setShowModal(false);
      refresh();
    });
  };

  const handleCreatePO = () => {
    createPO({ ...poForm, status: 'Pending' }).then(() => {
      setShowPOModal(false);
      refresh();
    });
  };

  const statusBadge = (status: string) => (
    <span className={`badge badge-${status.toLowerCase()}`}>
      {status === 'Received' ? <CheckCircle size={12} /> : <Clock size={12} />}
      {status}
    </span>
  );

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
              <Truck size={16} /> Suppliers
            </button>
            <button className={`tab ${tab === 'orders' ? 'active' : ''}`} onClick={() => setTab('orders')}>
              <FileText size={16} /> Purchase Orders
            </button>
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {tab === 'suppliers' ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Supplier</th>
                  <th>Contact</th>
                  <th>Email</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map(s => (
                  <tr key={s.id}>
                    <td>#{s.id}</td>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td>{s.contactPerson}</td>
                    <td>{s.email}</td>
                    <td>{s.category}</td>
                    <td><span className="badge badge-success">{s.status}</span></td>
                    <td>
                      <button className="btn btn-icon"><Edit size={16} /></button>
                      <button className="btn btn-icon text-danger"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>PO #</th>
                  <th>Supplier</th>
                  <th>Products</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
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
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Supplier Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add New Supplier</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Supplier Name</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Contact Person</label>
                <input type="text" value={form.contactPerson} onChange={e => setForm({...form, contactPerson: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Category</label>
                <input type="text" value={form.category} onChange={e => setForm({...form, category: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSaveSupplier}>Save Supplier</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
