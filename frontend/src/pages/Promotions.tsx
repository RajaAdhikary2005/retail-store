import { useState, useEffect } from 'react';
import { Plus, Copy, Trash2, X, Clock, CheckCircle } from 'lucide-react';
import { fetchPromotions, createPromotion, deletePromotion, type Promotion } from '../services/api';

export default function Promotions() {
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ 
    name: '', code: '', type: 'Percentage', discountValue: 0, startDate: '', endDate: '', description: '' 
  });
  const [copied, setCopied] = useState<string | null>(null);
  const [tab, setTab] = useState('all');

  const loadPromos = () => {
    setLoading(true);
    fetchPromotions().then(data => { setPromos(data); setLoading(false); });
  };

  useEffect(() => { loadPromos(); }, []);

  const filtered = tab === 'all' ? promos : promos.filter(p => p.status.toLowerCase() === tab);

  const handleCreate = () => {
    createPromotion({ ...form, status: 'Active' }).then(() => {
      setShowModal(false);
      setForm({ name: '', code: '', type: 'Percentage', discountValue: 0, startDate: '', endDate: '', description: '' });
      loadPromos();
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this promotion?')) return;
    try {
      await deletePromotion(id);
      setPromos(prev => prev.filter(p => p.id !== id));
    } catch { /* ignore */ }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  };

  const statusBadge = (status: string) => {
    const s = status.toLowerCase();
    return (
      <span className={`badge badge-${s}`} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {s === 'active' ? <CheckCircle size={12} /> : <Clock size={12} />}
        {status}
      </span>
    );
  };

  return (
    <>
      <div className="page-header">
        <h2>Discounts & Promotions</h2>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} /> Create Promo
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="tabs">
            {['all', 'active', 'scheduled', 'expired'].map(t => (
              <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr><th>Name</th><th>Code</th><th>Discount</th><th>Validity</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td>
                    <code style={{ background: 'var(--bg-primary)', padding: '4px 8px', borderRadius: 4, fontWeight: 700 }}>{p.code}</code>
                    <button className="btn btn-icon" onClick={() => copyCode(p.code)} title="Copy Code">
                      <Copy size={12} color={copied === p.code ? 'var(--accent-green)' : 'var(--text-muted)'} />
                    </button>
                  </td>
                  <td>{p.type === 'Percentage' ? `${p.discountValue}% Off` : `₹${p.discountValue} Flat`}</td>
                  <td style={{ fontSize: 12 }}>
                    {p.startDate ? new Date(p.startDate).toLocaleDateString() : '—'} - {p.endDate ? new Date(p.endDate).toLocaleDateString() : '—'}
                  </td>
                  <td>{statusBadge(p.status)}</td>
                  <td>
                    <button className="btn btn-icon" style={{ color: 'var(--accent-red)' }} onClick={() => handleDelete(p.id)} title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </td>
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
              <h3>Create Promotion</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Promo Name</label>
                <input className="form-input" type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Code</label>
                <input className="form-input" type="text" value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Type</label>
                  <select className="form-select" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    <option value="Percentage">Percentage</option>
                    <option value="Flat">Flat Discount</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Value</label>
                  <input className="form-input" type="number" value={form.discountValue || ''} onChange={e => setForm({...form, discountValue: Number(e.target.value)})} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Start Date</label>
                  <input className="form-input" type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">End Date</label>
                  <input className="form-input" type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleCreate} disabled={!form.name || !form.code}>Create Promo</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
