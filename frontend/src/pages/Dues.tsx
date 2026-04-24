import { useState, useEffect } from 'react';
import { Search, Download, IndianRupee, Users, Truck, AlertCircle, CheckCircle, Clock, Plus, CreditCard, X } from 'lucide-react';
import { fetchDues, createDue, exportToCSV, type Due } from '../services/api';
import { type UserRole, ROLES } from '../services/auth';

interface DuesProps {
  userRole: UserRole;
}

export default function Dues({ userRole }: DuesProps) {
  const user = { role: userRole };
  const [tab, setTab] = useState<'supplier' | 'customer'>('customer');
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [dues, setDues] = useState<Due[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [dueName, setDueName] = useState('');
  const [dueContact, setDueContact] = useState('');
  const [dueAmount, setDueAmount] = useState(0);
  const [dueStatus, setDueStatus] = useState('Due Soon');
  
  const [payAmount, setPayAmount] = useState(0);
  const [payingId, setPayingId] = useState<number | null>(null);

  const [, forceUpdate] = useState(0);
  const refresh = () => forceUpdate(n => n + 1);

  useEffect(() => {
    setLoading(true);
    fetchDues(tab.toUpperCase()).then(data => {
      setDues(data);
      setLoading(false);
    });
  }, [tab, forceUpdate]);

  const filteredDues = dues.filter(d => 
    d.entityName.toLowerCase().includes(search.toLowerCase())
  );

  const totalDue = dues.reduce((a, d) => a + d.totalDue, 0);
  const overdueCount = dues.filter(d => d.status === 'Overdue').length;

  const handleCreateDue = () => {
    if (!dueName.trim() || dueAmount <= 0) return;
    
    createDue({
      type: tab.toUpperCase(),
      entityName: dueName,
      contact: dueContact,
      totalDue: dueAmount,
      status: dueStatus,
      lastOrderDate: new Date().toISOString()
    }).then(() => {
      setShowCreateModal(false);
      setDueName(''); setDueContact(''); setDueAmount(0);
      refresh();
    });
  };

  const handlePayDue = () => {
    if (!payingId || payAmount <= 0) return;
    // Real payment logic would go here, for now we just refresh
    setShowPayModal(false);
    setPayingId(null);
    setPayAmount(0);
    refresh();
  };

  const statusIcon = (status: string) => {
    if (status === 'Overdue') return <AlertCircle size={14} />;
    if (status === 'Due Soon') return <Clock size={14} />;
    return <CheckCircle size={14} />;
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

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-info">
            <h4>Total Outstanding</h4>
            <div className="stat-value">₹{totalDue.toLocaleString('en-IN')}</div>
          </div>
          <div className="stat-icon blue"><IndianRupee size={22} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h4>Overdue Accounts</h4>
            <div className="stat-value" style={{ color: 'var(--accent-red)' }}>{overdueCount}</div>
          </div>
          <div className="stat-icon red"><AlertCircle size={22} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h4>Active Dues</h4>
            <div className="stat-value">{dues.length}</div>
          </div>
          <div className="stat-icon orange"><Clock size={22} /></div>
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
            <input 
              type="text" 
              placeholder={`Search ${tab}s...`} 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading real data...</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
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
                  <tr key={d.id}>
                    <td>#{d.id}</td>
                    <td style={{ fontWeight: 600 }}>{d.entityName}</td>
                    <td>{d.contact}</td>
                    <td style={{ fontWeight: 700, color: d.totalDue > 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                      ₹{d.totalDue.toLocaleString('en-IN')}
                    </td>
                    <td>{new Date(d.lastOrderDate).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge badge-${d.status.toLowerCase().replace(' ', '-')}`} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {statusIcon(d.status)} {d.status}
                      </span>
                    </td>
                    <td>
                      {d.totalDue > 0 && (
                        <button className="btn btn-sm btn-outline" onClick={() => { setPayingId(d.id); setPayAmount(d.totalDue); setShowPayModal(true); }}>
                          <CreditCard size={14} /> Pay
                        </button>
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
                <label>Name</label>
                <input type="text" value={dueName} onChange={(e) => setDueName(e.target.value)} placeholder="Full Name" />
              </div>
              <div className="form-group">
                <label>Contact Info</label>
                <input type="text" value={dueContact} onChange={(e) => setDueContact(e.target.value)} placeholder="Email or Phone" />
              </div>
              <div className="form-group">
                <label>Due Amount (₹)</label>
                <input type="number" value={dueAmount} onChange={(e) => setDueAmount(Number(e.target.value))} />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={dueStatus} onChange={(e) => setDueStatus(e.target.value)}>
                  <option value="Due Soon">Due Soon</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleCreateDue}>Create Entry</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pay Due Modal */}
      {showPayModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3>Record Payment</h3>
              <button className="close-btn" onClick={() => setShowPayModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>Recording a partial or full payment for this outstanding due.</p>
              <div className="form-group">
                <label>Payment Amount (₹)</label>
                <input type="number" value={payAmount} onChange={(e) => setPayAmount(Number(e.target.value))} max={dues.find(d => d.id === payingId)?.totalDue} />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowPayModal(false)}>Cancel</button>
                <button className="btn btn-success" style={{ flex: 1 }} onClick={handlePayDue}>Confirm Payment</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
