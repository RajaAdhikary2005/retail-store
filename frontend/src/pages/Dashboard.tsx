import { useEffect, useState } from 'react';
import { IndianRupee, ShoppingCart, Users, TrendingUp, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler } from 'chart.js';
import { fetchDashboardStats, fetchOrders, fetchAnalytics } from '../services/api';
import type { DashboardStats, Order, SalesTrend, TopProduct, CategoryDistribution } from '../types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [salesTrends, setSalesTrends] = useState<SalesTrend[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [catDist, setCatDist] = useState<CategoryDistribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchDashboardStats(), fetchOrders(), fetchAnalytics()]).then(([s, o, a]) => {
      setStats(s);
      // Sort orders by date descending so newest appear first
      const sorted = [...o].sort((a, b) => {
        const da = a.orderDate ? new Date(a.orderDate).getTime() : 0;
        const db = b.orderDate ? new Date(b.orderDate).getTime() : 0;
        return db - da;
      });
      setRecentOrders(sorted.slice(0, 5)); setSalesTrends(a.salesTrends);
      setTopProducts(a.topProducts); setCatDist(a.categoryDistribution); setLoading(false);
    });
  }, []);

  if (loading || !stats) return <div className="loading-spinner"><div className="spinner" /></div>;

  const statCards = [
    { title: 'Total Sales', value: `₹${stats.totalSales.toLocaleString()}`, change: stats.salesGrowth, icon: IndianRupee, color: 'blue' },
    { title: 'Total Orders', value: stats.totalOrders.toLocaleString(), change: stats.orderGrowth, icon: ShoppingCart, color: 'green' },
    { title: 'Total Customers', value: stats.totalCustomers.toLocaleString(), change: stats.customerGrowth, icon: Users, color: 'purple' },
    { title: 'Monthly Revenue', value: `₹${stats.monthlyRevenue.toLocaleString()}`, change: stats.revenueGrowth, icon: TrendingUp, color: 'orange' },
  ];

  const lineData = {
    labels: salesTrends.map(s => s.month),
    datasets: [{
      label: 'Sales (₹)', data: salesTrends.map(s => s.sales), fill: true,
      borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.08)',
      tension: 0.4, pointRadius: 4, pointBackgroundColor: '#3b82f6',
    }]
  };

  const barData = {
    labels: topProducts.map(p => p.name),
    datasets: [{
      label: 'Revenue (₹)', data: topProducts.map(p => p.revenue),
      backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'],
      borderRadius: 6, barThickness: 32,
    }]
  };

  const pieColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899'];
  const doughnutData = {
    labels: catDist.map(c => c.category),
    datasets: [{
      data: catDist.map(c => c.count),
      backgroundColor: pieColors.slice(0, catDist.length),
      borderWidth: 0, hoverOffset: 8,
    }]
  };

  const chartOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { color: '#f1f5f9' }, border: { display: false } } } } as const;
  const pieOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' as const, labels: { padding: 16, usePointStyle: true, pointStyle: 'circle', font: { size: 11 } } } } };

  const statusClass = (s: string) => `badge badge-${s.toLowerCase()}`;

  return (
    <>
      <div className="page-header">
        <h2>Dashboard Overview</h2>
        <p>Welcome back! Here's what's happening with your store today.</p>
      </div>

      <div className="stats-grid">
        {statCards.map(c => (
          <div className="stat-card" key={c.title}>
            <div className="stat-info">
              <h4>{c.title}</h4>
              <div className="stat-value">{c.value}</div>
              <div className={`stat-change ${c.change > 0 ? 'positive' : c.change < 0 ? 'negative' : 'neutral'}`}>
                {c.change > 0 ? <ArrowUpRight size={14} /> : c.change < 0 ? <ArrowDownRight size={14} /> : <Minus size={14} />}
                {c.change === 0 ? 'No change from last month' : `${Math.abs(c.change)}% from last month`}
              </div>
            </div>
            <div className={`stat-icon ${c.color}`}><c.icon size={22} /></div>
          </div>
        ))}
      </div>

      <div className="charts-grid">
        <div className="card">
          <div className="card-header"><h3>Sales Over Time</h3></div>
          <div className="card-body" style={{ height: 300 }}>
            <Line data={lineData} options={chartOpts} />
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3>Category Distribution</h3></div>
          <div className="card-body" style={{ height: 300 }}>
            <Doughnut data={doughnutData} options={pieOpts} />
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="card">
          <div className="card-header"><h3>Top Products by Revenue</h3></div>
          <div className="card-body" style={{ height: 300 }}>
            <Bar data={barData} options={chartOpts} />
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3>Recent Orders</h3></div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="data-table">
              <thead><tr><th>Order ID</th><th>Customer</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>
                {recentOrders.map(o => (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 600 }}>#{o.id}</td>
                    <td>{o.customerName}</td>
                    <td>₹{o.totalAmount.toFixed(2)}</td>
                    <td><span className={statusClass(o.status)}>{o.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
