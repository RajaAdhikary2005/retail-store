import { useState, useEffect } from 'react';
import { Search, Download, IndianRupee, Users, Truck, AlertCircle, CheckCircle, Clock, Plus, CreditCard, X } from 'lucide-react';
import { fetchDues, createDue, exportToCSV, fetchCustomers, fetchSuppliers, type Due } from '../services/api';
import { type UserRole, ROLES } from '../services/auth';
import type { Customer } from '../types';

interface DuesProps { userRole: UserRole; }

export default function Dues({ userRole }: DuesProps) {
  const user = { role: userRole };
  const [tab, setTab] = useState<'supplier' | 'customer'>('customer');
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [dues, setDues] = useState<Due[]>([]);
  const [loading, setLoading] = useState(true);

  // Existing entities for dropdown
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  // Form states
  const [selectedEntityId, setSelectedEntityId] = useState(0);
  const [dueName, setDueName] = useState('');
  const [dueContact, setDueContact] = useState('');
  const [dueAmount, setDueAmount] = useState(0);
  const [dueStatus, setDueStatus] = useState('Due Soon');

  const [payAmount, setPayAmount] = useState(0);
  const [payingDue, setPayingDue] = useState<Due | null>(null);
  const [payMsg, setPayMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [payProcessing, setPayProcessing] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => setRefreshKey(n => n + 1);

  useEffect(() => {
    setLoading(true);
    fetchDues(tab.toUpperCase()).then(data => {
      setDues(data);
      setLoading(false);
    });
  }, [tab, refreshKey]);

  // Load customers & suppliers for dropdowns
  useEffect(() => {
    fetchCustomers().then(setCustomers);
    fetchSuppliers().then(setSuppliers);
  }, []);

  const filteredDues = dues.filter(d => {
    const dueIdStr = `DUE-${d.id.toString().padStart(4, '0')}`.toLowerCase();
    return d.entityName.toLowerCase().includes(search.toLowerCase()) || 
           dueIdStr.includes(search.toLowerCase());
  });

  const totalDue = dues.reduce((a, d) => a + d.totalDue, 0);
  const overdueCount = dues.filter(d => d.status === 'Overdue').length;
  const paidCount = dues.filter(d => d.status === 'Paid' || d.totalDue <= 0).length;

  // When selecting entity from dropdown, auto-fill name & contact
  const handleEntitySelect = (id: number) => {
    setSelectedEntityId(id);
    if (tab === 'customer') {
      const c = customers.find(c => c.id === id);
      if (c) { setDueName(c.name); setDueContact(c.phone || c.email || ''); }
    } else {
      const s = suppliers.find(s => s.id === id);
      if (s) { setDueName(s.name); setDueContact(s.phone || s.email || ''); }
    }
  };

  const handleCreateDue = () => {
    if (!dueName.trim() || dueAmount <= 0) return;
    createDue({
      type: tab.toUpperCase(),
      entityId: selectedEntityId || null,
      entityName: dueName,
      contact: dueContact,
      totalDue: dueAmount,
      status: dueStatus,
      lastOrderDate: new Date().toISOString()
    }).then(() => {
      setShowCreateModal(false);
      setDueName(''); setDueContact(''); setDueAmount(0); setSelectedEntityId(0);
      refresh();
    });
  };

  const openPayModal = (d: Due) => {
    setPayingDue(d);
    setPayAmount(d.totalDue);
    setPayMsg(null);
    setShowPayModal(true);
  };

  const handlePayDue = async () => {
    if (!payingDue || payAmount <= 0) return;
    setPayProcessing(true);
    setPayMsg(null);
    try {
      const res = await fetch(`https://retail-store-k6pr.onrender.com/api/dues/${payingDue.id}/pay`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: payAmount })
      });
      if (res.ok) {
        const remaining = payingDue.totalDue - payAmount;
        setPayMsg({ type: 'success', text: remaining <= 0
          ? `✓ Full payment received! Due marked as Paid.`
          : `✓ ₹${payAmount.toLocaleString('en-IN')} received. Remaining: ₹${remaining.toLocaleString('en-IN')}`
        });
        // Update local state immediately
        setDues(prev => prev.map(d => {
          if (d.id === payingDue.id) {
            return { ...d, totalDue: Math.max(0, d.totalDue - payAmount), status: remaining <= 0 ? 'Paid' : d.status };
          }
          return d;
        }));
        setTimeout(() => { setShowPayModal(false); setPayingDue(null); setPayAmount(0); setPayMsg(null); }, 2000);
      } else {
        const errText = await res.text();
        setPayMsg({ type: 'error', text: errText || 'Payment failed' });
      }
    } catch {
      setPayMsg({ type: 'error', text: 'Network error — payment failed' });
    } finally {
      setPayProcessing(false);
    }
  };

  const statusIcon = (status: string) => {
    if (status === 'Overdue') return <AlertCircle size={14} />;
    if (status === 'Paid') return <CheckCircle size={14} />;
    if (status === 'Due Soon') return <Clock size={14} />;
    return <CheckCircle size={14} />;
  };

  const statusBadgeClass = (status: string) => {
    if (status === 'Overdue') return 'badge-cancelled';
    if (status === 'Paid') return 'badge-delivered';
    return 'badge-processing';
  };

  return (
    <>
      <div className="page-header">
        <h2>Dues & Payments</h2>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => exportToCSV(dues, `${tab}-dues`)}>
            <Download size={18} /> Export
          </button>
          {ROLES[user.role].canEdit.dues && (
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={18} /> Create Due
            </button>
          )}
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-info"><h4>Total Outstanding</h4><div className="stat-value">₹{totalDue.toLocaleString('en-IN')}</div></div>
          <div className="stat-icon blue"><IndianRupee size={22} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info"><h4>Overdue</h4><div className="stat-value" style={{ color: 'var(--accent-red)' }}>{overdueCount}</div></div>
          <div className="stat-icon red"><AlertCircle size={22} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info"><h4>Active Dues</h4><div className="stat-value">{dues.filter(d => d.status !== 'Paid' && d.totalDue > 0).length}</div></div>
          <div className="stat-icon orange"><Clock size={22} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info"><h4>Paid / Settled</h4><div className="stat-value" style={{ color: 'var(--accent-green)' }}>{paidCount}</div></div>
          <div className="stat-icon green"><CheckCircle size={22} /></div>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ borderBottom: 'none' }}>
          <div className="tabs">
            <button className={`tab ${tab === 'customer' ? 'active' : ''}`} onClick={() => setTab('customer')}>
              <Users size={16} /> Customer Dues
            </button>
            <button className={`tab ${tab === 'supplier' ? 'active' : ''}`} onClick={() => setTab('supplier')}>
              <Truck size={16} /> Supplier Dues
            </button>
          </div>
          <div className="search-bar" style={{ width: 300 }}>
            <Search size={18} />
            <input type="text" placeholder={`Search ${tab}s...`} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
          ) : filteredDues.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No {tab} dues found.</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Due Ref</th>
                  <th>{tab === 'customer' ? 'Customer' : 'Supplier'} Name</th>
                  <th>Contact Info</th>
                  <th>Total Due</th>
                  <th>Last Transaction</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDues.map(d => (
                  <tr key={d.id} style={{ opacity: d.status === 'Paid' || d.totalDue <= 0 ? 0.6 : 1 }}>
                    <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>DUE-{d.id.toString().padStart(4, '0')}</td>
                    <td style={{ fontWeight: 600 }}>{d.entityName}</td>
                    <td>{d.contact}</td>
                    <td style={{ fontWeight: 700, color: d.totalDue > 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                      {d.totalDue <= 0 ? '₹0 (Settled)' : `₹${d.totalDue.toLocaleString('en-IN')}`}
                    </td>
                    <td>{d.lastOrderDate ? new Date(d.lastOrderDate).toLocaleDateString() : '—'}</td>
                    <td>
                      <span className={`badge ${statusBadgeClass(d.status)}`} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {statusIcon(d.status)} {d.status}
                      </span>
                    </td>
                    <td>
                      {d.totalDue > 0 && d.status !== 'Paid' && (
                        <button className="btn btn-sm btn-outline" onClick={() => openPayModal(d)}>
                          <CreditCard size={14} /> {tab === 'customer' ? 'Received' : 'Pay'}
                        </button>
                      )}
                      {(d.status === 'Paid' || d.totalDue <= 0) && (
                        <span style={{ fontSize: 12, color: 'var(--accent-green)', fontWeight: 600 }}>✓ Settled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Due Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create New {tab === 'customer' ? 'Customer' : 'Supplier'} Due</h3>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Select {tab === 'customer' ? 'Customer' : 'Supplier'}</label>
                <select className="form-select" value={selectedEntityId} onChange={e => handleEntitySelect(Number(e.target.value))}>
                  <option value={0}>— Choose from existing —</option>
                  {tab === 'customer'
                    ? customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone || c.email})</option>)
                    : suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.phone || s.email})</option>)
                  }
                </select>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Or type a new name below</div>
              </div>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input className="form-input" type="text" value={dueName} onChange={e => setDueName(e.target.value)} placeholder="Full Name" />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Info</label>
                <input className="form-input" type="text" value={dueContact} onChange={e => setDueContact(e.target.value)} placeholder="Email or Phone" />
              </div>
              <div className="form-group">
                <label className="form-label">Due Amount (₹)</label>
                <input className="form-input" type="number" value={dueAmount || ''} onChange={e => setDueAmount(Number(e.target.value))} placeholder="0" min={1} />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={dueStatus} onChange={e => setDueStatus(e.target.value)}>
                  <option value="Due Soon">Due Soon</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleCreateDue} disabled={!dueName.trim() || dueAmount <= 0}>Create Entry</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pay/Receive Due Modal */}
      {showPayModal && payingDue && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3>{tab === 'customer' ? 'Record Payment Received' : 'Record Payment Sent'}</h3>
              <button className="close-btn" onClick={() => { setShowPayModal(false); setPayMsg(null); }}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div style={{ padding: '12px 16px', background: 'var(--bg-primary)', borderRadius: 8, marginBottom: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{payingDue.entityName}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Outstanding: ₹{payingDue.totalDue.toLocaleString('en-IN')}</div>
              </div>

              <div className="form-group">
                <label className="form-label">{tab === 'customer' ? 'Amount Received (₹)' : 'Amount Paid (₹)'}</label>
                <input className="form-input" type="number" value={payAmount || ''} onChange={e => setPayAmount(Number(e.target.value))} max={payingDue.totalDue} min={1} />
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  <button className="btn btn-sm btn-secondary" style={{ fontSize: 11 }} onClick={() => setPayAmount(payingDue.totalDue)}>Full Amount</button>
                  <button className="btn btn-sm btn-secondary" style={{ fontSize: 11 }} onClick={() => setPayAmount(Math.round(payingDue.totalDue / 2))}>Half</button>
                </div>
              </div>

              {payMsg && (
                <div style={{
                  padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, marginBottom: 12,
                  background: payMsg.type === 'success' ? 'var(--accent-green-light)' : 'var(--accent-red-light)',
                  color: payMsg.type === 'success' ? 'var(--accent-green)' : 'var(--accent-red)',
                }}>
                  {payMsg.text}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setShowPayModal(false); setPayMsg(null); }}>Cancel</button>
                <button className="btn btn-success" style={{ flex: 1 }} onClick={handlePayDue}
                  disabled={payProcessing || payAmount <= 0 || payAmount > payingDue.totalDue || payMsg?.type === 'success'}>
                  {payProcessing ? 'Processing...' : tab === 'customer' ? `Confirm Received ₹${payAmount.toLocaleString('en-IN')}` : `Confirm Payment ₹${payAmount.toLocaleString('en-IN')}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
