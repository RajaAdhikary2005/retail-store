import { useState } from 'react';
import { UserCheck, UserX, Clock, CheckCircle, XCircle, Store } from 'lucide-react';
import {
  type UserInfo, type SignupRequest,
  ROLES, getRequestsForAdmin, approveRequest, rejectRequest, getStoreName,
} from '../services/auth';

interface RequestsProps {
  user: UserInfo;
}

export default function Requests({ user }: RequestsProps) {
  const [, forceUpdate] = useState(0);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const requests = getRequestsForAdmin(user.email);
  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');
  const handleApprove = (request: SignupRequest) => {
    const result = approveRequest(request.id);
    if (result) {
      setActionMsg({ type: 'success', text: `${request.name}'s account has been approved and activated as ${ROLES[request.role].label}.` });
    } else {
      setActionMsg({ type: 'error', text: 'Failed to approve request.' });
    }
    forceUpdate((n: number) => n + 1);
    setTimeout(() => setActionMsg(null), 4000);
  };

  const handleReject = (request: SignupRequest) => {
    const result = rejectRequest(request.id);
    if (result) {
      setActionMsg({ type: 'success', text: `${request.name}'s request has been rejected.` });
    } else {
      setActionMsg({ type: 'error', text: 'Failed to reject request.' });
    }
    forceUpdate((n: number) => n + 1);
    setTimeout(() => setActionMsg(null), 4000);
  };

  const statusBadge = (status: string) => {
    const config: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
      pending: { bg: 'var(--accent-orange-light)', color: 'var(--accent-orange)', icon: <Clock size={12} /> },
      approved: { bg: 'var(--accent-green-light)', color: 'var(--accent-green)', icon: <CheckCircle size={12} /> },
      rejected: { bg: 'var(--accent-red-light)', color: 'var(--accent-red)', icon: <XCircle size={12} /> },
    };
    const c = config[status] || config.pending;
    return (
      <span className="badge" style={{ background: c.bg, color: c.color, gap: 4 }}>
        {c.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const roleBadge = (role: string) => {
    const r = ROLES[role as keyof typeof ROLES];
    if (!r) return <span>{role}</span>;
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
        background: `${r.color}15`, color: r.color, border: `1px solid ${r.color}25`,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: r.color }} />
        {r.label}
      </span>
    );
  };

  const renderRequestCard = (request: SignupRequest, showActions: boolean) => (
    <div key={request.id} className="request-card">
      <div className="request-card-top">
        <div className="request-avatar" style={{
          background: request.status === 'pending'
            ? `linear-gradient(135deg, ${ROLES[request.role].color}40, ${ROLES[request.role].color}20)`
            : 'var(--bg-primary)',
          color: request.status === 'pending' ? ROLES[request.role].color : 'var(--text-muted)',
        }}>
          {request.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{request.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{request.email}</div>
        </div>
        {statusBadge(request.status)}
      </div>

      <div className="request-card-details">
        <div className="request-detail">
          <span className="request-detail-label">Role</span>
          {roleBadge(request.role)}
        </div>
        <div className="request-detail">
          <span className="request-detail-label">Store</span>
          <span style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Store size={12} style={{ color: 'var(--text-muted)' }} />
            {getStoreName(request.storeId)}
          </span>
        </div>
        <div className="request-detail">
          <span className="request-detail-label">Requested</span>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{request.createdAt}</span>
        </div>
      </div>

      {showActions && (
        <div className="request-card-actions">
          <button
            className="btn btn-success btn-sm"
            onClick={() => handleApprove(request)}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            <UserCheck size={14} /> Approve
          </button>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => handleReject(request)}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            <UserX size={14} /> Reject
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="page-header">
        <h2>Signup Requests</h2>
        <p>Review and manage pending account requests for your stores.</p>
      </div>

      {/* Action Message */}
      {actionMsg && (
        <div style={{
          padding: '12px 16px', marginBottom: 20,
          borderRadius: 'var(--radius-sm)',
          background: actionMsg.type === 'success' ? 'var(--accent-green-light)' : 'var(--accent-red-light)',
          color: actionMsg.type === 'success' ? 'var(--accent-green)' : 'var(--accent-red)',
          fontSize: 13, fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: 8,
          animation: 'slideUp 0.25s ease',
        }}>
          {actionMsg.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
          {actionMsg.text}
        </div>
      )}

      {/* Stats Row */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-info">
            <h4>Pending</h4>
            <div className="stat-value" style={{ color: 'var(--accent-orange)' }}>{pendingRequests.length}</div>
          </div>
          <div className="stat-icon orange"><Clock size={22} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h4>Approved</h4>
            <div className="stat-value" style={{ color: 'var(--accent-green)' }}>
              {requests.filter(r => r.status === 'approved').length}
            </div>
          </div>
          <div className="stat-icon green"><CheckCircle size={22} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h4>Rejected</h4>
            <div className="stat-value" style={{ color: 'var(--accent-red)' }}>
              {requests.filter(r => r.status === 'rejected').length}
            </div>
          </div>
          <div className="stat-icon" style={{ background: 'var(--accent-red-light)', color: 'var(--accent-red)' }}>
            <XCircle size={22} />
          </div>
        </div>
      </div>

      {/* Pending Requests */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={16} style={{ color: 'var(--accent-orange)' }} />
            Pending Requests
            {pendingRequests.length > 0 && (
              <span className="badge badge-pending" style={{ fontSize: 10 }}>
                {pendingRequests.length} awaiting
              </span>
            )}
          </h3>
        </div>
        <div className="card-body">
          {pendingRequests.length === 0 ? (
            <div className="empty-state">
              <UserCheck size={48} />
              <h4>No Pending Requests</h4>
              <p>All signup requests have been processed. New requests will appear here.</p>
            </div>
          ) : (
            <div className="requests-grid">
              {pendingRequests.map(r => renderRequestCard(r, true))}
            </div>
          )}
        </div>
      </div>

      {/* Processed Requests */}
      {processedRequests.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle size={16} style={{ color: 'var(--text-muted)' }} />
              Processed Requests
            </h3>
          </div>
          <div className="card-body">
            <div className="requests-grid">
              {processedRequests.map(r => renderRequestCard(r, false))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
