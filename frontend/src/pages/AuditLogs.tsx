import { useState, useEffect } from 'react';
import { FileText, Filter, AlertTriangle, Info, Shield, Edit, Trash2, Plus, LogIn, LogOut, Settings } from 'lucide-react';

import { type Severity, type LogEntry } from '../services/api';

const ICONS: Record<string, React.ReactNode> = {
  Edit: <Edit size={14} />,
  Trash2: <Trash2 size={14} />,
  LogIn: <LogIn size={14} />,
  Plus: <Plus size={14} />,
  Shield: <Shield size={14} />,
  Settings: <Settings size={14} />,
  FileText: <FileText size={14} />,
  LogOut: <LogOut size={14} />
};

const severityCfg: Record<Severity, { bg: string; color: string; icon: React.ReactNode; label: string }> = {
  info: { bg: 'var(--accent-blue-light)', color: 'var(--accent-blue)', icon: <Info size={12} />, label: 'Info' },
  warning: { bg: 'var(--accent-orange-light)', color: 'var(--accent-orange)', icon: <AlertTriangle size={12} />, label: 'Warning' },
  critical: { bg: 'var(--accent-red-light)', color: 'var(--accent-red)', icon: <AlertTriangle size={12} />, label: 'Critical' },
};

export default function AuditLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [sevFilter, setSevFilter] = useState<'all' | Severity>('all');
  const [userFilter, setUserFilter] = useState('all');

  useEffect(() => {
    import('../services/api').then(m => m.fetchAuditLogs().then(setLogs));
  }, []);

  const users = [...new Set(logs.map(l => l.user))];
  const filtered = logs
    .filter(l => sevFilter === 'all' || l.severity === sevFilter)
    .filter(l => userFilter === 'all' || l.user === userFilter);

  return (
    <>
      <div className="page-header"><h2>Activity Audit Logs</h2><p>Track all system actions performed by users for security and accountability.</p></div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[
          { label: 'Total Events', val: logs.length, color: 'blue', icon: <FileText size={22} /> },
          { label: 'Info', val: logs.filter(l => l.severity === 'info').length, color: 'blue', icon: <Info size={22} /> },
          { label: 'Warnings', val: logs.filter(l => l.severity === 'warning').length, color: 'orange', icon: <AlertTriangle size={22} /> },
          { label: 'Critical', val: logs.filter(l => l.severity === 'critical').length, color: 'red', icon: <AlertTriangle size={22} /> },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-info"><h4>{s.label}</h4><div className="stat-value" style={s.color !== 'blue' ? { color: `var(--accent-${s.color})` } : {}}>{s.val}</div></div>
            <div className="stat-icon" style={{ background: `var(--accent-${s.color}-light)`, color: `var(--accent-${s.color})` }}>{s.icon}</div>
          </div>
        ))}
      </div>

      <div className="toolbar">
        <div className="toolbar-left" style={{ gap: 8 }}>
          <Filter size={14} style={{ color: 'var(--text-muted)' }} />
          <select className="form-select" style={{ width: 150 }} value={sevFilter} onChange={e => setSevFilter(e.target.value as any)}>
            <option value="all">All Severity</option><option value="info">Info</option><option value="warning">Warning</option><option value="critical">Critical</option>
          </select>
          <select className="form-select" style={{ width: 180 }} value={userFilter} onChange={e => setUserFilter(e.target.value)}>
            <option value="all">All Users</option>{users.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div className="toolbar-right"><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{filtered.length} events</span></div>
      </div>

      <div className="card"><div className="card-body" style={{ padding: 0 }}>
        {filtered.length === 0 ? <div className="empty-state"><FileText size={48} /><h4>No logs found</h4><p>No events match the selected filters.</p></div> : (
        <table className="data-table"><thead><tr><th style={{ width: 40 }}></th><th>User</th><th>Action</th><th>Target</th><th>Severity</th><th>Timestamp</th></tr></thead>
          <tbody>{filtered.map(log => { const sc = severityCfg[log.severity]; return (
            <tr key={log.id} style={{ borderLeft: `3px solid ${sc.color}` }}>
              <td style={{ color: sc.color, textAlign: 'center' }}>{ICONS[log.iconStr] || ICONS['FileText']}</td>
              <td style={{ fontWeight: 600 }}>{log.user}</td>
              <td>{log.action}</td>
              <td style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 250 }}>{log.target}</td>
              <td><span className="badge" style={{ background: sc.bg, color: sc.color, gap: 4 }}>{sc.icon} {sc.label}</span></td>
              <td style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{log.timestamp}</td>
            </tr>); })}</tbody></table>)}</div></div>
    </>
  );
}
