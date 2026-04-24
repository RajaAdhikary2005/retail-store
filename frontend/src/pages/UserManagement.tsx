import { useState, useEffect } from 'react';
import { Users, Shield, UserX } from 'lucide-react';
import { fetchUsers } from '../services/api';
import { ROLES, type UserRole, type UserInfo } from '../services/auth';

interface ManagedUser { id: number; name: string; email: string; role: UserRole; avatar: string; status: string; storeId?: number; }

interface UserManagementProps {
  user?: UserInfo;
}

export default function UserManagement({ user }: UserManagementProps) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const currentUserEmail = user?.email || '';
  const currentStoreId = user?.storeId;

  useEffect(() => {
    // Filter users by the admin's storeId so they only see their own store members
    fetchUsers(currentStoreId).then(data => {
      setUsers(data.map((u: any) => ({
        id: u.id,
        name: u.name || 'Unknown',
        email: u.email,
        role: u.role || 'staff',
        avatar: u.avatar || (u.name || 'U').substring(0, 2).toUpperCase(),
        status: u.status || 'active',
        storeId: u.storeId,
      })));
      setLoading(false);
    });
  }, [currentStoreId]);

  const flash = (msg: string) => { setActionMsg(msg); setTimeout(() => setActionMsg(null), 3000); };

  const updateUserStatus = async (id: number, status: string) => {
    try {
      await fetch(`https://retail-store-k6pr.onrender.com/api/auth/users/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      setUsers(prev => prev.map(u => u.id === id ? { ...u, status } : u));
    } catch {}
  };

  const toggleSuspend = (u: ManagedUser) => {
    const next = u.status === 'active' || u.status === 'approved' ? 'suspended' : 'active';
    updateUserStatus(u.id, next);
    flash(`${u.name} has been ${next === 'active' ? 'reactivated' : 'suspended'}.`);
  };

  const admins = users.filter(u => u.role === 'admin');
  const managers = users.filter(u => u.role === 'manager');
  const staff = users.filter(u => u.role === 'staff');

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  const renderUserRow = (u: ManagedUser) => {
    const r = ROLES[u.role] || ROLES.staff;
    // Don't show suspend button for the currently logged-in user (themselves)
    const isSelf = u.email.toLowerCase() === currentUserEmail.toLowerCase();
    return (
      <tr key={u.email} style={{ opacity: u.status === 'suspended' ? 0.5 : 1 }}>
        <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg, ${r.color}40, ${r.color}20)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: r.color, flexShrink: 0 }}>{u.avatar}</div>
          <div><div style={{ fontWeight: 600 }}>{u.name}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.email}</div></div>
        </div></td>
        <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: `${r.color}15`, color: r.color, border: `1px solid ${r.color}25` }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: r.color }} />{r.label}</span></td>
        <td><span className="badge" style={{ background: u.status === 'approved' || u.status === 'active' ? 'var(--accent-green-light)' : u.status === 'pending' ? 'var(--accent-orange-light)' : 'var(--accent-red-light)', color: u.status === 'approved' || u.status === 'active' ? 'var(--accent-green)' : u.status === 'pending' ? 'var(--accent-orange)' : 'var(--accent-red)' }}>
          {u.status === 'approved' || u.status === 'active' ? '● Active' : u.status === 'pending' ? '◷ Pending' : '● ' + u.status}</span></td>
        <td>{!isSelf && (
          <div style={{ display: 'flex', gap: 4 }}>
            <button className={`btn btn-sm ${u.status === 'active' || u.status === 'approved' ? 'btn-secondary' : 'btn-success'}`} onClick={() => toggleSuspend(u)} style={{ padding: '4px 8px' }}>
              {u.status === 'active' || u.status === 'approved' ? <><UserX size={12} /> Suspend</> : <>✓ Reactivate</>}
            </button>
          </div>
        )}</td>
      </tr>
    );
  };

  return (
    <>
      <div className="page-header"><h2>User & Staff Management</h2><p>Manage user accounts for your store.</p></div>

      {actionMsg && <div style={{ padding: '12px 16px', marginBottom: 20, borderRadius: 'var(--radius-sm)', background: 'var(--accent-green-light)', color: 'var(--accent-green)', fontSize: 13, fontWeight: 500 }}>✓ {actionMsg}</div>}

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-info"><h4>Total Users</h4><div className="stat-value">{users.length}</div></div><div className="stat-icon blue"><Users size={22} /></div></div>
        <div className="stat-card"><div className="stat-info"><h4>Admins</h4><div className="stat-value" style={{ color: '#ef4444' }}>{admins.length}</div></div><div className="stat-icon" style={{ background: 'var(--accent-red-light)', color: 'var(--accent-red)' }}><Shield size={22} /></div></div>
        <div className="stat-card"><div className="stat-info"><h4>Managers</h4><div className="stat-value" style={{ color: '#f59e0b' }}>{managers.length}</div></div><div className="stat-icon orange"><Users size={22} /></div></div>
        <div className="stat-card"><div className="stat-info"><h4>Staff</h4><div className="stat-value" style={{ color: '#3b82f6' }}>{staff.length}</div></div><div className="stat-icon blue"><Users size={22} /></div></div>
      </div>

      <div className="card"><div className="card-header"><h3><Users size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />Your Store Users</h3></div>
        <div className="card-body" style={{ padding: 0 }}><table className="data-table"><thead><tr><th>User</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{users.map(u => renderUserRow(u))}</tbody></table></div></div>
    </>
  );
}
