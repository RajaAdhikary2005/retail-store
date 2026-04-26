import { useState, useEffect, useMemo } from 'react';
import { CheckCircle, XCircle, Clock, Plus, X, DollarSign, ShieldCheck } from 'lucide-react';
import { fetchOrders, fetchReturns, createReturn, updateReturnStatus, logAction, type ReturnRequest } from '../services/api';
import type { Order } from '../types';
import { type UserRole } from '../services/auth';

const reasons = ['Defective', 'Wrong item', 'Changed mind', 'Not as described', 'Arrived late', 'Other'];

interface Props { userRole: UserRole; userName?: string; }

export default function Returns({ userRole, userName = 'User' }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [_loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [selOrderId, setSelOrderId] = useState(0);
  const [selReason, setSelReason] = useState(reasons[0]);
  const [selAmount, setSelAmount] = useState(0);
  const [tab, setTab] = useState('all');
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const canApprove = userRole === 'admin' || userRole === 'manager';
  const canRefund = userRole === 'admin';

  const loadData = () => {
    setLoading(true);
    Promise.all([fetchOrders(), fetchReturns()]).then(([o, r]) => {
      setOrders(o); setReturns(r); setLoading(false);
    });
  };

  useEffect(() => { loadData(); }, []);

  const filteredReturns = useMemo(() => {
    if (tab === 'all') return returns;
    return returns.filter(r => r.status.toLowerCase() === tab);
  }, [returns, tab]);

  const handleCreateReturn = async () => {
    const order = orders.find(o => o.id === selOrderId);
    if (!order) return;
    await createReturn({
      orderId: selOrderId,
      customerName: order.customerName,
      amount: selAmount,
      reason: selReason,
      status: 'Pending'
    });
    logAction({ user: userName, action: 'Created return request', target: `Order #${selOrderId}`, severity: 'info', iconStr: 'Plus' });
    setShowModal(false);
    setSelOrderId(0); setSelAmount(0); setSelReason(reasons[0]);
    loadData();
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await updateReturnStatus(id, newStatus);
      setReturns(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
      logAction({ user: userName, action: `Return ${newStatus.toLowerCase()}`, target: `Return #${id}`, severity: newStatus === 'Rejected' ? 'warning' : 'info', iconStr: 'Shield' });
      setActionMsg(`✓ Return #${id} ${newStatus.toLowerCase()}`);
      setTimeout(() => setActionMsg(null), 2500);
    } catch {
      setActionMsg(`Failed to update return #${id}`);
      setTimeout(() => setActionMsg(null), 2500);
    }
  };

  const statusBadge = (status: string) => {
    const s = status.toLowerCase();
    const colors: Record<string, string> = { pending: 'var(--accent-orange)', approved: 'var(--accent-blue)', rejected: 'var(--accent-red)', refunded: 'var(--accent-green)' };
    const icons: Record<string, React.ReactNode> = { pending: <Clock size={12} />, approved: <CheckCircle size={12} />, rejected: <XCircle size={12} />, refunded: <DollarSign size={12} /> };
    return (
      <span className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: `${colors[s] || 'var(--accent-blue)'}15`, color: colors[s] || 'var(--accent-blue)' }}>
        {icons[s] || <Clock size={12} />} {status}
      </span>
    );
  };

  const pendingCount = returns.filter(r => r.status === 'Pending').length;
  const approvedCount = returns.filter(r => r.status === 'Approved').length;
  const refundedCount = returns.filter(r => r.status === 'Refunded').length;
  const totalRefunded = returns.filter(r => r.status === 'Refunded').reduce((a, r) => a + r.amount, 0);

  return (
    <>
      <div className="page-header">
        <h2>Returns & Refunds</h2>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} /> New Return Request
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-info"><h4>Pending</h4><div className="stat-value" style={{ color: 'var(--accent-orange)' }}>{pendingCount}</div></div>
          <div className="stat-icon orange"><Clock size={22} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info"><h4>Approved</h4><div className="stat-value" style={{ color: 'var(--accent-blue)' }}>{approvedCount}</div></div>
          <div className="stat-icon blue"><CheckCircle size={22} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info"><h4>Refunded</h4><div className="stat-value" style={{ color: 'var(--accent-green)' }}>{refundedCount}</div></div>
          <div className="stat-icon green"><DollarSign size={22} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info"><h4>Total Refunded</h4><div className="stat-value">₹{totalRefunded.toLocaleString()}</div></div>
          <div className="stat-icon blue"><ShieldCheck size={22} /></div>
        </div>
      </div>

      {actionMsg && (
        <div style={{ padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 500,
          background: actionMsg.startsWith('✓') ? 'var(--accent-green-light)' : 'var(--accent-red-light)',
          color: actionMsg.startsWith('✓') ? 'var(--accent-green)' : 'var(--accent-red)' }}>
          {actionMsg}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div className="tabs">
            {['all', 'pending', 'approved', 'refunded', 'rejected'].map(t => (
              <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
                {t === 'pending' && pendingCount > 0 && <span style={{ marginLeft: 4, fontSize: 10, background: 'var(--accent-orange)', color: '#fff', borderRadius: 10, padding: '1px 6px' }}>{pendingCount}</span>}
              </button>
            ))}
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Return ID</th><th>Order #</th><th>Customer</th><th>Amount</th><th>Reason</th><th>Date</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReturns.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>No return requests found.</td></tr>
              )}
              {filteredReturns.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>RET-{r.id.toString().padStart(4, '0')}</td>
                  <td>INV-{r.orderId.toString().padStart(4, '0')}</td>
                  <td style={{ fontWeight: 600 }}>{r.customerName}</td>
                  <td style={{ fontWeight: 700 }}>₹{r.amount.toLocaleString()}</td>
                  <td>{r.reason}</td>
                  <td style={{ fontSize: 12 }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td>{statusBadge(r.status)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {/* Manager/Admin can Approve or Reject pending requests */}
                      {r.status === 'Pending' && canApprove && (
                        <>
                          <button className="btn btn-sm btn-success" onClick={() => handleStatusChange(r.id, 'Approved')} title="Approve">
                            <CheckCircle size={12} /> Approve
                          </button>
                          <button className="btn btn-sm btn-secondary" onClick={() => handleStatusChange(r.id, 'Rejected')} title="Reject" style={{ color: 'var(--accent-red)' }}>
                            <XCircle size={12} /> Reject
                          </button>
                        </>
                      )}
                      {/* Only Admin can issue refund after approval */}
                      {r.status === 'Approved' && canRefund && (
                        <button className="btn btn-sm btn-primary" onClick={() => handleStatusChange(r.id, 'Refunded')} title="Issue Refund">
                          <DollarSign size={12} /> Issue Refund
                        </button>
                      )}
                      {/* Staff sees status only */}
                      {r.status === 'Pending' && !canApprove && (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Awaiting approval</span>
                      )}
                      {r.status === 'Approved' && !canRefund && (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Awaiting admin refund</span>
                      )}
                      {(r.status === 'Refunded' || r.status === 'Rejected') && (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Return Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Initiate Return Request</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Select Order</label>
                <select className="form-select" value={selOrderId} onChange={e => { 
                  const id = Number(e.target.value); 
                  setSelOrderId(id); 
                  const o = orders.find(o => o.id === id);
                  if (o) setSelAmount(o.totalAmount);
                }}>
                  <option value={0}>Select an order...</option>
                  {orders.filter(o => o.status !== 'Cancelled').map(o => (
                    <option key={o.id} value={o.id}>Order #{o.id} - {o.customerName} (₹{o.totalAmount})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Reason</label>
                <select className="form-select" value={selReason} onChange={e => setSelReason(e.target.value)}>
                  {reasons.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Refund Amount (₹)</label>
                <input className="form-input" type="number" value={selAmount || ''} onChange={e => setSelAmount(Number(e.target.value))} min={0} />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleCreateReturn} disabled={!selOrderId || selAmount <= 0}>Submit Return</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
