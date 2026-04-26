import { LayoutDashboard, Package, Users, ShoppingCart, BarChart3, Settings, LogOut, IndianRupee, UserCheck, Search, AlertTriangle, RotateCcw, Shield, FileText, Truck, Tag } from 'lucide-react';
import { type UserRole, ROLES, canAccessPage, getPendingCountForAdmin } from '../services/auth';
import { type UserInfo } from '../services/auth';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isOpen: boolean;
  userRole: UserRole;
  user?: UserInfo;
}

const allNavItems = [
  { section: 'Main', items: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
  ]},
  { section: 'Finance', items: [
    { id: 'dues', label: 'Dues & Payments', icon: IndianRupee },
  ]},
  { section: 'Operations', items: [
    { id: 'take-order', label: 'Take Order', icon: ShoppingCart },
    { id: 'customer-lookup', label: 'Customer Lookup', icon: Search },
    { id: 'inventory-alerts', label: 'Inventory Alerts', icon: AlertTriangle },
    { id: 'returns', label: 'Returns & Refunds', icon: RotateCcw },
  ]},
  { section: 'Insights', items: [
    { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3 },
  ]},
  { section: 'Admin', items: [
    { id: 'user-management', label: 'User Management', icon: Shield },
    { id: 'suppliers', label: 'Suppliers & POs', icon: Truck },
    { id: 'promotions', label: 'Promotions', icon: Tag },
    { id: 'audit-logs', label: 'Audit Logs', icon: FileText },
    { id: 'requests', label: 'Signup Requests', icon: UserCheck },
  ]},
  { section: 'System', items: [
    { id: 'settings', label: 'Settings', icon: Settings },
  ]},
];

export default function Sidebar({ currentPage, onNavigate, isOpen, userRole, user }: SidebarProps) {
  // Filter nav items based on role permissions
  const navItems = allNavItems
    .map(section => ({
      ...section,
      items: section.items.filter(item => canAccessPage(userRole, item.id)),
    }))
    .filter(section => section.items.length > 0);

  const roleInfo = ROLES[userRole];
  const pendingCount = user && userRole === 'admin' ? getPendingCountForAdmin(user.email) : 0;

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <img src="/retailstore-logo.png" alt="RetailStore" style={{ width: 38, height: 38, borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
        <div>
          <h2>RetailStore</h2>
          <span>Management System</span>
        </div>
      </div>

      {/* Role Badge */}
      <div style={{
        margin: '12px 16px 0', padding: '8px 12px',
        background: `${roleInfo.color}15`, borderRadius: 'var(--radius-sm)',
        display: 'flex', alignItems: 'center', gap: 8,
        border: `1px solid ${roleInfo.color}30`,
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: roleInfo.color, flexShrink: 0,
          boxShadow: `0 0 6px ${roleInfo.color}60`,
        }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: roleInfo.color, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {roleInfo.label} Access
        </span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(section => (
          <div className="sidebar-section" key={section.section}>
            <div className="sidebar-section-title">{section.section}</div>
            {section.items.map(item => (
              <button
                key={item.id}
                className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
                onClick={() => onNavigate(item.id)}
              >
                <item.icon size={18} />
                {item.label}
                {item.id === 'requests' && pendingCount > 0 && (
                  <span style={{
                    marginLeft: 'auto',
                    background: 'var(--accent-orange)',
                    color: 'white',
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: 10,
                    minWidth: 18,
                    textAlign: 'center',
                    lineHeight: '14px',
                  }}>
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        ))}
        <div className="sidebar-section" style={{ marginTop: 'auto' }}>
          <button className="nav-item" onClick={() => onNavigate('login')} style={{ color: 'rgba(255,255,255,0.45)' }}>
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </nav>
    </aside>
  );
}
