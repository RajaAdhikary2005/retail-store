import { useEffect, useState, useMemo } from 'react';
import { Search, Download, Upload, Eye, X, ChevronLeft, ChevronRight, Edit2 } from 'lucide-react';
import { fetchCustomers, exportToCSV, createCustomer, updateCustomer } from '../services/api';
import BulkUpload from '../components/BulkUpload';
import type { Customer } from '../types';
import { type UserRole, ROLES } from '../services/auth';

export default function Customers({ globalSearch = '', userRole = 'admin' as UserRole }: { globalSearch?: string; userRole?: UserRole }) {
  const canExport = ROLES[userRole].canExport;
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const perPage = 8;

  useEffect(() => { 
    Promise.all([
      fetchCustomers(),
      import('../services/api').then(m => m.fetchOrders())
    ]).then(([c, o]) => { 
      setCustomers(c); 
      setOrders(o);
      setLoading(false); 
    }); 
  }, []);

  // Dynamically calculate totalOrders and totalSpent for each customer
  const customersWithLiveStats = useMemo(() => {
    return customers.map(c => {
      const custOrders = orders.filter(o => o.customerId === c.id);
      return {
        ...c,
        totalOrders: custOrders.length,
        totalSpent: custOrders.filter(o => o.status !== 'Cancelled').reduce((sum, o) => sum + o.totalAmount, 0)
      };
    });
  }, [customers, orders]);

  const filtered = useMemo(() => {
    return customersWithLiveStats.filter(c =>
      (c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.city.toLowerCase().includes(search.toLowerCase())) &&
      c.name.toLowerCase().includes(globalSearch.toLowerCase())
    );
  }, [customersWithLiveStats, search, globalSearch]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const customerOrders = selectedCustomer
    ? orders.filter(o => o.customerId === selectedCustomer.id)
    : [];

  const handleBulkUpload = async (data: any[]) => {
    for (const row of data) {
      if (row.name && row.email) {
        await createCustomer({
          name: row.name,
          email: row.email,
          phone: row.phone || '',
          address: row.address || '',
          city: row.city || '',
          state: row.state || '',
          zipCode: row.zipcode || row.zip_code || '',
        });
      }
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCustomer) return;
    const fd = new FormData(e.target as HTMLFormElement);
    const data = {
      name: fd.get('name') as string, email: fd.get('email') as string,
      phone: fd.get('phone') as string, city: fd.get('city') as string,
      state: fd.get('state') as string,
    };
    try {
      const updated = await updateCustomer(editCustomer.id, data);
      setCustomers(customers.map(c => c.id === updated.id ? { ...c, ...updated } : c));
      setEditCustomer(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update customer');
    }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <>
      <div className="page-header"><h2>Customer Management</h2><p>View and manage your customer base.</p></div>
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-box"><Search size={16} /><input placeholder="Search customers..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></div>
        </div>
        <div className="toolbar-right">
          {canExport && (
            <>
              <button className="btn btn-secondary" onClick={() => setShowBulkUpload(true)}><Upload size={14} />Import CSV</button>
              <button className="btn btn-secondary" onClick={() => exportToCSV(customers as unknown as Record<string, unknown>[], 'customers')}><Download size={14} />Export CSV</button>
            </>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="data-table">
            <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>City</th><th>Orders</th><th>Total Spent</th><th>Actions</th></tr></thead>
            <tbody>
              {paginated.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>#{c.id}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
                        {c.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span style={{ fontWeight: 500 }}>{c.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{c.email}</td>
                  <td>{c.phone}</td>
                  <td>{c.city}</td>
                  <td style={{ fontWeight: 600 }}>{c.totalOrders}</td>
                  <td style={{ fontWeight: 600, color: 'var(--accent-green)' }}>₹{c.totalSpent.toFixed(2)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-secondary btn-icon btn-sm" onClick={() => setSelectedCustomer(c)} title="View"><Eye size={13} /></button>
                      <button className="btn btn-primary btn-icon btn-sm" onClick={() => setEditCustomer(c)} title="Edit"><Edit2 size={13} /></button>
                    </div>
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

      {selectedCustomer && (
        <div className="modal-overlay" onClick={() => setSelectedCustomer(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h3>Customer Details</h3>
              <button className="btn btn-icon btn-secondary btn-sm" onClick={() => setSelectedCustomer(null)}><X size={14} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 20, fontWeight: 600 }}>
                  {selectedCustomer.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 600 }}>{selectedCustomer.name}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{selectedCustomer.email}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                <div style={{ padding: 12, background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Phone</div>
                  <div style={{ fontWeight: 500 }}>{selectedCustomer.phone}</div>
                </div>
                <div style={{ padding: 12, background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Location</div>
                  <div style={{ fontWeight: 500 }}>{selectedCustomer.city}, {selectedCustomer.state}</div>
                </div>
                <div style={{ padding: 12, background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Total Orders</div>
                  <div style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>{selectedCustomer.totalOrders}</div>
                </div>
                <div style={{ padding: 12, background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Total Spent</div>
                  <div style={{ fontWeight: 600, color: 'var(--accent-green)' }}>₹{selectedCustomer.totalSpent.toFixed(2)}</div>
                </div>
              </div>

              {customerOrders.length > 0 && (
                <>
                  <h4 style={{ fontSize: 14, marginBottom: 12 }}>Purchase History</h4>
                  <table className="data-table">
                    <thead><tr><th>Order ID</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
                    <tbody>
                      {customerOrders.map(o => (
                        <tr key={o.id}>
                          <td>#{o.id}</td><td>{o.orderDate}</td>
                          <td>₹{o.totalAmount.toFixed(2)}</td>
                          <td><span className={`badge badge-${o.status.toLowerCase()}`}>{o.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showBulkUpload && (
        <BulkUpload 
          type="customers" 
          onClose={() => setShowBulkUpload(false)} 
          onSuccess={() => fetchCustomers().then(setCustomers)}
          onUpload={handleBulkUpload}
        />
      )}

      {editCustomer && (
        <div className="modal-overlay" onClick={() => setEditCustomer(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Customer</h3>
              <button className="btn btn-icon btn-secondary btn-sm" onClick={() => setEditCustomer(null)}><X size={14} /></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSaveEdit}>
                <div className="form-group"><label>Name *</label><input name="name" required className="form-input" defaultValue={editCustomer.name} /></div>
                <div className="form-group"><label>Email *</label><input name="email" required type="email" className="form-input" defaultValue={editCustomer.email} /></div>
                <div className="form-group"><label>Phone</label><input name="phone" className="form-input" defaultValue={editCustomer.phone} /></div>
                <div className="form-group"><label>City</label><input name="city" className="form-input" defaultValue={editCustomer.city} /></div>
                <div className="form-group"><label>State</label><input name="state" className="form-input" defaultValue={editCustomer.state} /></div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setEditCustomer(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
