import { useState, useRef, useEffect } from 'react';
import { Search, Bell, Menu, LogOut, User, Settings, X, Sun, Moon } from 'lucide-react';
import { type UserInfo, ROLES } from '../services/auth';

interface NavbarProps {
  pageTitle: string;
  onToggleSidebar: () => void;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  globalSearch: string;
  onGlobalSearchChange: (val: string) => void;
  darkMode: boolean;
  onToggleDark: () => void;
  user: UserInfo;
}

const pageTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  products: 'Product Management',
  customers: 'Customer Management',
  orders: 'Order Management',
  analytics: 'Analytics & Reports',
  dues: 'Dues & Payments',
  requests: 'Signup Requests',
  'customer-lookup': 'Customer Lookup',
  'inventory-alerts': 'Inventory & Stock Alerts',
  returns: 'Returns & Refunds',
  'user-management': 'User & Staff Management',
  'audit-logs': 'Activity Audit Logs',
  suppliers: 'Suppliers & Purchase Orders',
  promotions: 'Discounts & Promotions',
  'take-order': 'Take New Order',
  settings: 'Settings',
};

const notifications = [
  { id: 1, text: 'Order #1004 is pending approval', time: '5 min ago', read: false },
  { id: 2, text: 'Low stock alert: Ceramic Coffee Mug Set (3 left)', time: '1 hr ago', read: false },
  { id: 3, text: 'New customer Divya Nair registered', time: '3 hrs ago', read: true },
  { id: 4, text: 'Order #1001 delivered successfully', time: '1 day ago', read: true },
];

export default function Navbar({ pageTitle, onToggleSidebar, onNavigate, onLogout, globalSearch, onGlobalSearchChange, darkMode, onToggleDark, user }: NavbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button className="navbar-icon-btn mobile-menu-btn" onClick={onToggleSidebar} id="menu-toggle">
          <Menu size={18} />
        </button>
        <div>
          <h1>{pageTitles[pageTitle] || 'Dashboard'}</h1>
          <div className="breadcrumb">Home / {pageTitles[pageTitle] || 'Dashboard'}</div>
        </div>
      </div>
      <div className="navbar-right">
        {/* Global Search */}
        <div className="navbar-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search anything..."
            value={globalSearch}
            onChange={e => onGlobalSearchChange(e.target.value)}
          />
          {globalSearch && (
            <button onClick={() => onGlobalSearchChange('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Dark Mode Toggle */}
        <button className="dark-toggle" onClick={onToggleDark} title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notifications */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button className="navbar-icon-btn" onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}>
            <Bell size={16} />
            {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </button>
          {showNotifications && (
            <div className="dropdown-menu notif-dropdown">
              <div className="dropdown-header">
                <h4>Notifications</h4>
                <span className="badge badge-processing" style={{ fontSize: 10 }}>{unreadCount} new</span>
              </div>
              <div className="dropdown-body">
                {notifications.map(n => (
                  <div key={n.id} className={`notif-item ${n.read ? '' : 'unread'}`}>
                    <div className="notif-dot" style={{ background: n.read ? 'transparent' : 'var(--accent-blue)' }} />
                    <div>
                      <p className="notif-text">{n.text}</p>
                      <span className="notif-time">{n.time}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="dropdown-footer">
                <button className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>View All Notifications</button>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div ref={profileRef} style={{ position: 'relative' }}>
          <div className="navbar-avatar" onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }} title={user.name}>{user.avatar}</div>
          {showProfile && (
            <div className="dropdown-menu profile-dropdown">
              <div className="dropdown-header" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="navbar-avatar" style={{ width: 40, height: 40, fontSize: 14 }}>{user.avatar}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{user.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user.email}</div>
                  <span style={{
                    display: 'inline-block', marginTop: 4, padding: '2px 8px',
                    borderRadius: 10, fontSize: 10, fontWeight: 700,
                    background: `${ROLES[user.role].color}15`,
                    color: ROLES[user.role].color,
                    border: `1px solid ${ROLES[user.role].color}30`,
                  }}>{ROLES[user.role].label}</span>
                </div>
              </div>
              <div className="dropdown-body">
                <button className="dropdown-item" onClick={() => { onNavigate('settings'); setShowProfile(false); }}>
                  <User size={15} /> My Profile
                </button>
                <button className="dropdown-item" onClick={() => { onNavigate('settings'); setShowProfile(false); }}>
                  <Settings size={15} /> Settings
                </button>
              </div>
              <div className="dropdown-footer">
                <button className="dropdown-item danger" onClick={onLogout}>
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
