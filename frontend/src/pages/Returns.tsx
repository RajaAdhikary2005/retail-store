import { useState, useEffect, useMemo } from 'react';
import { RotateCcw, CheckCircle, XCircle, Clock, Plus, X } from 'lucide-react';
import { fetchOrders, fetchReturns, createReturn, type ReturnRequest } from '../services/api';
import type { Order } from '../types';
import { type UserRole } from '../services/auth';

const reasons = ['Defective', 'Wrong item', 'Changed mind', 'Not as described', 'Arrived late', 'Other'];

interface Props { userRole: UserRole; userName?: string; }

export default function Returns({ userRole, userName = 'User' }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [selOrderId, setSelOrderId] = useState(0);
  const [selReason, setSelReason] = useState(reasons[0]);
  const [selAmount, setSelAmount] = useState(0);
  const [tab, setTab] = useState('all');

  const [, forceUpdate] = useState(0);
  const refresh = () => forceUpdate(n => n + 1);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchOrders(), fetchReturns()]).then(([o, r]) => {
      setOrders(o);
      setReturns(r);
      setLoading(false);
    });
  }, [forceUpdate]);

  const filteredReturns = useMemo(() => {
    if (tab === 'all') return returns;
    return returns.filter(r => r.status.toLowerCase() === tab);
  }, [returns, tab]);

  const handleCreateReturn = () => {
    const order = orders.find(o => o.id === selOrderId);
    if (!order) return;

    createReturn({
      orderId: selOrderId,
      customerName: order.customerName,
      amount: selAmount,
      reason: selReason,
      status: 'Pending'
    }).then(() => {
      setShowModal(false);
      refresh();
    });
  };

  const statusBadge = (status: string) => {
    const s = status.toLowerCase();
    return (
      <span className={`badge badge-${s}`} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {s === 'approved' ? <CheckCircle size={12} /> : s === 'rejected' ? <XCircle size={12} /> : <Clock size={12} />}
        {status}
      </span>
    );
  };

  return (
    <>
      <div className="page-header">
        <h2>Return Management</h2>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} /> New Return
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="tabs">
            {['all', 'pending', 'approved', 'rejected'].map(t => (
              <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Return ID</th>
                <th>Order #</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Reason</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredReturns.map(r => (
                <tr key={r.id}>
                  <td>#{r.id}</td>
                  <td>#{r.orderId}</td>
                  <td style={{ fontWeight: 600 }}>{r.customerName}</td>
                  <td style={{ fontWeight: 700 }}>₹{r.amount.toLocaleString()}</td>
                  <td>{r.reason}</td>
                  <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td>{statusBadge(r.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Initiate Return</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Select Order</label>
                <select value={selOrderId} onChange={e => setSelOrderId(Number(e.target.value))}>
                  <option value={0}>Select an order...</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.id}>Order #{o.id} - {o.customerName} (₹{o.totalAmount})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Reason</label>
                <select value={selReason} onChange={e => setSelReason(e.target.value)}>
                  {reasons.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Refund Amount (₹)</label>
                <input type="number" value={selAmount} onChange={e => setSelAmount(Number(e.target.value))} />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleCreateReturn}>Submit Return</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
