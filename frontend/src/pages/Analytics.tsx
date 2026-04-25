import { useEffect, useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { fetchAnalytics, fetchOrders } from '../services/api';
import type { AnalyticsData, Order } from '../types';
import { TrendingUp, TrendingDown, AlertTriangle, Award, Crown, Calendar } from 'lucide-react';

type TrendPeriod = 'day' | 'month' | 'year';

interface TrendPoint { label: string; sales: number; orders: number; }

function buildTrends(orders: Order[], period: TrendPeriod): TrendPoint[] {
  const map: Record<string, { sales: number; orders: number }> = {};
  orders.forEach(o => {
    let key = 'Unknown';
    const d = o.orderDate;
    if (d) {
      if (period === 'day') key = d.substring(0, 10); // YYYY-MM-DD
      else if (period === 'month') key = d.substring(0, 7); // YYYY-MM
      else key = d.substring(0, 4); // YYYY
    }
    if (!map[key]) map[key] = { sales: 0, orders: 0 };
    map[key].sales += o.totalAmount || 0;
    map[key].orders += 1;
  });
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, data]) => ({ label, ...data }));
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>('day');

  useEffect(() => {
    Promise.all([fetchAnalytics(), fetchOrders()]).then(([d, o]) => {
      setData(d);
      setAllOrders(o);
      setLoading(false);
    });
  }, []);

  if (loading || !data) return <div className="loading-spinner"><div className="spinner" /></div>;

  const trendData = buildTrends(allOrders, trendPeriod);

  const revLineData = {
    labels: data.monthlyRevenue.map(m => m.month),
    datasets: [{
      label: 'Revenue (₹)', data: data.monthlyRevenue.map(m => m.revenue),
      borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.08)',
      fill: true, tension: 0.4, pointRadius: 5, pointBackgroundColor: '#10b981',
    }]
  };

  const salesBarData = {
    labels: trendData.map(s => s.label),
    datasets: [
      { label: 'Sales (₹)', data: trendData.map(s => s.sales), backgroundColor: '#3b82f6', borderRadius: 6, barThickness: trendPeriod === 'day' ? 16 : 24 },
    ]
  };

  const chartOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'top' as const, labels: { usePointStyle: true, pointStyle: 'circle', font: { size: 11 } } } }, scales: { x: { grid: { display: false } }, y: { grid: { color: '#f1f5f9' }, border: { display: false } } } };

  const rankClass = (r: number) => r <= 3 ? `rank-${r}` : 'rank-default';

  const periodLabel = (p: TrendPeriod) => p === 'day' ? 'Daily' : p === 'month' ? 'Monthly' : 'Yearly';

  return (
    <>
      <div className="page-header"><h2>Analytics & Reports</h2><p>Advanced SQL-based insights and data analysis powered by aggregation, window functions, and CTEs.</p></div>

      {/* Revenue Growth with CTE-based growth calc */}
      <div className="charts-grid" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header"><h3>📈 Monthly Revenue Growth <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8 }}>CTE + Window Function: LAG()</span></h3></div>
          <div className="card-body" style={{ height: 320 }}><Line data={revLineData} options={chartOpts} /></div>
        </div>
        <div className="card">
          <div className="card-header"><h3>Growth Rate Analysis</h3></div>
          <div className="card-body">
            {data.monthlyRevenue.map(m => (
              <div key={m.month} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ fontWeight: 500 }}>{m.month}</span>
                <span style={{ fontWeight: 500 }}>₹{m.revenue.toLocaleString()}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600, color: m.growth >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                  {m.growth >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {m.growth === 0 ? '—' : `${m.growth > 0 ? '+' : ''}${m.growth}%`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sales Trends with Day/Month/Year toggle */}
      <div className="charts-grid" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              📊 Sales Trends
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 4 }}>
                {periodLabel(trendPeriod)} View • Aggregation: SUM, COUNT, AVG
              </span>
            </h3>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['day', 'month', 'year'] as TrendPeriod[]).map(p => (
                <button
                  key={p}
                  className={`btn btn-sm ${trendPeriod === p ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setTrendPeriod(p)}
                  style={{ textTransform: 'capitalize', minWidth: 64, justifyContent: 'center', gap: 4 }}
                >
                  <Calendar size={12} />
                  {p === 'day' ? 'Day' : p === 'month' ? 'Month' : 'Year'}
                </button>
              ))}
            </div>
          </div>
          <div className="card-body" style={{ height: 320 }}><Bar data={salesBarData} options={chartOpts} /></div>
        </div>
        <div className="card">
          <div className="card-header"><h3>Summary Statistics</h3></div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {(() => {
                // Compute from individual orders for accurate stats
                const allTrends = data.salesTrends;
                const totalSales = allTrends.reduce((a, s) => a + s.sales, 0);
                const totalOrders = allTrends.reduce((a, s) => a + s.orders, 0);
                const avgPerOrder = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;
                const maxMonthlySales = allTrends.length > 0 ? Math.max(...allTrends.map(s => s.sales)) : 0;
                const avgMonthlySales = allTrends.length > 0 ? Math.round(totalSales / allTrends.length) : 0;
                return [
                  { label: 'SUM(sales)', value: `₹${totalSales.toLocaleString()}`, color: 'var(--accent-blue)' },
                  { label: 'AVG(per order)', value: `₹${avgPerOrder.toLocaleString()}`, color: 'var(--accent-green)' },
                  { label: 'COUNT(orders)', value: totalOrders.toLocaleString(), color: 'var(--accent-purple, #8b5cf6)' },
                  { label: 'MAX(monthly)', value: `₹${maxMonthlySales.toLocaleString()}`, color: 'var(--accent-orange)' },
                  { label: 'AVG(monthly)', value: `₹${avgMonthlySales.toLocaleString()}`, color: '#06b6d4' },
                  { label: 'MONTHS', value: allTrends.length.toLocaleString(), color: '#64748b' },
                ].map(s => (
                  <div key={s.label} style={{ padding: 16, background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>{s.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Rankings with Window Functions */}
      <div className="charts-grid" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header"><h3><Crown size={16} style={{ marginRight: 6, verticalAlign: 'middle', color: 'var(--accent-orange)' }} />Top Customers <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8 }}>Window: RANK(), ROW_NUMBER()</span></h3></div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="data-table">
              <thead><tr><th>Rank</th><th>Customer</th><th>Orders</th><th>Total Spent</th></tr></thead>
              <tbody>
                {data.topCustomers.map(c => (
                  <tr key={c.id}>
                    <td><span className={`rank-badge ${rankClass(c.rank)}`}>{c.rank}</span></td>
                    <td style={{ fontWeight: 500 }}>{c.name}</td>
                    <td>{c.totalOrders}</td>
                    <td style={{ fontWeight: 600, color: 'var(--accent-green)' }}>₹{c.totalSpent.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3><Award size={16} style={{ marginRight: 6, verticalAlign: 'middle', color: 'var(--accent-blue)' }} />Best-Selling Products <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8 }}>Window: DENSE_RANK()</span></h3></div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="data-table">
              <thead><tr><th>Rank</th><th>Product</th><th>Units Sold</th><th>Revenue</th></tr></thead>
              <tbody>
                {data.topProducts.map(p => (
                  <tr key={p.name}>
                    <td><span className={`rank-badge ${rankClass(p.rank)}`}>{p.rank}</span></td>
                    <td style={{ fontWeight: 500 }}>{p.name}</td>
                    <td>{p.sales}</td>
                    <td style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>₹{p.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Inventory Alerts */}
      <div className="card">
        <div className="card-header"><h3><AlertTriangle size={16} style={{ marginRight: 6, verticalAlign: 'middle', color: 'var(--accent-orange)' }} />Inventory Alerts <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8 }}>CASE + WHERE stock {'<'} threshold</span></h3></div>
        <div className="card-body">
          {data.inventoryAlerts.map(a => (
            <div key={a.productId} className={`alert-item ${a.status.toLowerCase()}`}>
              <div>
                <div style={{ fontWeight: 500 }}>{a.productName}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Product #{a.productId}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: 18 }}>{a.currentStock}</div>
                <div style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 600, color: a.status === 'Critical' ? 'var(--accent-red)' : a.status === 'Low' ? 'var(--accent-orange)' : 'var(--accent-green)' }}>{a.status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
