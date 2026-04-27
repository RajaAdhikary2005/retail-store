import { useState, useEffect } from 'react';
import './index.css';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Logo from './components/Logo';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Orders from './pages/Orders';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Dues from './pages/Dues';
import Requests from './pages/Requests';
import CustomerLookup from './pages/CustomerLookup';
import InventoryAlerts from './pages/InventoryAlerts';
import Returns from './pages/Returns';
import UserManagement from './pages/UserManagement';
import AuditLogs from './pages/AuditLogs';
import Suppliers from './pages/Suppliers';
import Promotions from './pages/Promotions';
import TakeOrder from './pages/TakeOrder';
import { Heart, Mail } from 'lucide-react';
import { type UserInfo, canAccessPage } from './services/auth';

function App() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('retailstore-dark-mode');
    return saved === 'true';
  });

  // Apply dark mode to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('retailstore-dark-mode', String(darkMode));
  }, [darkMode]);

  const handleLogin = (userInfo: UserInfo) => {
    setUser(userInfo);
    localStorage.setItem('retailstore-user', JSON.stringify(userInfo));
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('retailstore-user');
    setCurrentPage('dashboard');
    setGlobalSearch('');
  };

  const handleNavigate = (page: string) => {
    if (page === 'login') { handleLogout(); return; }
    // Check permission before navigating
    if (user && !canAccessPage(user.role, page)) return;
    setCurrentPage(page);
    setSidebarOpen(false);
  };

  if (!user) return <Login onLogin={handleLogin} onNavigate={handleNavigate} />;

  const renderPage = () => {
    // Verify access
    if (!canAccessPage(user.role, currentPage) && currentPage !== 'dashboard') {
      setCurrentPage('dashboard');
      return <Dashboard />;
    }
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'products': return <Products globalSearch={globalSearch} userRole={user.role} />;
      case 'customers': return <Customers globalSearch={globalSearch} userRole={user.role} />;
      case 'orders': return <Orders globalSearch={globalSearch} userRole={user.role} />;
      case 'analytics': return <Analytics />;
      case 'dues': return <Dues userRole={user.role} />;
      case 'requests': return <Requests user={user} />;
      case 'customer-lookup': return <CustomerLookup />;
      case 'inventory-alerts': return <InventoryAlerts />;
      case 'returns': return <Returns userRole={user.role} userName={user.name} />;
      case 'user-management': return <UserManagement user={user} />;
      case 'audit-logs': return <AuditLogs />;
      case 'suppliers': return <Suppliers userRole={user.role} />;
      case 'promotions': return <Promotions />;
      case 'take-order': return <TakeOrder userRole={user.role} userName={user.name} />;
      case 'settings': return <Settings onLogout={handleLogout} user={user} onUpdateUser={setUser} />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar currentPage={currentPage} onNavigate={handleNavigate} isOpen={sidebarOpen} userRole={user.role} user={user} />
      <div className="main-wrapper">
        <Navbar
          pageTitle={currentPage}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          globalSearch={globalSearch}
          onGlobalSearchChange={setGlobalSearch}
          darkMode={darkMode}
          onToggleDark={() => setDarkMode(d => !d)}
          user={user}
        />
        <main className="main-content">{renderPage()}</main>

        {/* Footer */}
        <footer className="app-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <Logo size={32} />
            <span style={{ fontFamily: "'Outfit', 'Montserrat', 'Trebuchet MS', sans-serif", fontWeight: 700, fontSize: 15, letterSpacing: '-0.3px', background: 'linear-gradient(135deg, #64748b, #0f172a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>RetailStore</span>
          </div>
          <div className="footer-brand">
            Made with <Heart size={12} style={{ color: '#ef4444', fill: '#ef4444', display: 'inline', verticalAlign: 'middle', margin: '0 3px' }} /> by Raja Adhikary
          </div>
          <div>
            © {new Date().getFullYear()} Raja Adhikary. All rights reserved.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Mail size={12} />
            <a href="mailto:rajaadhikary05032005@gmail.com">rajaadhikary05032005@gmail.com</a>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
