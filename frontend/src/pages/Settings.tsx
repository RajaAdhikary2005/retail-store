import { useState } from 'react';
import { User, Mail, Shield, LogOut, Check, AlertCircle, Trash2 } from 'lucide-react';
import { type UserInfo, ROLES, deleteStoreApi, updateProfileApi, updatePasswordApi } from '../services/auth';

interface SettingsProps { onLogout: () => void; user?: UserInfo; onUpdateUser?: (u: UserInfo) => void; }

export default function Settings({ onLogout, user, onUpdateUser }: SettingsProps) {
  const userInfo = user || { name: 'Retail Admin', email: 'admin@retailstore.com', role: 'admin' as const, avatar: 'RA' };
  const [name, setName] = useState(userInfo.name);
  const [email, setEmail] = useState(userInfo.email);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const roleInfo = ROLES[userInfo.role];

  // Password state
  const [curPwd, setCurPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Delete store state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const handleUpdatePassword = async () => {
    if (!curPwd || newPwd.length < 6) return;
    setPwdSaving(true);
    setPwdMsg(null);
    try {
      await updatePasswordApi(curPwd, newPwd);
      setPwdMsg({ text: 'Password updated successfully!', ok: true });
      setCurPwd('');
      setNewPwd('');
    } catch (error: any) {
      setPwdMsg({ text: error?.message || 'Failed to update password', ok: false });
    } finally {
      setPwdSaving(false);
      setTimeout(() => setPwdMsg(null), 4000);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setMsg(null);

    try {
      const updated = await updateProfileApi(name.trim(), email.trim());
      const newUser: UserInfo = {
        ...userInfo,
        ...updated,
        token: userInfo.token,
      };
      if (onUpdateUser) onUpdateUser(newUser);
      localStorage.setItem('retailstore-user', JSON.stringify(newUser));
      setMsg({ text: 'Profile updated successfully!', ok: true });
    } catch (error: any) {
      setMsg({ text: error?.message || 'Failed to update profile', ok: false });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 3000);
    }
  };

  const handleDeleteStore = async () => {
    if (!userInfo.storeId) return;
    setDeleting(true);
    setDeleteMsg(null);
    try {
      const success = await deleteStoreApi(userInfo.storeId);
      if (success) {
        setDeleteMsg({ text: 'Store deleted successfully. Redirecting to login...', ok: true });
        setTimeout(() => {
          onLogout(); // Redirect to login/signup page
        }, 2000);
      } else {
        setDeleteMsg({ text: 'Failed to delete store. Please try again.', ok: false });
      }
    } catch {
      setDeleteMsg({ text: 'Network error', ok: false });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="page-header"><h2>Settings</h2><p>Manage your profile and application preferences.</p></div>

      <div className="settings-grid">
        <div className="card">
          <div className="card-header"><h3><User size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />Profile Settings</h3></div>
          <div className="card-body">
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input className="form-input" value={roleInfo.label} disabled style={{ background: 'var(--bg-primary)', flex: 1 }} />
                  <span style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                    background: `${roleInfo.color}15`, color: roleInfo.color,
                    border: `1px solid ${roleInfo.color}30`, whiteSpace: 'nowrap',
                  }}>{roleInfo.label}</span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Permissions</label>
                <div style={{ padding: 12, background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--text-secondary)' }}>
                  {roleInfo.description}
                </div>
              </div>

              {msg && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, marginBottom: 12,
                  fontSize: 13, fontWeight: 500,
                  background: msg.ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  color: msg.ok ? '#10b981' : '#ef4444',
                }}>
                  {msg.ok ? <Check size={14} /> : <AlertCircle size={14} />}
                  {msg.text}
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }} disabled={saving || !name.trim()}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><h3><Shield size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />Security</h3></div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input className="form-input" type="password" placeholder="Enter current password" value={curPwd} onChange={e => setCurPwd(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">New Password (min 6 chars)</label>
                <input className="form-input" type="password" placeholder="Enter new password" value={newPwd} onChange={e => setNewPwd(e.target.value)} />
              </div>
              {pwdMsg && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, marginBottom: 12,
                  fontSize: 13, fontWeight: 500,
                  background: pwdMsg.ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  color: pwdMsg.ok ? '#10b981' : '#ef4444',
                }}>
                  {pwdMsg.ok ? <Check size={14} /> : <AlertCircle size={14} />}
                  {pwdMsg.text}
                </div>
              )}
              <button type="button" className="btn btn-secondary" onClick={handleUpdatePassword} disabled={pwdSaving || !curPwd || newPwd.length < 6}>
                {pwdSaving ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><h3><Mail size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />Account Info</h3></div>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 20, fontWeight: 600 }}>{userInfo.avatar}</div>
                <div>
                  <div style={{ fontWeight: 600 }}>{name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{email}</div>
                  <span style={{
                    display: 'inline-block', marginTop: 4, padding: '2px 8px',
                    borderRadius: 10, fontSize: 10, fontWeight: 700,
                    background: `${roleInfo.color}15`, color: roleInfo.color,
                    border: `1px solid ${roleInfo.color}30`,
                  }}>{roleInfo.label}</span>
                </div>
              </div>
              <button className="btn btn-danger" onClick={onLogout}><LogOut size={14} />Sign Out</button>
            </div>
          </div>

          {/* Danger Zone — Admin only: Delete Store */}
          {userInfo.role === 'admin' && userInfo.storeId && (
            <div className="card" style={{ border: '1px solid rgba(239,68,68,0.3)' }}>
              <div className="card-header" style={{ background: 'rgba(239,68,68,0.05)' }}>
                <h3 style={{ color: '#ef4444' }}>
                  <Trash2 size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                  Danger Zone
                </h3>
              </div>
              <div className="card-body">
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                  Permanently delete your store and <strong>all its data</strong> — including all users, products, customers, orders, suppliers, and more. This action <strong>cannot be undone</strong>. Other stores will not be affected.
                </p>

                {!showDeleteConfirm ? (
                  <button
                    className="btn btn-danger"
                    onClick={() => setShowDeleteConfirm(true)}
                    style={{ gap: 6 }}
                  >
                    <Trash2 size={14} /> Delete This Store
                  </button>
                ) : (
                  <div style={{ padding: 16, background: 'rgba(239,68,68,0.06)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.15)' }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#ef4444', marginBottom: 12 }}>
                      ⚠️ Are you absolutely sure? Type <strong>DELETE</strong> to confirm:
                    </p>
                    <input
                      className="form-input"
                      value={deleteConfirmText}
                      onChange={e => setDeleteConfirmText(e.target.value)}
                      placeholder='Type "DELETE" to confirm'
                      style={{ marginBottom: 12, borderColor: 'rgba(239,68,68,0.3)' }}
                    />

                    {deleteMsg && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, marginBottom: 12,
                        fontSize: 13, fontWeight: 500,
                        background: deleteMsg.ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                        color: deleteMsg.ok ? '#10b981' : '#ef4444',
                      }}>
                        {deleteMsg.ok ? <Check size={14} /> : <AlertCircle size={14} />}
                        {deleteMsg.text}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        className="btn btn-secondary"
                        onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); setDeleteMsg(null); }}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn btn-danger"
                        disabled={deleteConfirmText !== 'DELETE' || deleting}
                        onClick={handleDeleteStore}
                        style={{ gap: 6 }}
                      >
                        <Trash2 size={14} />
                        {deleting ? 'Deleting...' : 'Permanently Delete Store'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

