import { useState, useEffect } from 'react';
import { Search, Phone, Mail, MapPin, ShoppingBag, Star, Gift, Clock, ChevronDown, ChevronUp, X } from 'lucide-react';

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

  const [dbCustomers, setDbCustomers] = useState<any[]>([]);
  const [dbOrders, setDbOrders] = useState<any[]>([]);

  useEffect(() => {
    import('../services/api').then(m => {
      m.fetchCustomers().then(setDbCustomers);
      m.fetchOrders().then(setDbOrders);
    });
  }, []);

  // Dynamically compute loyalty and stats
  const liveData = dbCustomers.map(c => {
    const orders = dbOrders.filter(o => o.customerId === c.id && o.status !== 'Cancelled');
    const totalSpent = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const pts = Math.floor(totalSpent / 10);
    
    let tier = 'Bronze';
    let tierColor = '#d97706';
    if (pts >= 2000) { tier = 'Platinum'; tierColor = '#8b5cf6'; }
    else if (pts >= 1000) { tier = 'Gold'; tierColor = '#f59e0b'; }
    else if (pts >= 500) { tier = 'Silver'; tierColor = '#94a3b8'; }

    return { ...c, totalOrders: orders.length, totalSpent, loyalty: { points: pts, tier, tierColor } };
  });

  // Filter customers
  const filtered = liveData
    .filter(c => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(search);
    })
    .filter(c => {
      if (tierFilter === 'All') return true;
      return c.loyalty.tier === tierFilter;
    });

  const getOrders = (id: number) => dbOrders.filter(o => o.customerId === id);

  return (
    <>
      <div className="page-header">
        <h2>Customer Lookup</h2>
        <p>Search customers and view full purchasing history.</p>
      </div>

      {/* Customer Search */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><h3>Customer Directory</h3></div>
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
            <Search size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search by name, email, or phone number..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ border: 'none', background: 'none', outline: 'none', width: '100%', fontSize: 14, padding: '4px 0', color: 'var(--text-primary)' }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, flexShrink: 0 }}>
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tier Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {tiers.map(t => {
          const isActive = tierFilter === t.tier;
          const count = t.tier === 'All' ? liveData.length
            : liveData.filter(c => c.loyalty.tier === t.tier).length;
          return (
            <button key={t.tier} onClick={() => setTierFilter(t.tier)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20,
              fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease',
              background: isActive ? t.color : `${t.color}10`,
              color: isActive ? 'white' : t.color,
              border: isActive ? `2px solid ${t.color}` : `2px solid ${t.color}30`,
            }}>
              {t.tier !== 'All' && <Star size={12} />}
              {t.tier} ({count})
              {t.min && <span style={{ opacity: 0.8, fontSize: 10 }}>· {t.min} pts</span>}
            </button>
          );
        })}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="card"><div className="card-body"><div className="empty-state">
          <Search size={48} /><h4>No customers found</h4>
          <p>{tierFilter !== 'All' ? `No ${tierFilter} tier customers match your search.` : 'Try a different search term.'}</p>
        </div></div></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Showing {filtered.length} customer{filtered.length !== 1 ? 's' : ''}
            {tierFilter !== 'All' && <span style={{ color: tiers.find(t => t.tier === tierFilter)?.color, fontWeight: 600 }}> · {tierFilter} tier</span>}
          </div>
          {filtered.map(customer => {
            const loyalty = customer.loyalty || { points: 0, tier: 'Bronze', tierColor: '#d97706' };
            const orders = getOrders(customer.id);
            const isExpanded = expandedId === customer.id;
            return (
              <div key={customer.id} className="card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16 }} onClick={() => setExpandedId(isExpanded ? null : customer.id)}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: `linear-gradient(135deg, ${loyalty.tierColor}40, ${loyalty.tierColor}20)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, color: loyalty.tierColor, flexShrink: 0 }}>
                    {customer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>{customer.name}</div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={11} /> {customer.email}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={11} /> {customer.phone}</span>
                    </div>
                  </div>
                  <div style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: `${loyalty.tierColor}15`, color: loyalty.tierColor, border: `1px solid ${loyalty.tierColor}25`, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Star size={11} /> {loyalty.tier} · {loyalty.points} pts
                  </div>
                  <div style={{ textAlign: 'right', minWidth: 90 }}>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>₹{customer.totalSpent.toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{customer.totalOrders} orders</div>
                  </div>
                  {isExpanded ? <ChevronUp size={18} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={18} style={{ color: 'var(--text-muted)' }} />}
                </div>
                {isExpanded && (
                  <div style={{ borderTop: '1px solid var(--border-light)', padding: 20, background: 'var(--bg-primary)', animation: 'slideUp 0.2s ease' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
                      <div style={{ padding: 14, background: 'var(--bg-white)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Address</div>
                        <div style={{ fontSize: 13, display: 'flex', alignItems: 'flex-start', gap: 6 }}><MapPin size={14} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }} />{customer.address}, {customer.city}, {customer.state} {customer.zipCode}</div>
                      </div>
                      <div style={{ padding: 14, background: 'var(--bg-white)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Member Since</div>
                        <div style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={14} style={{ color: 'var(--text-muted)' }} />{customer.joinDate}</div>
                      </div>
                      <div style={{ padding: 14, background: 'var(--bg-white)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Loyalty Rewards</div>
                        <div style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}><Gift size={14} style={{ color: loyalty.tierColor }} />{loyalty.points} points available</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)', marginBottom: 10 }}>
                      <ShoppingBag size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />Recent Orders ({orders.length})
                    </div>
                    {orders.length === 0 ? <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '12px 0' }}>No orders found.</div> : (
                      <table className="data-table"><thead><tr><th>Order ID</th><th>Date</th><th>Items</th><th>Amount</th><th>Status</th></tr></thead>
                        <tbody>{orders.map(o => (
                          <tr key={o.id}><td style={{ fontWeight: 600 }}>#{o.id}</td><td>{o.orderDate}</td><td>{o.items.length} items</td><td style={{ fontWeight: 600 }}>₹{o.totalAmount.toFixed(2)}</td>
                            <td><span className={`badge badge-${o.status.toLowerCase()}`}>{o.status}</span></td></tr>
                        ))}</tbody></table>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
