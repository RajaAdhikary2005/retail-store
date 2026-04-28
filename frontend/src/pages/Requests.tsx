import { useState, useEffect } from 'react';
import { UserCheck, UserX, Clock, CheckCircle, XCircle } from 'lucide-react';
import { fetchUsers, updateUserStatus } from '../services/api';
import { ROLES, type UserInfo } from '../services/auth';

interface RequestsProps {
  user: UserInfo;
}

export default function Requests({ user }: RequestsProps) {
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [processedUsers, setProcessedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const currentStoreId = user?.storeId;

  const loadUsers = () => {
    setLoading(true);
    // Filter by admin's storeId so they only see requests for their own store
    fetchUsers(currentStoreId).then(data => {
      // Only show manager/staff users — admins auto-approve and should never appear here
      const nonAdmins = data.filter((u: any) => u.role !== 'admin');
      setPendingUsers(nonAdmins.filter((u: any) => u.status === 'pending'));
      setProcessedUsers(nonAdmins.filter((u: any) => u.status === 'approved' || u.status === 'rejected'));
      setLoading(false);
    });
  };

  useEffect(() => { loadUsers(); }, [currentStoreId]);

  const handleAction = async (userId: number, status: string, userName: string) => {
    try {
      await updateUserStatus(userId, status);
      setActionMsg({ type: 'success', text: `${userName} has been ${status}.` });
      loadUsers();
    } catch (error: any) {
      setActionMsg({ type: 'error', text: error?.message || 'Failed to update request.' });
    }
    setTimeout(() => setActionMsg(null), 4000);
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <>
      <div className="page-header"><h2>Account Requests</h2><p>Manage pending account requests for your store.</p></div>

      {actionMsg && (
        <div style={{ padding: '12px 16px', marginBottom: 20, borderRadius: 'var(--radius-sm)', background: actionMsg.type === 'success' ? 'var(--accent-green-light)' : 'var(--accent-red-light)', color: actionMsg.type === 'success' ? 'var(--accent-green)' : 'var(--accent-red)', fontSize: 13, fontWeight: 500 }}>
          {actionMsg.type === 'success' ? '✓' : '✗'} {actionMsg.text}
        </div>
      )}

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-info"><h4>Pending Requests</h4><div className="stat-value" style={{ color: 'var(--accent-orange)' }}>{pendingUsers.length}</div></div>
          <div className="stat-icon orange"><Clock size={22} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info"><h4>Approved</h4><div className="stat-value" style={{ color: 'var(--accent-green)' }}>{processedUsers.filter(u => u.status === 'approved').length}</div></div>
          <div className="stat-icon green"><CheckCircle size={22} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info"><h4>Rejected</h4><div className="stat-value" style={{ color: 'var(--accent-red)' }}>{processedUsers.filter(u => u.status === 'rejected').length}</div></div>
          <div className="stat-icon red"><XCircle size={22} /></div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3><Clock size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />Pending Requests</h3></div>
        <div className="card-body" style={{ padding: 0 }}>
          {pendingUsers.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No pending requests. All caught up! 🎉</div>
          ) : (
            <table className="data-table">
              <thead><tr><th>User</th><th>Email</th><th>Role Requested</th><th>Actions</th></tr></thead>
              <tbody>
                {pendingUsers.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                    <td>{u.email}</td>
                    <td><span className="badge badge-processing">{(ROLES[u.role as keyof typeof ROLES] || ROLES.staff).label}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-sm btn-success" onClick={() => handleAction(u.id, 'approved', u.name)}><UserCheck size={14} /> Approve</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleAction(u.id, 'rejected', u.name)}><UserX size={14} /> Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {processedUsers.length > 0 && (
        <div className="card" style={{ marginTop: 24 }}>
          <div className="card-header"><h3>Processed Requests</h3></div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="data-table">
              <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Status</th></tr></thead>
              <tbody>
                {processedUsers.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{(ROLES[u.role as keyof typeof ROLES] || ROLES.staff).label}</td>
                    <td>
                      <span className={`badge ${u.status === 'approved' ? 'badge-delivered' : 'badge-cancelled'}`}>
                        {u.status === 'approved' ? <><CheckCircle size={12} /> Approved</> : <><XCircle size={12} /> Rejected</>}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
