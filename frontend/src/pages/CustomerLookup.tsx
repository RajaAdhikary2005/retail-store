import { useState, useEffect } from 'react';
import { Search, Phone, Mail, MapPin, ShoppingBag, Star, Clock, ChevronDown, ChevronUp } from 'lucide-react';
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
      lastOrder: custOrders[0]?.orderDate || 'No orders yet'
    };
  });

  const filtered = liveData.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search);
    const matchesTier = tierFilter === 'All' || c.tier === tierFilter;
    return matchesSearch && matchesTier;
  });

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
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td>{c.phone}</td>
                  <td>
                    <span className="badge" style={{ background: `${tiers.find(t => t.tier === c.tier)?.color}15`, color: tiers.find(t => t.tier === c.tier)?.color }}>
                      {c.tier}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700 }}>₹{c.totalSpent.toLocaleString()}</td>
                  <td>{c.orderCount}</td>
                  <td style={{ fontSize: 12 }}>{c.lastOrder !== 'No orders yet' ? new Date(c.lastOrder).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    <button className="btn btn-icon" onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}>
                      {expandedId === c.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
