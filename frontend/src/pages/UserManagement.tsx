import { useState } from 'react';
import { Users, Shield, UserX, ArrowUpCircle, Trash2 } from 'lucide-react';
import { USERS, ROLES, type UserInfo, type UserRole } from '../services/auth';

interface ManagedUser extends UserInfo { status: 'active' | 'suspended'; }

export default function UserManagement() {
  const [users, setUsers] = useState<ManagedUser[]>(() =>
    Object.values(USERS).map(u => ({ ...u.user, status: 'active' as const }))
  );
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const flash = (msg: string) => { setActionMsg(msg); setTimeout(() => setActionMsg(null), 3000); };

  const toggleSuspend = (email: string) => {
    setUsers(prev => prev.map(u => {
      if (u.email === email) {
        const next = u.status === 'active' ? 'suspended' : 'active';
        flash(`${u.name} has been ${next === 'active' ? 'reactivated' : 'suspended'}.`);
        return { ...u, status: next as 'active' | 'suspended' };
      }
      return u;
    }));
  };

  const promote = (email: string) => {
    setUsers(prev => prev.map(u => {
      if (u.email === email && u.role === 'staff') {
        flash(`${u.name} has been promoted to Manager.`);
        return { ...u, role: 'manager' as UserRole };
      }
      return u;
    }));
  };

  const removeUser = (email: string) => {
    const user = users.find(u => u.email === email);
    if (user) {
      flash(`${user.name}'s access has been revoked.`);
      setUsers(prev => prev.filter(u => u.email !== email));
    }
  };

  const admins = users.filter(u => u.role === 'admin');
  const managers = users.filter(u => u.role === 'manager');
  const staff = users.filter(u => u.role === 'staff');

  const renderUserRow = (u: ManagedUser, isCurrentAdmin: boolean) => {
    const r = ROLES[u.role];
    return (
      <tr key={u.email} style={{ opacity: u.status === 'suspended' ? 0.5 : 1 }}>
        <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg, ${r.color}40, ${r.color}20)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: r.color, flexShrink: 0 }}>{u.avatar}</div>
          <div><div style={{ fontWeight: 600 }}>{u.name}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.email}</div></div>
        </div></td>
        <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: `${r.color}15`, color: r.color, border: `1px solid ${r.color}25` }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: r.color }} />{r.label}</span></td>
        <td><span className="badge" style={{ background: u.status === 'active' ? 'var(--accent-green-light)' : 'var(--accent-red-light)', color: u.status === 'active' ? 'var(--accent-green)' : 'var(--accent-red)' }}>
          {u.status === 'active' ? '● Active' : '● Suspended'}</span></td>
        <td>{!isCurrentAdmin && (
          <div style={{ display: 'flex', gap: 4 }}>
            <button className={`btn btn-sm ${u.status === 'active' ? 'btn-secondary' : 'btn-success'}`} onClick={() => toggleSuspend(u.email)} title={u.status === 'active' ? 'Suspend' : 'Reactivate'} style={{ padding: '4px 8px' }}>
              {u.status === 'active' ? <><UserX size={12} /> Suspend</> : <>✓ Reactivate</>}
            </button>
            {u.role === 'staff' && <button className="btn btn-sm btn-primary" onClick={() => promote(u.email)} title="Promote to Manager" style={{ padding: '4px 8px' }}><ArrowUpCircle size={12} /> Promote</button>}
            {u.role !== 'admin' && <button className="btn btn-sm btn-danger" onClick={() => removeUser(u.email)} title="Remove access" style={{ padding: '4px 8px' }}><Trash2 size={12} /></button>}
          </div>
        )}</td>
      </tr>
    );
  };

  return (
    <>
      <div className="page-header"><h2>User & Staff Management</h2><p>Manage all user accounts, permissions, and access levels.</p></div>

      {actionMsg && <div style={{ padding: '12px 16px', marginBottom: 20, borderRadius: 'var(--radius-sm)', background: 'var(--accent-green-light)', color: 'var(--accent-green)', fontSize: 13, fontWeight: 500, animation: 'slideUp 0.25s ease' }}>✓ {actionMsg}</div>}

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-info"><h4>Total Users</h4><div className="stat-value">{users.length}</div></div><div className="stat-icon blue"><Users size={22} /></div></div>
        <div className="stat-card"><div className="stat-info"><h4>Admins</h4><div className="stat-value" style={{ color: '#ef4444' }}>{admins.length}</div></div><div className="stat-icon" style={{ background: 'var(--accent-red-light)', color: 'var(--accent-red)' }}><Shield size={22} /></div></div>
        <div className="stat-card"><div className="stat-info"><h4>Managers</h4><div className="stat-value" style={{ color: '#f59e0b' }}>{managers.length}</div></div><div className="stat-icon orange"><Users size={22} /></div></div>
        <div className="stat-card"><div className="stat-info"><h4>Staff</h4><div className="stat-value" style={{ color: '#3b82f6' }}>{staff.length}</div></div><div className="stat-icon blue"><Users size={22} /></div></div>
      </div>

      <div className="card"><div className="card-header"><h3><Users size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />All Users</h3></div>
        <div className="card-body" style={{ padding: 0 }}><table className="data-table"><thead><tr><th>User</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{users.map(u => renderUserRow(u, u.role === 'admin' && admins.length <= 1))}</tbody></table></div></div>
    </>
  );
}
