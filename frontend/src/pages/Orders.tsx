import { useEffect, useState, useMemo } from 'react';
import { Search, Download, Upload, Eye, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchOrders, updateOrderStatus, exportToCSV, createOrder, createCustomer } from '../services/api';
import BulkUpload from '../components/BulkUpload';
import { type Order, type Customer, type Product } from '../types';
import { type UserRole, ROLES } from '../services/auth';

const statusOptions: Order['status'][] = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Completed'];

export default function Orders({ globalSearch = '', userRole = 'admin' as UserRole }: { globalSearch?: string; userRole?: UserRole }) {
  const canExport = ROLES[userRole].canExport;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const perPage = 8;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => { 
    Promise.all([
      fetchOrders(), 
      import('../services/api').then(m => m.fetchCustomers()),
      import('../services/api').then(m => m.fetchProducts())
    ]).then(([o, c, p]) => { 
      setOrders(o); setCustomers(c); setProducts(p); setLoading(false); 
    }); 
  }, []);

  // Dynamically attach latest customer name based on ID
  const ordersWithLiveNames = useMemo(() => orders.map(o => {
    const liveCust = customers.find(c => c.id === o.customerId);
    return { ...o, customerName: liveCust ? liveCust.name : o.customerName };
  }), [orders, customers]);

  const filtered = useMemo(() => {
    return ordersWithLiveNames.filter(o => {
      const invString = `INV-${o.id.toString().padStart(4, '0')}`.toLowerCase();
      return (
        (o.customerName.toLowerCase().includes(search.toLowerCase()) || 
         invString.includes(search.toLowerCase()) || 
         String(o.id).includes(search)) &&
        o.customerName.toLowerCase().includes(globalSearch.toLowerCase()) &&
        (!statusFilter || o.status === statusFilter)
      );
    });
  }, [ordersWithLiveNames, search, statusFilter, globalSearch]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const handleStatusChange = async (id: number, status: Order['status']) => {
    await updateOrderStatus(id, status);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    if (selectedOrder?.id === id) setSelectedOrder(prev => prev ? { ...prev, status } : null);
  };

  const handleBulkUpload = async (data: any[]) => {
    for (const row of data) {
      if (row.customername && row.totalamount) {
        // Try to find customer by name, or create dummy
        let customerId = customers.find(c => c.name.toLowerCase() === String(row.customername).toLowerCase())?.id;
        if (!customerId) {
          const c = await createCustomer({ name: row.customername, email: 'bulk@import.com', phone: '0000000000' });
          customerId = c.id;
        }
        await createOrder({
          customerId: customerId || 1,
          customerName: row.customername,
          totalAmount: parseFloat(row.totalamount) || 0,
          status: (row.status as Order['status']) || 'Completed',
          shippingAddress: row.shippingaddress || 'Store Pickup',
          items: [] // Bulk import doesn't easily map nested items
        });
      }
    }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <>
      <div className="page-header"><h2>Order Management</h2><p>Track and manage customer orders.</p></div>
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-box"><Search size={16} /><input placeholder="Search orders..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></div>
          <select className="form-select" style={{ width: 160 }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option>
            {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="toolbar-right">
          {canExport && (
            <>
              <button className="btn btn-secondary" onClick={() => setShowBulkUpload(true)}><Upload size={14} />Import CSV</button>
              <button className="btn btn-secondary" onClick={() => exportToCSV(orders.map(o => ({ id: o.id, invoice: `INV-${o.id.toString().padStart(4, '0')}`, customer: o.customerName, date: o.orderDate, status: o.status, total: o.totalAmount })), 'orders')}><Download size={14} />Export CSV</button>
            </>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="data-table">
            <thead><tr><th>Order ID</th><th>Customer</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {paginated.map(o => (
                <tr key={o.id}>
                  <td style={{ fontWeight: 600 }}>INV-{o.id.toString().padStart(4, '0')}</td>
                  <td>{o.customerName}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{o.orderDate}</td>
                  <td>{o.items.length} items</td>
                  <td style={{ fontWeight: 600 }}>₹{o.totalAmount.toFixed(2)}</td>
                  <td>
                    <select
                      className="form-select"
                      style={{ width: 130, padding: '4px 8px', fontSize: 12, fontWeight: 600 }}
                      value={o.status}
                      onChange={e => handleStatusChange(o.id, e.target.value as Order['status'])}
                    >
                      {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td>
                    <button className="btn btn-secondary btn-icon btn-sm" onClick={() => setSelectedOrder(o)}><Eye size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="pagination">
        <span className="pagination-info">Showing {Math.min((page - 1) * perPage + 1, filtered.length)}–{Math.min(page * perPage, filtered.length)} of {filtered.length}</span>
        <div className="pagination-btns">
          <button className="pagination-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={14} /></button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} className={`pagination-btn ${page === i + 1 ? 'active' : ''}`} onClick={() => setPage(i + 1)}>{i + 1}</button>
          ))}
          <button className="pagination-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight size={14} /></button>
        </div>
      </div>

      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h3>Invoice INV-{selectedOrder.id.toString().padStart(4, '0')} Details</h3>
              <button className="btn btn-icon btn-secondary btn-sm" onClick={() => setSelectedOrder(null)}><X size={14} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                <div style={{ padding: 12, background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Customer</div>
                  <div style={{ fontWeight: 500 }}>{selectedOrder.customerName}</div>
                </div>
                <div style={{ padding: 12, background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Date</div>
                  <div style={{ fontWeight: 500 }}>{selectedOrder.orderDate}</div>
                </div>
                <div style={{ padding: 12, background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Status</div>
                  <span className={`badge badge-${selectedOrder.status.toLowerCase()}`}>{selectedOrder.status}</span>
                </div>
                <div style={{ padding: 12, background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Shipping</div>
                  <div style={{ fontWeight: 500, fontSize: 12 }}>{selectedOrder.shippingAddress}</div>
                </div>
              </div>

              <h4 style={{ fontSize: 14, marginBottom: 12 }}>Order Items</h4>
              <table className="data-table">
                <thead><tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
                <tbody>
                  {selectedOrder.items.map(item => {
                    const liveProd = products.find(p => p.id === item.productId);
                    const prodName = liveProd ? liveProd.name : item.productName;
                    return (
                      <tr key={item.id}>
                        <td>{prodName}</td><td>{item.quantity}</td>
                        <td>₹{item.unitPrice.toFixed(2)}</td><td style={{ fontWeight: 600 }}>₹{item.totalPrice.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                  <tr><td colSpan={3} style={{ textAlign: 'right', fontWeight: 600 }}>Grand Total</td><td style={{ fontWeight: 700, color: 'var(--accent-blue)', fontSize: 15 }}>₹{selectedOrder.totalAmount.toFixed(2)}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showBulkUpload && (
        <BulkUpload 
          type="orders" 
          onClose={() => setShowBulkUpload(false)} 
          onSuccess={() => fetchOrders().then(setOrders)}
          onUpload={handleBulkUpload}
        />
      )}
    </>
  );
}
