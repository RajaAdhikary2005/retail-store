import { useState, useEffect } from 'react';
import { Search, Star, ChevronDown, ChevronUp, Mail, Phone, MapPin, ShoppingBag } from 'lucide-react';
import { fetchCustomers, fetchOrders } from '../services/api';
import type { Customer, Order } from '../types';

const tiers = [
  { tier: 'All', color: 'var(--accent-blue)', min: '' },
  { tier: 'Bronze', color: '#d97706', min: '0-499' },
  { tier: 'Silver', color: '#94a3b8', min: '500-999' },
  { tier: 'Gold', color: '#f59e0b', min: '1000-1999' },
  { tier: 'Platinum', color: '#8b5cf6', min: '2000+' },
];

export default function CustomerLookup() {
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('All');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchCustomers(), fetchOrders()]).then(([c, o]) => {
      setCustomers(c);
      setOrders(o);
      setLoading(false);
    });
  }, []);

  const liveData = customers.map(c => {
    const custOrders = orders.filter(o => o.customerId === c.id && o.status !== 'Cancelled');
    const totalSpent = custOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    let tier = 'Bronze';
    if (totalSpent >= 2000) tier = 'Platinum';
    else if (totalSpent >= 1000) tier = 'Gold';
    else if (totalSpent >= 500) tier = 'Silver';

    return {
      ...c,
      totalSpent,
      orderCount: custOrders.length,
      tier,
      lastOrder: custOrders[0]?.orderDate || 'No orders yet',
      recentOrders: custOrders.slice(0, 5),
    };
  });

  const filtered = liveData.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone || '').includes(search);
    const matchesTier = tierFilter === 'All' || c.tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <>
      <div className="page-header">
        <h2>Customer Insight & Loyalty</h2>
        <p>Analyze customer spending patterns, loyalty tiers, and order history.</p>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="search-bar" style={{ width: 400 }}>
            <Search size={18} />
            <input type="text" placeholder="Search by name or phone..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="tabs">
            {tiers.map(t => (
              <button key={t.tier} className={`tab ${tierFilter === t.tier ? 'active' : ''}`} onClick={() => setTierFilter(t.tier)}>
                <Star size={14} color={t.color} fill={tierFilter === t.tier ? t.color : 'transparent'} /> {t.tier}
              </button>
            ))}
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact</th>
                <th>Tier</th>
                <th>Total Spent</th>
                <th>Orders</th>
                <th>Last Order</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <>
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td>{c.phone}</td>
                    <td>
                      <span className="badge" style={{ background: `${tiers.find(t => t.tier === c.tier)?.color}15`, color: tiers.find(t => t.tier === c.tier)?.color }}>
                        <Star size={10} fill={tiers.find(t => t.tier === c.tier)?.color} /> {c.tier}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>₹{c.totalSpent.toLocaleString()}</td>
                    <td>{c.orderCount}</td>
                    <td style={{ fontSize: 12 }}>{c.lastOrder !== 'No orders yet' ? new Date(c.lastOrder).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <button className="btn btn-sm btn-secondary" onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}>
                        {expandedId === c.id ? <><ChevronUp size={14} /> Hide</> : <><ChevronDown size={14} /> View</>}
                      </button>
                    </td>
                  </tr>
                  {expandedId === c.id && (
                    <tr key={`${c.id}-details`}>
                      <td colSpan={7} style={{ padding: 0 }}>
                        <div style={{ padding: '16px 24px', background: 'var(--bg-primary)', borderTop: '1px solid var(--border-color)', borderBottom: '2px solid var(--accent-blue)' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                              <Mail size={14} color="var(--accent-blue)" />
                              <span>{c.email || 'N/A'}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                              <Phone size={14} color="var(--accent-green)" />
                              <span>{c.phone || 'N/A'}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                              <MapPin size={14} color="var(--accent-orange)" />
                              <span>{c.address ? `${c.address}, ${c.city || ''}` : 'N/A'}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                              <ShoppingBag size={14} color="var(--accent-purple, #8b5cf6)" />
                              <span>Joined: {c.joinDate ? new Date(c.joinDate).toLocaleDateString() : 'N/A'}</span>
                            </div>
                          </div>

                          {c.recentOrders.length > 0 ? (
                            <>
                              <h4 style={{ fontSize: 13, marginBottom: 8, color: 'var(--text-secondary)' }}>Recent Orders</h4>
                              <table className="data-table" style={{ fontSize: 12 }}>
                                <thead><tr><th>Order #</th><th>Date</th><th>Items</th><th>Amount</th><th>Status</th></tr></thead>
                                <tbody>
                                  {c.recentOrders.map(o => (
                                    <tr key={o.id}>
                                      <td>#{o.id}</td>
                                      <td>{new Date(o.orderDate).toLocaleDateString()}</td>
                                      <td>{o.items?.length || 0} items</td>
                                      <td style={{ fontWeight: 600 }}>₹{o.totalAmount.toLocaleString()}</td>
                                      <td><span className={`badge badge-${o.status.toLowerCase()}`}>{o.status}</span></td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </>
                          ) : (
                            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No orders yet for this customer.</div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
