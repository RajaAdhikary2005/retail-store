import { useState, useEffect } from 'react';
import { Search, Download, IndianRupee, Users, Truck, AlertCircle, CheckCircle, Clock, Plus, CreditCard, X } from 'lucide-react';
import { exportToCSV } from '../services/api';
import { type UserRole, ROLES } from '../services/auth';

interface SupplierDue {
  id: number;
  supplierId: number;
  supplierName: string;
  contact: string;
  totalDue: number;
  lastPaymentDate: string;
  status: 'Overdue' | 'Due Soon' | 'Paid';
  invoices: number;
}

interface CustomerDue {
  id: number;
  customerId: number;
  customerName: string;
  email: string;
  totalDue: number;
  lastOrderDate: string;
  status: 'Overdue' | 'Due Soon' | 'Paid';
  pendingOrders: number;
}

let MOCK_SUPPLIER_DUES: SupplierDue[] = [
  { id: 1, supplierId: 1, supplierName: 'TechWorld Electronics', contact: 'Rajesh Kumar', totalDue: 145000, lastPaymentDate: '2025-03-15', status: 'Overdue', invoices: 3 },
  { id: 2, supplierId: 2, supplierName: 'FreshMart Groceries', contact: '+91 98765 22222', totalDue: 12500, lastPaymentDate: '2025-04-10', status: 'Due Soon', invoices: 2 },
  { id: 3, supplierId: 3, supplierName: 'FootGear India', contact: '+91 98765 33333', totalDue: 0, lastPaymentDate: '2025-04-18', status: 'Paid', invoices: 0 },
  { id: 4, supplierId: 4, supplierName: 'HomeStyle Furnishings', contact: '+91 98765 44444', totalDue: 28750, lastPaymentDate: '2025-02-28', status: 'Overdue', invoices: 4 },
  { id: 5, supplierId: 5, supplierName: 'ActiveSport Suppliers', contact: '+91 98765 55555', totalDue: 8200, lastPaymentDate: '2025-04-12', status: 'Due Soon', invoices: 1 },
  { id: 6, supplierId: 6, supplierName: 'UrbanWear Clothing', contact: '+91 98765 66666', totalDue: 0, lastPaymentDate: '2025-04-20', status: 'Paid', invoices: 0 },
];

let MOCK_CUSTOMER_DUES: CustomerDue[] = [
  { id: 1, customerId: 3, customerName: 'Rahul Gupta', email: 'rahul.gupta@email.com', totalDue: 172.47, lastOrderDate: '2025-04-17', status: 'Due Soon', pendingOrders: 1 },
  { id: 2, customerId: 2, customerName: 'Priya Patel', email: 'priya.patel@email.com', totalDue: 172.47, lastOrderDate: '2025-04-17', status: 'Due Soon', pendingOrders: 1 },
  { id: 3, customerId: 5, customerName: 'Vikram Singh', email: 'vikram.singh@email.com', totalDue: 0, lastOrderDate: '2025-04-19', status: 'Paid', pendingOrders: 0 },
  { id: 4, customerId: 1, customerName: 'Arjun Sharma', email: 'arjun@email.com', totalDue: 15600, lastOrderDate: '2025-04-10', status: 'Due Soon', pendingOrders: 2 },
  { id: 5, customerId: 4, customerName: 'Sneha Reddy', email: 'sneha.reddy@email.com', totalDue: 0, lastOrderDate: '2025-04-15', status: 'Paid', pendingOrders: 0 },
  { id: 6, customerId: 7, customerName: 'Karan Mehta', email: 'karan.mehta@email.com', totalDue: 0, lastOrderDate: '2025-04-16', status: 'Paid', pendingOrders: 0 },
];

const statusIcon = (status: string) => {
  if (status === 'Overdue') return <AlertCircle size={14} />;
  if (status === 'Due Soon') return <Clock size={14} />;
  return <CheckCircle size={14} />;
};

const statusBadge = (status: string) => {
  if (status === 'Overdue') return 'badge-cancelled';
  if (status === 'Due Soon') return 'badge-pending';
  return 'badge-delivered';
};

export default function Dues({ userRole = 'admin' as UserRole }: { userRole?: UserRole }) {
  const canExport = ROLES[userRole].canExport;
  const [tab, setTab] = useState<'supplier' | 'customer'>('supplier');
  const [search, setSearch] = useState('');
  
  // Local state for mutability
  const [, forceUpdate] = useState(0);
  const refresh = () => forceUpdate((n: number) => n + 1);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  
  const [dueName, setDueName] = useState('');
  const [dueContact, setDueContact] = useState('');
  const [dueAmount, setDueAmount] = useState(0);
  const [dueStatus, setDueStatus] = useState<'Overdue' | 'Due Soon'>('Due Soon');
  
  const [payAmount, setPayAmount] = useState(0);
  const [payingId, setPayingId] = useState<number | null>(null);

  const totalSupplierDue = MOCK_SUPPLIER_DUES.reduce((a, s) => a + s.totalDue, 0);
  const totalCustomerDue = MOCK_CUSTOMER_DUES.reduce((a, c) => a + c.totalDue, 0);
  const overdueSuppliers = MOCK_SUPPLIER_DUES.filter(s => s.status === 'Overdue').length;
  const overdueCustomers = MOCK_CUSTOMER_DUES.filter(c => c.status === 'Overdue').length;

  const [customers, setCustomers] = useState<any[]>([]);
  
  useEffect(() => {
    import('../services/api').then(m => m.fetchCustomers().then(c => setCustomers(c)));
  }, []);

  const filteredSuppliers = MOCK_SUPPLIER_DUES.filter(s =>
    s.supplierName.toLowerCase().includes(search.toLowerCase())
  );
  const filteredCustomers = MOCK_CUSTOMER_DUES.map(c => {
    const liveCust = customers.find(lc => lc.id === c.customerId);
    return { ...c, customerName: liveCust ? liveCust.name : c.customerName };
  }).filter(c =>
    c.customerName.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateDue = () => {
    if (!dueName.trim() || dueAmount <= 0) return;
    
    if (tab === 'supplier') {
      MOCK_SUPPLIER_DUES.unshift({
        id: Date.now(),
        supplierId: Date.now(),
        supplierName: dueName,
        contact: dueContact,
        totalDue: dueAmount,
        lastPaymentDate: new Date().toISOString().split('T')[0],
        status: dueStatus,
        invoices: 1
      });
    } else {
      MOCK_CUSTOMER_DUES.unshift({
        id: Date.now(),
        customerId: Date.now(),
        customerName: dueName,
        email: dueContact,
        totalDue: dueAmount,
        lastOrderDate: new Date().toISOString().split('T')[0],
        status: dueStatus,
        pendingOrders: 1
      });
    }
    setShowCreateModal(false);
    setDueName(''); setDueContact(''); setDueAmount(0);
    refresh();
  };

  const handlePayDue = () => {
    if (!payingId || payAmount <= 0) return;

    if (tab === 'supplier') {
      const item = MOCK_SUPPLIER_DUES.find(s => s.id === payingId);
      if (item) {
        item.totalDue = Math.max(0, item.totalDue - payAmount);
        if (item.totalDue === 0) item.status = 'Paid';
        item.lastPaymentDate = new Date().toISOString().split('T')[0];
      }
    } else {
      const item = MOCK_CUSTOMER_DUES.find(c => c.id === payingId);
      if (item) {
        item.totalDue = Math.max(0, item.totalDue - payAmount);
        if (item.totalDue === 0) item.status = 'Paid';
      }
    }
    setShowPayModal(false);
    setPayingId(null);
    setPayAmount(0);
    refresh();
  };

  const openPayModal = (id: number, currentDue: number) => {
    setPayingId(id);
    setPayAmount(currentDue);
    setShowPayModal(true);
  };

  return (
    <>
      <div className="page-header">
        <h2>Dues & Payments</h2>
        <p>Track supplier dues, customer outstanding payments, and process settlements.</p>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-info">
            <h4>Total Supplier Dues</h4>
            <div className="stat-value">₹{totalSupplierDue.toLocaleString()}</div>
            <div className="stat-change negative">{overdueSuppliers} overdue</div>
          </div>
          <div className="stat-icon orange"><Truck size={22} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h4>Total Customer Dues</h4>
            <div className="stat-value">₹{totalCustomerDue.toLocaleString()}</div>
            <div className="stat-change negative">{overdueCustomers} overdue</div>
          </div>
          <div className="stat-icon purple"><Users size={22} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h4>Pending Invoices</h4>
            <div className="stat-value">{MOCK_SUPPLIER_DUES.reduce((a, s) => a + s.invoices, 0)}</div>
            <div className="stat-change positive">From suppliers</div>
          </div>
          <div className="stat-icon blue"><IndianRupee size={22} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h4>Net Balance</h4>
            <div className="stat-value" style={{ color: 'var(--accent-red)' }}>₹{(totalSupplierDue + totalCustomerDue).toLocaleString()}</div>
            <div className="stat-change negative">Total outstanding</div>
          </div>
          <div className="stat-icon green"><IndianRupee size={22} /></div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        <button
          className={`btn ${tab === 'supplier' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setTab('supplier'); setSearch(''); }}
        >
          <Truck size={14} /> Supplier Dues
        </button>
        <button
          className={`btn ${tab === 'customer' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setTab('customer'); setSearch(''); }}
        >
          <Users size={14} /> Customer Dues
        </button>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <Search size={16} />
            <input placeholder={`Search ${tab}s...`} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="toolbar-right">
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={14} /> Create {tab === 'supplier' ? 'Supplier Due' : 'Customer Due'}
          </button>
          {canExport && <button className="btn btn-secondary" onClick={() => {
            if (tab === 'supplier') exportToCSV(MOCK_SUPPLIER_DUES as unknown as Record<string, unknown>[], 'supplier_dues');
            else exportToCSV(MOCK_CUSTOMER_DUES as unknown as Record<string, unknown>[], 'customer_dues');
          }}>
            <Download size={14} /> Export CSV
          </button>}
        </div>
      </div>

      {/* Supplier Dues Table */}
      {tab === 'supplier' && (
        <div className="card">
          <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th><th>Supplier Name</th><th>Contact</th>
                  <th>Pending Invoices</th><th>Total Due</th>
                  <th>Last Payment</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>#{s.id}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: 'var(--accent-orange-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-orange)', flexShrink: 0 }}>
                          <Truck size={14} />
                        </div>
                        <span style={{ fontWeight: 500 }}>{s.supplierName}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{s.contact}</td>
                    <td style={{ fontWeight: 600 }}>{s.invoices}</td>
                    <td style={{ fontWeight: 700, color: s.totalDue > 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                      ₹{s.totalDue.toLocaleString()}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{s.lastPaymentDate}</td>
                    <td>
                      <span className={`badge ${statusBadge(s.status)}`}>
                        {statusIcon(s.status)} {s.status}
                      </span>
                    </td>
                    <td>
                      {s.totalDue > 0 && (
                        <button className="btn btn-sm btn-success" onClick={() => openPayModal(s.id, s.totalDue)}>
                          <CreditCard size={13} /> Pay Due
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer Dues Table */}
      {tab === 'customer' && (
        <div className="card">
          <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th><th>Customer Name</th><th>Email</th>
                  <th>Pending Orders</th><th>Total Due</th>
                  <th>Last Order</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>#{c.id}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
                          {c.customerName.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <span style={{ fontWeight: 500 }}>{c.customerName}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{c.email}</td>
                    <td style={{ fontWeight: 600 }}>{c.pendingOrders}</td>
                    <td style={{ fontWeight: 700, color: c.totalDue > 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                      ₹{c.totalDue.toFixed(2)}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{c.lastOrderDate}</td>
                    <td>
                      <span className={`badge ${statusBadge(c.status)}`}>
                        {statusIcon(c.status)} {c.status}
                      </span>
                    </td>
                    <td>
                      {c.totalDue > 0 && (
                        <button className="btn btn-sm btn-primary" onClick={() => openPayModal(c.id, c.totalDue)}>
                          <CreditCard size={13} /> Receive Payment
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create {tab === 'supplier' ? 'Supplier' : 'Customer'} Due</h3>
              <button className="btn-icon" onClick={() => setShowCreateModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">{tab === 'supplier' ? 'Supplier Name' : 'Customer Name'}</label>
                <input className="form-input" value={dueName} onChange={e => setDueName(e.target.value)} placeholder="Name..." />
              </div>
              <div className="form-group">
                <label className="form-label">{tab === 'supplier' ? 'Contact Info' : 'Email Address'}</label>
                <input className="form-input" value={dueContact} onChange={e => setDueContact(e.target.value)} placeholder="Contact..." />
              </div>
              <div className="form-group">
                <label className="form-label">Total Amount Due (₹)</label>
                <input className="form-input" type="number" value={dueAmount} onChange={e => setDueAmount(Number(e.target.value))} />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={dueStatus} onChange={e => setDueStatus(e.target.value as any)}>
                  <option>Due Soon</option>
                  <option>Overdue</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateDue} disabled={!dueName || dueAmount <= 0}>Create</button>
            </div>
          </div>
        </div>
      )}

      {showPayModal && (
        <div className="modal-overlay" onClick={() => setShowPayModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Settle {tab === 'supplier' ? 'Supplier' : 'Customer'} Due</h3>
              <button className="btn-icon" onClick={() => setShowPayModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <p>Enter the amount being {tab === 'supplier' ? 'paid to the supplier' : 'received from the customer'}.</p>
              <div className="form-group">
                <label className="form-label">Payment Amount (₹)</label>
                <input className="form-input" type="number" value={payAmount} onChange={e => setPayAmount(Number(e.target.value))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowPayModal(false)}>Cancel</button>
              <button className="btn btn-success" onClick={handlePayDue} disabled={payAmount <= 0}>Confirm Payment</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
