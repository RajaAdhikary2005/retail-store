import { useState, useEffect } from 'react';
import { Eye, EyeOff, Store, CheckCircle } from 'lucide-react';
import Logo from '../components/Logo';
import {
  USERS, ROLES,
  type UserInfo, type UserRole, type Store as StoreType,
  isEmailPending, fetchStoresFromApi,
  loginApi, signupApi, resetPasswordApi, verifyOtpApi, setNewPasswordApi
} from '../services/auth';

interface LoginProps {
  onLogin: (user: UserInfo) => void;
  onNavigate: (page: string) => void;
}

// Convert raw API/network errors to user-friendly messages
function friendlyError(msg: string): string {
  if (!msg) return 'Something went wrong. Please try again.';
  const lower = msg.toLowerCase();
  if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('network'))
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  if (lower.includes('500') || lower.includes('internal server'))
    return 'The server encountered an issue. Please try again in a moment.';
  if (lower.includes('json') || lower.includes('unexpected token'))
    return 'There was a communication error with the server. Please try again.';
  if (lower.includes('timeout'))
    return 'The request timed out. The server may be busy — please try again.';
  // Return the message as-is if it already looks user-friendly
  return msg;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'otp' | 'reset'>('login');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Signup fields
  const [signupName, setSignupName] = useState('');
  const [signupRole, setSignupRole] = useState<UserRole>('staff');
  const [storeName, setStoreName] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState<number>(0);

  // Stores loaded from backend API
  const [availableStores, setAvailableStores] = useState<StoreType[]>([]);
  const [storesLoading, setStoresLoading] = useState(false);

  // Fetch stores from API when switching to signup mode for manager/staff
  useEffect(() => {
    if (mode === 'signup' && (signupRole === 'manager' || signupRole === 'staff')) {
      setStoresLoading(true);
      fetchStoresFromApi().then(stores => {
        setAvailableStores(stores);
        setStoresLoading(false);
      });
    }
  }, [mode, signupRole]);

  const resetForm = (clearMessages = true) => {
    setEmail('');
    setPassword('');
    setOtp('');
    setNewPassword('');
    setSignupName('');
    setSignupRole('staff');
    setStoreName('');
    setSelectedStoreId(0);
    setError('');
    if (clearMessages) setSuccessMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (mode === 'signup') {
      // --- Signup Flow ---
      if (!signupName.trim()) {
        setError('Please enter your full name');
        return;
      }
      if (USERS[email.toLowerCase()]) {
        setError('An account with this email already exists. Try signing in.');
        return;
      }
      if (isEmailPending(email)) {
        setError('A signup request with this email is already pending approval.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }

      if (signupRole === 'admin') {
        // Admin signup — create store + account immediately
        if (!storeName.trim()) {
          setError('Please enter your store name');
          return;
        }
        
        const avatar = signupName.trim().split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
        
        signupApi({
          name: signupName.trim(),
          email: email.toLowerCase(),
          password,
          role: 'admin',
          avatar,
          status: 'approved',
          storeName: storeName.trim(),
        }).then(() => {
          return loginApi(email.toLowerCase(), password);
        }).then(user => {
          onLogin(user);
        }).catch(err => {
          setError(friendlyError(err.message));
        });
        return;
      } else {
        // Manager / Staff signup — submit request for admin approval
        if (!selectedStoreId) {
          setError('Please select a store to join');
          return;
        }
        
        const avatar = signupName.trim().split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
        
        signupApi({
          name: signupName.trim(),
          email: email.toLowerCase(),
          password,
          role: signupRole,
          avatar,
          storeId: selectedStoreId,
          status: 'pending'
        }).then(() => {
          resetForm(false);
          setSuccessMsg('Your signup request has been submitted successfully! You will be able to login once the store admin approves your request.');
        }).catch(err => {
          setError(friendlyError(err.message));
        });
        return;
      }
    }

    if (mode === 'forgot') {
      if (!email.trim()) { setError('Please enter your email address'); return; }
      resetPasswordApi(email.toLowerCase())
        .then(() => {
          setSuccessMsg('An OTP has been sent to your email.');
          setMode('otp');
        })
        .catch(err => { setError(friendlyError(err.message)); });
      return;
    }

    if (mode === 'otp') {
      if (!otp.trim()) { setError('Please enter the OTP'); return; }
      verifyOtpApi(email.toLowerCase(), otp.trim())
        .then(() => {
          setSuccessMsg('OTP verified. Please enter your new password.');
          setMode('reset');
        })
        .catch(err => { setError(friendlyError(err.message)); });
      return;
    }

    if (mode === 'reset') {
      if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
      setNewPasswordApi(email.toLowerCase(), otp.trim(), newPassword)
        .then(() => {
          setSuccessMsg('Password successfully reset. You can now login.');
          setMode('login');
          setPassword('');
        })
        .catch(err => { setError(friendlyError(err.message)); });
      return;
    }

    // --- Login Flow ---
    loginApi(email.toLowerCase(), password)
      .then(user => {
        onLogin(user);
      })
      .catch(err => {
        setError(friendlyError(err.message));
      });
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 460 }}>
        <div className="auth-brand" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <Logo size={48} />
            <span style={{ fontFamily: "'Outfit', 'Montserrat', 'Trebuchet MS', sans-serif", fontWeight: 800, fontSize: 24, letterSpacing: '-0.5px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>RetailStore</span>
          </div>
          <h1 style={{ marginTop: 0 }}>
            {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
          </h1>
          <p>
            {mode === 'login'
              ? 'Sign in to your retail admin panel'
              : mode === 'signup'
              ? 'Set up your retail admin account'
              : mode === 'otp'
              ? 'Enter the OTP sent to your email'
              : mode === 'reset'
              ? 'Set your new password'
              : 'Enter your email to reset password'}
          </p>
        </div>

        {/* Success Message */}
        {successMsg && (
          <div className="signup-success-banner">
            <CheckCircle size={18} />
            <div>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>Request Submitted!</div>
              <div>{successMsg}</div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Signup: Full Name */}
          {mode === 'signup' && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                type="text"
                placeholder="John Doe"
                required
                value={signupName}
                onChange={e => { setSignupName(e.target.value); setError(''); }}
              />
            </div>
          )}

          {/* Email */}
          {(mode === 'login' || mode === 'signup' || mode === 'forgot') && (
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                type="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); setSuccessMsg(''); }}
              />
            </div>
          )}

          {/* OTP */}
          {mode === 'otp' && (
            <div className="form-group">
              <label className="form-label">One-Time Password (OTP)</label>
              <input
                className="form-input"
                type="text"
                placeholder="123456"
                required
                maxLength={6}
                value={otp}
                onChange={e => { setOtp(e.target.value); setError(''); setSuccessMsg(''); }}
              />
            </div>
          )}

          {/* New Password */}
          {mode === 'reset' && (
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="••••••••"
                required
                minLength={6}
                value={newPassword}
                onChange={e => { setNewPassword(e.target.value); setError(''); setSuccessMsg(''); }}
              />
            </div>
          )}

          {/* Password */}
          {(mode === 'login' || mode === 'signup') && (
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                Password
                {mode === 'login' && (
                  <a
                    href="#"
                    onClick={e => { e.preventDefault(); setMode('forgot'); }}
                    style={{ color: 'var(--accent-blue)', textTransform: 'none', letterSpacing: 0, fontWeight: 500 }}
                  >
                    Forgot?
                  </a>
                )}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  style={{ paddingRight: 40 }}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          {/* Signup: Role Selection */}
          {mode === 'signup' && (
            <div className="form-group">
              <label className="form-label">Select Role</label>
              <div className="role-selector">
                {(['admin', 'manager', 'staff'] as UserRole[]).map(role => (
                  <button
                    key={role}
                    type="button"
                    className={`role-option ${signupRole === role ? 'active' : ''}`}
                    style={{
                      '--role-color': ROLES[role].color,
                    } as React.CSSProperties}
                    onClick={() => { setSignupRole(role); setError(''); }}
                  >
                    <div
                      className="role-dot"
                      style={{ background: ROLES[role].color }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{ROLES[role].label}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                        {role === 'admin' ? 'Create & own a store' : role === 'manager' ? 'Manage store operations' : 'Day-to-day tasks'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Signup: Admin — Store Name Input */}
          {mode === 'signup' && signupRole === 'admin' && (
            <div className="form-group">
              <label className="form-label">
                <Store size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                Store Name
              </label>
              <input
                className="form-input"
                type="text"
                placeholder="Enter your store name"
                required
                value={storeName}
                onChange={e => { setStoreName(e.target.value); setError(''); }}
              />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                You will be the owner and admin of this store.
              </div>
            </div>
          )}

          {/* Signup: Manager/Staff — Select Store Dropdown */}
          {mode === 'signup' && (signupRole === 'manager' || signupRole === 'staff') && (
            <div className="form-group">
              <label className="form-label">
                <Store size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                Select Store to Join
              </label>
              {storesLoading ? (
                <div style={{
                  padding: '12px 14px', background: 'var(--bg-primary)',
                  borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--text-muted)',
                  textAlign: 'center',
                }}>
                  Loading stores...
                </div>
              ) : availableStores.length > 0 ? (
                <>
                  <select
                    className="form-select"
                    required
                    value={selectedStoreId}
                    onChange={e => { setSelectedStoreId(Number(e.target.value)); setError(''); }}
                  >
                    <option value={0} disabled>Choose a store...</option>
                    {availableStores.map(store => (
                      <option key={store.id} value={store.id}>{store.name}</option>
                    ))}
                  </select>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    Your request will be sent to the store admin for approval.
                  </div>
                </>
              ) : (
                <div style={{
                  padding: '12px 14px', background: 'var(--accent-orange-light)',
                  color: 'var(--accent-orange)', borderRadius: 'var(--radius-sm)',
                  fontSize: 12, fontWeight: 500,
                }}>
                  No stores available yet. An admin must create a store first.
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              padding: '10px 14px', background: 'var(--accent-red-light)', color: 'var(--accent-red)',
              borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 500, marginBottom: 12,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 16, lineHeight: 1 }}>⚠</span>
              {error}
            </div>
          )}

          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: 14, justifyContent: 'center' }}
            type="submit"
          >
            {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : mode === 'otp' ? 'Verify OTP' : mode === 'reset' ? 'Set New Password' : 'Send OTP To Reset Password'}
          </button>
        </form>

        <div className="auth-footer">
          {mode === 'login' && (
            <>
              Don't have an account?{' '}
              <a href="#" onClick={e => { e.preventDefault(); resetForm(); setMode('signup'); }}>
                Sign up
              </a>
            </>
          )}
          {mode === 'signup' && (
            <>
              Already have an account?{' '}
              <a href="#" onClick={e => { e.preventDefault(); resetForm(); setMode('login'); }}>
                Sign in
              </a>
            </>
          )}
          {(mode === 'forgot' || mode === 'otp' || mode === 'reset') && (
            <a href="#" onClick={e => { e.preventDefault(); resetForm(); setMode('login'); }}>
              ← Back to Sign In
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
