import { useState } from 'react';
import { User, Mail, Shield, LogOut } from 'lucide-react';
import { type UserInfo, ROLES } from '../services/auth';

interface SettingsProps { onLogout: () => void; user?: UserInfo; }

export default function Settings({ onLogout, user }: SettingsProps) {
  const userInfo = user || { name: 'Retail Admin', email: 'admin@retailstore.com', role: 'admin' as const, avatar: 'RA' };
  const [name, setName] = useState(userInfo.name);
  const [email, setEmail] = useState(userInfo.email);
  const [saved, setSaved] = useState(false);
  const roleInfo = ROLES[userInfo.role];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
              <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }}>
                {saved ? '✓ Saved!' : 'Save Changes'}
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
                <input className="form-input" type="password" placeholder="••••••••" />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input className="form-input" type="password" placeholder="••••••••" />
              </div>
              <button type="button" className="btn btn-secondary">Update Password</button>
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
