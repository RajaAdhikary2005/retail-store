import { useState, useCallback, useEffect, useMemo } from 'react';
import { RotateCcw, CheckCircle, XCircle, Clock, Plus, Package } from 'lucide-react';
import { fetchOrders, fetchCustomers } from '../services/api';
import type { Order, Customer, Product } from '../types';
import { type UserRole } from '../services/auth';
import { RETURNS, addReturn, updateReturnStatus, type ReturnItem } from '../services/returnStore';

const reasons = ['Defective', 'Wrong item', 'Changed mind', 'Not as described', 'Arrived late', 'Other'];

interface Props { userRole: UserRole; userName?: string; }

export default function Returns({ userRole, userName = 'User' }: Props) {
  const [_dummy, forceUpdate] = useState(0);
  const refresh = useCallback(() => forceUpdate(n => n + 1), []);
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    Promise.all([
      fetchOrders(), 
      fetchCustomers(),
      import('../services/api').then(m => m.fetchProducts())
    ]).then(([o, c, p]) => {
      setOrders(o);
      setCustomers(c);
      setProducts(p);
    });
  }, []);

  const returns = useMemo(() => RETURNS.map(r => {
    const order = orders.find(o => o.id === r.orderId);
    const liveCust = customers.find(c => c.id === order?.customerId);
    const liveProd = products.find(p => p.id === r.productId);
    return { 
      ...r, 
      customerName: liveCust ? liveCust.name : r.customerName,
      productName: liveProd ? liveProd.name : r.productName
    };
  }), [orders, customers, products, RETURNS.length, _dummy]);

  const [showModal, setShowModal] = useState(false);
  const [selOrder, setSelOrder] = useState(0);
  const [selProduct, setSelProduct] = useState('');
  const [selQty, setSelQty] = useState(1);
  const [selReason, setSelReason] = useState(reasons[0]);
  const [selAmount, setSelAmount] = useState(0);
  const [tab, setTab] = useState<'all' | 'pending' | 'approved' | 'refunded' | 'rejected'>('all');
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const flash = (msg: string) => { setActionMsg(msg); setTimeout(() => setActionMsg(null), 3000); };

  const filtered = tab === 'all' ? returns : returns.filter(r => r.status === tab);
  const pending = returns.filter(r => r.status === 'pending').length;
  const totalRefunded = returns.filter(r => r.status === 'refunded').reduce((s, r) => s + r.amount, 0);

  const canApprove = userRole === 'admin' || userRole === 'manager';
  const canRefund = userRole === 'admin' || userRole === 'manager';

  const statusCfg: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
    pending: { bg: 'var(--accent-orange-light)', color: 'var(--accent-orange)', icon: <Clock size={12} /> },
    approved: { bg: 'var(--accent-blue-light)', color: 'var(--accent-blue)', icon: <CheckCircle size={12} /> },
    refunded: { bg: 'var(--accent-green-light)', color: 'var(--accent-green)', icon: <CheckCircle size={12} /> },
    rejected: { bg: 'var(--accent-red-light)', color: 'var(--accent-red)', icon: <XCircle size={12} /> },
  };

  const handleAction = (id: number, action: 'approved' | 'rejected') => {
    updateReturnStatus(id, action);
    refresh();
    flash(`Return #${id} has been ${action}.`);
  };

  const handleRefund = (id: number) => {
    updateReturnStatus(id, 'refunded');
    refresh();
    flash(`Refund issued for Return #${id}.`);
  };

  const handleCreate = () => {
    const order = orders.find(o => o.id === selOrder);
    if (!order || !selProduct) return;
    const newReturn: ReturnItem = {
      id: Date.now(), orderId: selOrder, customerId: order.customerId, 
      productId: Number(selProduct),
      customerName: order.customerName,
      productName: order.items.find(i => i.productId === Number(selProduct))?.productName || '', 
      quantity: selQty, reason: selReason, amount: selAmount,
      status: 'pending', createdAt: new Date().toISOString().split('T')[0], requestedBy: userName,
    };
    addReturn(newReturn);
    refresh();
    setShowModal(false); setSelOrder(0); setSelProduct(''); setSelQty(1); setSelAmount(0);
    flash('Return request submitted. Awaiting approval.');
  };

  const selectedOrder = orders.find(o => o.id === selOrder);

  return (
    <>
      <div className="page-header"><h2>Returns & Refunds</h2><p>Process customer returns, manage refund requests, and track return status.</p></div>

      <div style={{
        padding: '10px 16px', marginBottom: 16, borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 500,
        background: 'var(--accent-blue-light)', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: 8,
      }}>
        ℹ️ Your role: <strong style={{ textTransform: 'capitalize' }}>{userRole}</strong> —
        {userRole === 'staff' && ' You can submit return requests. Manager/Admin will approve.'}
        {userRole === 'manager' && ' You can submit & approve/reject returns. Admin issues refunds.'}
        {userRole === 'admin' && ' You have full access: submit, approve, reject, and issue refunds.'}
      </div>

      {actionMsg && <div style={{ padding: '12px 16px', marginBottom: 16, borderRadius: 'var(--radius-sm)', background: 'var(--accent-green-light)', color: 'var(--accent-green)', fontSize: 13, fontWeight: 500, animation: 'slideUp 0.25s ease' }}>✓ {actionMsg}</div>}

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card"><div className="stat-info"><h4>Total Returns</h4><div className="stat-value">{returns.length}</div></div><div className="stat-icon blue"><RotateCcw size={22} /></div></div>
        <div className="stat-card"><div className="stat-info"><h4>Pending Review</h4><div className="stat-value" style={{ color: 'var(--accent-orange)' }}>{pending}</div></div><div className="stat-icon orange"><Clock size={22} /></div></div>
        <div className="stat-card"><div className="stat-info"><h4>Total Refunded</h4><div className="stat-value" style={{ color: 'var(--accent-green)' }}>₹{totalRefunded.toFixed(2)}</div></div><div className="stat-icon green"><CheckCircle size={22} /></div></div>
      </div>

      <div className="toolbar">
        <div className="toolbar-left" style={{ gap: 6 }}>
          {(['all', 'pending', 'approved', 'refunded', 'rejected'] as const).map(t => (
            <button key={t} className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTab(t)} style={{ textTransform: 'capitalize' }}>{t}{t === 'pending' && pending > 0 ? ` (${pending})` : ''}</button>
          ))}
        </div>
        <div className="toolbar-right">
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}><Plus size={14} /> Request Return</button>
        </div>
      </div>

      <div className="card"><div className="card-body" style={{ padding: 0 }}>
        {filtered.length === 0 ? <div className="empty-state"><RotateCcw size={48} /><h4>No returns found</h4><p>No return requests match the selected filter.</p></div> : (
        <table className="data-table"><thead><tr><th>ID</th><th>Order</th><th>Customer</th><th>Product</th><th>Reason</th><th>Amount</th><th>Requested By</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{filtered.map(r => { const sc = statusCfg[r.status]; return (
            <tr key={r.id}>
              <td style={{ fontWeight: 600 }}>#{r.id}</td>
              <td><span style={{ color: 'var(--accent-blue)', fontWeight: 500 }}>#{r.orderId}</span></td>
              <td>{r.customerName}</td>
              <td style={{ maxWidth: 160 }}><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Package size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} /> {r.productName}</div></td>
              <td><span className="badge" style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>{r.reason}</span></td>
              <td style={{ fontWeight: 600 }}>₹{r.amount.toFixed(2)}</td>
              <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{r.requestedBy}</td>
              <td><span className="badge" style={{ background: sc.bg, color: sc.color, gap: 4 }}>{sc.icon} {r.status}</span></td>
              <td><div style={{ display: 'flex', gap: 4 }}>
                {r.status === 'pending' && canApprove && <>
                  <button className="btn btn-success btn-sm" onClick={() => handleAction(r.id, 'approved')} style={{ padding: '4px 8px' }}>Approve</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleAction(r.id, 'rejected')} style={{ padding: '4px 8px' }}>Reject</button>
                </>}
                {r.status === 'pending' && !canApprove && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Awaiting approval</span>}
                {r.status === 'approved' && canRefund && <button className="btn btn-primary btn-sm" onClick={() => handleRefund(r.id)} style={{ padding: '4px 8px' }}>Issue Refund</button>}
                {r.status === 'approved' && !canRefund && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Awaiting refund</span>}
                {(r.status === 'refunded' || r.status === 'rejected') && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Done</span>}
              </div></td>
            </tr>); })}</tbody></table>)}</div></div>

      {showModal && <div className="modal-overlay" onClick={() => setShowModal(false)}><div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h3>Request Return</h3><button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-muted)' }}>×</button></div>
        <div className="modal-body">
          <div className="form-group"><label className="form-label">Select Order</label>
            <select className="form-select" value={selOrder} onChange={e => { setSelOrder(Number(e.target.value)); setSelProduct(''); setSelAmount(0); }}>
              <option value={0} disabled>Choose an order...</option>
              {orders.filter(o => o.status === 'Delivered').map(o => {
                const cName = customers.find(c => c.id === o.customerId)?.name || o.customerName;
                return <option key={o.id} value={o.id}>#{o.id} — {cName}</option>;
              })}
            </select></div>
          {selectedOrder && <div className="form-group"><label className="form-label">Select Product</label>
            <select className="form-select" value={selProduct} onChange={e => { setSelProduct(e.target.value); const item = selectedOrder.items.find(i => i.productId === Number(e.target.value)); setSelAmount(item?.unitPrice || 0); }}>
              <option value="" disabled>Choose a product...</option>
              {selectedOrder.items.map(i => {
                const liveProd = products.find(p => p.id === i.productId);
                const pName = liveProd ? liveProd.name : i.productName;
                return <option key={i.id} value={i.productId}>{pName} (₹{i.unitPrice})</option>;
              })}
            </select></div>}
          <div className="form-group"><label className="form-label">Quantity</label><input className="form-input" type="number" min={1} value={selQty} onChange={e => setSelQty(Number(e.target.value))} /></div>
          <div className="form-group"><label className="form-label">Reason</label><select className="form-select" value={selReason} onChange={e => setSelReason(e.target.value)}>{reasons.map(r => <option key={r}>{r}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Refund Amount (₹)</label><input className="form-input" type="number" value={selAmount} onChange={e => setSelAmount(Number(e.target.value))} /></div>
        </div>
        <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleCreate} disabled={!selOrder || !selProduct}>Submit Return</button></div>
      </div></div>}
    </>
  );
}
