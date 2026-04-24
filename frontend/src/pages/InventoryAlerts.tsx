import { useState } from 'react';
import { AlertTriangle, Package, TrendingDown, Archive, Filter, MinusCircle } from 'lucide-react';
import { mockProducts } from '../services/mockData';
import { getPendingPOQuantity } from '../services/poStore';

type StockStatus = 'all' | 'critical' | 'low' | 'normal';

interface DamageEntry { productId: number; quantity: number; reason: string; date: string; }

export default function InventoryAlerts() {
  const [filter, setFilter] = useState<StockStatus>('all');
  const [catFilter, setCatFilter] = useState('all');
  const [damageLog, setDamageLog] = useState<DamageEntry[]>([]);
  const [modal, setModal] = useState<number | null>(null);
  const [dmgQty, setDmgQty] = useState(1);
  const [dmgReason, setDmgReason] = useState('Damaged');

  const status = (qty: number) => {
    if (qty <= 5) return { label: qty === 0 ? 'Out of Stock' : 'Critical', color: '#ef4444', bg: 'var(--accent-red-light)', level: 'critical' as const };
    if (qty <= 20) return { label: 'Low Stock', color: '#f59e0b', bg: 'var(--accent-orange-light)', level: 'low' as const };
    return { label: 'Normal', color: '#10b981', bg: 'var(--accent-green-light)', level: 'normal' as const };
  };

  const cats = [...new Set(mockProducts.map(p => p.category))];
  const products = mockProducts
    .filter(p => filter === 'all' || status(p.stockQuantity).level === filter)
    .filter(p => catFilter === 'all' || p.category === catFilter)
    .sort((a, b) => a.stockQuantity - b.stockQuantity);

  const cnt = (l: string) => mockProducts.filter(p => status(p.stockQuantity).level === l).length;
  const dmgTotal = (id: number) => damageLog.filter(d => d.productId === id).reduce((s, d) => s + d.quantity, 0);

  const submitDmg = () => {
    if (modal === null) return;
    setDamageLog(p => [...p, { productId: modal, quantity: dmgQty, reason: dmgReason, date: new Date().toLocaleDateString() }]);
    setModal(null); setDmgQty(1); setDmgReason('Damaged');
  };

  return (
    <>
      <div className="page-header"><h2>Inventory & Stock Alerts</h2><p>Monitor stock levels, track damaged items, and manage restocking priorities.</p></div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[
          { key: 'all' as const, label: 'Total Products', val: mockProducts.length, color: 'blue', icon: <Package size={22} /> },
          { key: 'critical' as const, label: 'Critical', val: cnt('critical'), color: 'red', icon: <AlertTriangle size={22} /> },
          { key: 'low' as const, label: 'Low Stock', val: cnt('low'), color: 'orange', icon: <TrendingDown size={22} /> },
          { key: 'normal' as const, label: 'Normal', val: cnt('normal'), color: 'green', icon: <Archive size={22} /> },
        ].map(s => (
          <div key={s.key} className="stat-card" onClick={() => setFilter(s.key)} style={{ cursor: 'pointer', borderLeft: filter === s.key ? `3px solid var(--accent-${s.color})` : undefined }}>
            <div className="stat-info"><h4>{s.label}</h4><div className="stat-value" style={s.color !== 'blue' ? { color: `var(--accent-${s.color})` } : {}}>{s.val}</div></div>
            <div className="stat-icon" style={{ background: `var(--accent-${s.color}-light)`, color: `var(--accent-${s.color})` }}>{s.icon}</div>
          </div>
        ))}
      </div>

      <div className="toolbar"><div className="toolbar-left"><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Filter size={14} style={{ color: 'var(--text-muted)' }} />
        <select className="form-select" style={{ width: 180 }} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="all">All Categories</option>{cats.map(c => <option key={c} value={c}>{c}</option>)}
        </select></div></div></div>

      <div className="card"><div className="card-body" style={{ padding: 0 }}>
        <table className="data-table"><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Damaged</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>{products.map(p => { const s = status(p.stockQuantity); const d = dmgTotal(p.id); return (
            <tr key={p.id}>
              <td style={{ fontWeight: 600 }}>{p.name}</td>
              <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.category}</td>
              <td>₹{p.price.toFixed(2)}</td>
              <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 60, height: 6, borderRadius: 3, background: 'var(--border-light)', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min((p.stockQuantity / 200) * 100, 100)}%`, height: '100%', borderRadius: 3, background: s.color }} /></div>
                <span style={{ fontWeight: 600, fontSize: 13, color: s.color }}>{p.stockQuantity}</span></div></td>
              <td>{d > 0 ? <span style={{ color: 'var(--accent-red)', fontWeight: 600 }}>-{d}</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
              <td><span className="badge" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                {getPendingPOQuantity(p.id) > 0 && (
                  <span className="badge badge-processing" style={{ marginLeft: 6, display: 'inline-flex' }}>
                    + {getPendingPOQuantity(p.id)} ordered
                  </span>
                )}
              </td>
              <td><button className="btn btn-secondary btn-sm" onClick={() => setModal(p.id)} style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MinusCircle size={12} /> Mark Loss</button></td>
            </tr>); })}</tbody></table></div></div>

      {damageLog.length > 0 && <div className="card" style={{ marginTop: 24 }}><div className="card-header"><h3><MinusCircle size={16} style={{ marginRight: 8, color: 'var(--accent-red)', verticalAlign: 'middle' }} />Damage / Loss Log</h3></div>
        <div className="card-body" style={{ padding: 0 }}><table className="data-table"><thead><tr><th>Product</th><th>Qty</th><th>Reason</th><th>Date</th></tr></thead>
          <tbody>{damageLog.map((d, i) => <tr key={i}><td>{mockProducts.find(p => p.id === d.productId)?.name}</td><td style={{ color: 'var(--accent-red)', fontWeight: 600 }}>-{d.quantity}</td><td><span className="badge badge-cancelled">{d.reason}</span></td><td style={{ fontSize: 12 }}>{d.date}</td></tr>)}</tbody></table></div></div>}

      {modal !== null && <div className="modal-overlay" onClick={() => setModal(null)}><div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div className="modal-header"><h3>Report Damage / Loss</h3><button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-muted)' }}>×</button></div>
        <div className="modal-body">
          <div className="form-group"><label className="form-label">Product</label><input className="form-input" disabled value={mockProducts.find(p => p.id === modal)?.name || ''} /></div>
          <div className="form-group"><label className="form-label">Quantity Lost</label><input className="form-input" type="number" min={1} value={dmgQty} onChange={e => setDmgQty(Number(e.target.value))} /></div>
          <div className="form-group"><label className="form-label">Reason</label><select className="form-select" value={dmgReason} onChange={e => setDmgReason(e.target.value)}><option>Damaged</option><option>Lost</option><option>Expired</option><option>Defective</option><option>Theft</option></select></div>
        </div><div className="modal-footer"><button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-danger" onClick={submitDmg}>Record Loss</button></div>
      </div></div>}
    </>
  );
}
