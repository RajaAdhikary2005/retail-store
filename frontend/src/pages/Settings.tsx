import { useState } from 'react';
import { User, Mail, Shield, LogOut, Check, AlertCircle } from 'lucide-react';
import { type UserInfo, ROLES } from '../services/auth';

const API_BASE = 'https://retail-store-k6pr.onrender.com/api';

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

  const handleUpdatePassword = async () => {
    if (!curPwd || newPwd.length < 6) return;
    setPwdSaving(true);
    setPwdMsg(null);
    try {
      const res = await fetch(`${API_BASE}/auth/update-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userInfo.email, currentPassword: curPwd, newPassword: newPwd }),
      });
      if (res.ok) {
        setPwdMsg({ text: 'Password updated successfully!', ok: true });
        setCurPwd('');
        setNewPwd('');
      } else {
        const errText = await res.text();
        setPwdMsg({ text: errText || 'Failed to update password', ok: false });
      }
    } catch {
      setPwdMsg({ text: 'Network error', ok: false });
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
      const res = await fetch(`${API_BASE}/auth/update-profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentEmail: userInfo.email,
          name: name.trim(),
          email: email.trim(),
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        const newUser: UserInfo = {
          name: updated.name,
          email: updated.email,
          role: updated.role || userInfo.role,
          avatar: updated.avatar || userInfo.avatar,
          storeId: updated.storeId || userInfo.storeId,
        };

        // Update parent state
        if (onUpdateUser) onUpdateUser(newUser);

        setMsg({ text: 'Profile updated successfully!', ok: true });
      } else {
        const errText = await res.text();
        setMsg({ text: errText || 'Failed to update profile', ok: false });
      }
    } catch {
      setMsg({ text: 'Network error — could not reach server', ok: false });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 3000);
    }
  };

  return (
    <>
      <div className="page-header"><h2>Settings</h2><p>Manage your profile and application preferences.</p></div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 900 }}>
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

          <div className="card">
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
        </div>
      </div>
    </>
  );
}
