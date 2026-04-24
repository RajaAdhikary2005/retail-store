import { useState, useCallback } from 'react';
import { Tag, Plus, ToggleLeft, ToggleRight, Percent, DollarSign, Calendar, Copy, Trash2 } from 'lucide-react';
import { PROMOS, addPromo, removePromo, togglePromo, type Promo } from '../services/promoStore';

export default function Promotions() {
  const [, forceUpdate] = useState(0);
  const refresh = useCallback(() => forceUpdate(n => n + 1), []);
  const promos = PROMOS;

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ code: '', type: 'percentage' as 'percentage' | 'flat', value: 0, startDate: '', endDate: '', maxUses: 100, description: '' });
  const [copied, setCopied] = useState<string | null>(null);
  const [tab, setTab] = useState<'all' | 'active' | 'expired' | 'scheduled'>('all');

  const now = new Date().toISOString().split('T')[0];
  const getStatus = (p: Promo) => {
    if (p.usedCount >= p.maxUses) return 'exhausted';
    if (p.endDate < now) return 'expired';
    if (p.startDate > now) return 'scheduled';
    return p.enabled ? 'active' : 'paused';
  };

  const statusCfg: Record<string, { bg: string; color: string; label: string }> = {
    active: { bg: 'var(--accent-green-light)', color: 'var(--accent-green)', label: '● Active' },
    paused: { bg: 'var(--bg-primary)', color: 'var(--text-muted)', label: '● Paused' },
    expired: { bg: 'var(--accent-red-light)', color: 'var(--accent-red)', label: '● Expired' },
    scheduled: { bg: 'var(--accent-blue-light)', color: 'var(--accent-blue)', label: '◷ Scheduled' },
    exhausted: { bg: 'var(--accent-orange-light)', color: 'var(--accent-orange)', label: '● Exhausted' },
  };

  const filtered = tab === 'all' ? promos : promos.filter(p => getStatus(p) === tab);

  const handleToggle = (id: number) => { togglePromo(id); refresh(); };
  const handleDelete = (id: number) => { removePromo(id); refresh(); };
  const copyCode = (code: string) => { navigator.clipboard.writeText(code); setCopied(code); setTimeout(() => setCopied(null), 1500); };

  const createPromo = () => {
    addPromo({ id: Date.now(), ...form, usedCount: 0, enabled: true });
    refresh();
    setShowModal(false); setForm({ code: '', type: 'percentage', value: 0, startDate: '', endDate: '', maxUses: 100, description: '' });
  };

  const activeCount = promos.filter(p => getStatus(p) === 'active').length;
  const totalUsage = promos.reduce((s, p) => s + p.usedCount, 0);

  return (
    <>
      <div className="page-header"><h2>Discounts & Promotions</h2><p>Create and manage discount codes, track usage, and run promotional campaigns.</p></div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card"><div className="stat-info"><h4>Total Promos</h4><div className="stat-value">{promos.length}</div></div><div className="stat-icon purple"><Tag size={22} /></div></div>
        <div className="stat-card"><div className="stat-info"><h4>Active Now</h4><div className="stat-value" style={{ color: 'var(--accent-green)' }}>{activeCount}</div></div><div className="stat-icon green"><Tag size={22} /></div></div>
        <div className="stat-card"><div className="stat-info"><h4>Total Uses</h4><div className="stat-value" style={{ color: 'var(--accent-blue)' }}>{totalUsage}</div></div><div className="stat-icon blue"><DollarSign size={22} /></div></div>
      </div>

      <div className="toolbar">
        <div className="toolbar-left" style={{ gap: 6 }}>
          {(['all', 'active', 'scheduled', 'expired'] as const).map(t => (
            <button key={t} className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab(t)} style={{ textTransform: 'capitalize' }}>{t}</button>
          ))}
        </div>
        <div className="toolbar-right"><button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}><Plus size={14} /> Create Promo</button></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
        {filtered.map(p => {
          const status = getStatus(p);
          const sc = statusCfg[status];
          const usagePercent = Math.round((p.usedCount / p.maxUses) * 100);
          return (
            <div key={p.id} className="card" style={{ overflow: 'hidden' }}>
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 16, padding: '2px 10px', background: 'var(--accent-purple-light)', color: 'var(--accent-purple)', borderRadius: 'var(--radius-sm)', letterSpacing: 1 }}>{p.code}</span>
                      <button onClick={() => copyCode(p.code)} style={{ background: 'none', border: 'none', color: copied === p.code ? 'var(--accent-green)' : 'var(--text-muted)', cursor: 'pointer' }} title="Copy code"><Copy size={14} /></button>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.description}</div>
                  </div>
                  <span className="badge" style={{ background: sc.bg, color: sc.color, fontSize: 10 }}>{sc.label}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: 18, color: 'var(--accent-purple)' }}>
                    {p.type === 'percentage' ? <><Percent size={16} /> {p.value}%</> : <>₹{p.value}</>}
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.type === 'percentage' ? 'off' : 'flat discount'}</span>
                </div>

                <div style={{ display: 'flex', gap: 12, marginBottom: 12, fontSize: 11, color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={11} /> {p.startDate} → {p.endDate}</span>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Usage</span>
                    <span style={{ fontWeight: 600 }}>{p.usedCount} / {p.maxUses} ({usagePercent}%)</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'var(--border-light)', overflow: 'hidden' }}>
                    <div style={{ width: `${usagePercent}%`, height: '100%', borderRadius: 3, background: usagePercent >= 90 ? 'var(--accent-red)' : usagePercent >= 50 ? 'var(--accent-orange)' : 'var(--accent-green)', transition: 'width 0.3s' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => handleToggle(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: p.enabled ? 'var(--accent-green)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                    {p.enabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />} {p.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                  <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(p.id)}><Trash2 size={13} /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && <div className="modal-overlay" onClick={() => setShowModal(false)}><div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h3>Create Promotion</h3><button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-muted)' }}>×</button></div>
        <div className="modal-body">
          <div className="form-group"><label className="form-label">Promo Code</label><input className="form-input" placeholder="e.g. SAVE20" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} style={{ fontFamily: 'monospace', letterSpacing: 1 }} /></div>
          <div className="form-group"><label className="form-label">Description</label><input className="form-input" placeholder="Brief description..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group"><label className="form-label">Type</label><select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })}><option value="percentage">Percentage (%)</option><option value="flat">Flat Amount (₹)</option></select></div>
            <div className="form-group"><label className="form-label">Value</label><input className="form-input" type="number" min={1} value={form.value} onChange={e => setForm({ ...form, value: Number(e.target.value) })} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group"><label className="form-label">Start Date</label><input className="form-input" type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">End Date</label><input className="form-input" type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} /></div>
          </div>
          <div className="form-group"><label className="form-label">Max Uses</label><input className="form-input" type="number" min={1} value={form.maxUses} onChange={e => setForm({ ...form, maxUses: Number(e.target.value) })} /></div>
        </div>
        <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={createPromo} disabled={!form.code || !form.startDate || !form.endDate}>Create</button></div>
      </div></div>}
    </>
  );
}
