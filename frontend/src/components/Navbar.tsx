import { useState, useRef, useEffect } from 'react';
import { Search, Bell, Menu, LogOut, User, Settings, X, Sun, Moon } from 'lucide-react';
import { type UserInfo, ROLES } from '../services/auth';
import { fetchOrders, fetchProducts } from '../services/api';

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

interface NotifItem {
  id: number;
  text: string;
  time: string;
  read: boolean;
}

export default function Navbar({ pageTitle, onToggleSidebar, onNavigate, onLogout, globalSearch, onGlobalSearchChange, darkMode, onToggleDark, user }: NavbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState<NotifItem[]>([]);
  const [notifLoaded, setNotifLoaded] = useState(false);
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

  // Load real notifications from API data
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const [orders, products] = await Promise.all([fetchOrders(), fetchProducts()]);
        const notifs: NotifItem[] = [];
        let id = 1;

        // Pending orders
        const pending = orders.filter(o => o.status === 'Pending' || o.status === 'Processing');
        pending.slice(0, 2).forEach(o => {
          notifs.push({
            id: id++,
            text: `Order #${o.id} is ${o.status.toLowerCase()} — ₹${o.totalAmount?.toLocaleString('en-IN') || 0}`,
            time: o.orderDate ? new Date(o.orderDate).toLocaleDateString() : 'Recently',
            read: false,
          });
        });

        // Low stock alerts
        const lowStock = products.filter(p => p.stockQuantity <= 5 && p.stockQuantity > 0).slice(0, 2);
        lowStock.forEach(p => {
          notifs.push({
            id: id++,
            text: `Low stock alert: ${p.name} (${p.stockQuantity} left)`,
            time: 'Now',
            read: false,
          });
        });

        // Out of stock
        const outOfStock = products.filter(p => p.stockQuantity <= 0).slice(0, 1);
        outOfStock.forEach(p => {
          notifs.push({
            id: id++,
            text: `Out of stock: ${p.name}`,
            time: 'Now',
            read: false,
          });
        });

        // Recent completed orders
        const completed = orders.filter(o => o.status === 'Completed' || o.status === 'Delivered').slice(0, 2);
        completed.forEach(o => {
          notifs.push({
            id: id++,
            text: `Order #${o.id} for ${o.customerName || 'customer'} completed`,
            time: o.orderDate ? new Date(o.orderDate).toLocaleDateString() : 'Recently',
            read: true,
          });
        });

        // If no real notifications, show a welcome message
        if (notifs.length === 0) {
          notifs.push({
            id: id++,
            text: 'Welcome! No new notifications right now.',
            time: 'Now',
            read: true,
          });
        }

        setNotifications(notifs);
        setNotifLoaded(true);
      } catch {
        setNotifications([{
          id: 1,
          text: 'Could not load notifications.',
          time: 'Now',
          read: true,
        }]);
        setNotifLoaded(true);
      }
    };

    loadNotifications();
    // Refresh every 60 seconds
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

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
                {unreadCount > 0 && (
                  <span className="badge badge-processing" style={{ fontSize: 10 }}>{unreadCount} new</span>
                )}
              </div>
              <div className="dropdown-body">
                {!notifLoaded ? (
                  <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading...</div>
                ) : notifications.length === 0 ? (
                  <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No notifications</div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className={`notif-item ${n.read ? '' : 'unread'}`}>
                      <div className="notif-dot" style={{ background: n.read ? 'transparent' : 'var(--accent-blue)' }} />
                      <div>
                        <p className="notif-text">{n.text}</p>
                        <span className="notif-time">{n.time}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="dropdown-footer">
                {unreadCount > 0 ? (
                  <button className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={handleMarkAllRead}>
                    Mark All as Read
                  </button>
                ) : (
                  <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', padding: '4px 0' }}>You're all caught up!</div>
                )}
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
