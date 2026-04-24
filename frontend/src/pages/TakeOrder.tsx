import { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart, User, Tag, CheckCircle, XCircle, Star, UserPlus, FileText } from 'lucide-react';
import { mockProducts, mockCustomers, mockOrders } from '../services/mockData';
import { findPromoByCode } from '../services/promoStore';
import { createCustomer, createOrder } from '../services/api';

interface Props {
  userRole: string;
  userName: string;
}

interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
}



export default function TakeOrder({ userRole, userName }: Props) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchProduct, setSearchProduct] = useState('');
  
  // Customer selection/creation
  const [searchCustomer, setSearchCustomer] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<typeof mockCustomers[0] | null>(null);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '' });
  
  // Standalone Checkers
  const [checkerCouponCode, setCheckerCouponCode] = useState('');
  const [checkerCouponResult, setCheckerCouponResult] = useState<{ valid: boolean; msg: string; discount?: string; dates?: string; uses?: string; desc?: string } | null>(null);
  
  const [loyaltyEmail, setLoyaltyEmail] = useState('');
  const [loyaltyResult, setLoyaltyResult] = useState<{ found: boolean; msg: string; data?: any } | null>(null);

  // Cart Coupon
  const [couponCode, setCouponCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<ReturnType<typeof findPromoByCode> | null>(null);
  const [couponError, setCouponError] = useState('');
  const [appliedLoyaltyPoints, setAppliedLoyaltyPoints] = useState(0);

  // Invoice
  const [orderComplete, setOrderComplete] = useState(false);
  const [lastInvoice, setLastInvoice] = useState('');

  const [dbProducts, setDbProducts] = useState<typeof mockProducts>([]);
  const [dbCustomers, setDbCustomers] = useState<typeof mockCustomers>([]);
  const [dbOrders, setDbOrders] = useState<typeof mockOrders>([]);
  
  useEffect(() => {
    import('../services/api').then(m => {
      m.fetchProducts().then(setDbProducts);
      m.fetchCustomers().then(setDbCustomers);
      m.fetchOrders().then(setDbOrders);
    });
  }, []);

  // Filter products
  const filteredProducts = useMemo(() => {
    const prods = dbProducts.length > 0 ? dbProducts : mockProducts;
    if (!searchProduct.trim()) return prods;
    return prods.filter(p => p.name.toLowerCase().includes(searchProduct.toLowerCase()) || p.category.toLowerCase().includes(searchProduct.toLowerCase()));
  }, [searchProduct, dbProducts]);

  // Filter customers
  const filteredCustomers = useMemo(() => {
    const custs = dbCustomers.length > 0 ? dbCustomers : mockCustomers;
    if (!searchCustomer.trim() || selectedCustomer || isNewCustomer) return [];
    return custs.filter(c => c.name.toLowerCase().includes(searchCustomer.toLowerCase()) || c.phone.includes(searchCustomer));
  }, [searchCustomer, selectedCustomer, isNewCustomer, dbCustomers]);

  // Actions
  const addToCart = (product: typeof mockProducts[0]) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) return prev.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQ = item.quantity + delta;
        return { ...item, quantity: newQ > 0 ? newQ : 1 };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  // Cart Coupon Logic
  const applyCartCoupon = () => {
    setCouponError('');
    if (!couponCode.trim()) return;
    const promo = findPromoByCode(couponCode);
    if (!promo) { setCouponError('Invalid coupon code'); return; }
    if (!promo.enabled) { setCouponError('Coupon disabled'); return; }
    const now = new Date().toISOString().split('T')[0];
    if (promo.endDate < now) { setCouponError('Coupon expired'); return; }
    if (promo.startDate > now) { setCouponError('Coupon not yet active'); return; }
    if (promo.usedCount >= promo.maxUses) { setCouponError('Coupon fully redeemed'); return; }
    setAppliedPromo(promo);
  };

  const removeCartCoupon = () => {
    setAppliedPromo(null);
    setCouponCode('');
    setCouponError('');
  };

  // Standalone Checkers Logic
  const checkStandaloneCoupon = () => {
    const code = checkerCouponCode.trim().toUpperCase();
    if (!code) { setCheckerCouponResult({ valid: false, msg: 'Please enter a coupon code.' }); return; }
    const promo = findPromoByCode(code);
    if (!promo) { setCheckerCouponResult({ valid: false, msg: `Coupon "${code}" not found.` }); return; }
    const now = new Date().toISOString().split('T')[0];
    if (promo.endDate < now) { setCheckerCouponResult({ valid: false, msg: `Coupon "${code}" has expired.` }); return; }
    if (promo.startDate > now) { setCheckerCouponResult({ valid: false, msg: `Coupon "${code}" starts on ${promo.startDate}.` }); return; }
    if (promo.usedCount >= promo.maxUses) { setCheckerCouponResult({ valid: false, msg: `Coupon "${code}" fully redeemed.` }); return; }
    if (!promo.enabled) { setCheckerCouponResult({ valid: false, msg: `Coupon "${code}" disabled.` }); return; }
    setCheckerCouponResult({
      valid: true,
      msg: `✓ Coupon "${code}" is valid!`,
      discount: promo.type === 'percentage' ? `${promo.value}% off` : `₹${promo.value} flat off`,
      dates: `${promo.startDate} → ${promo.endDate}`,
      uses: `${promo.usedCount} / ${promo.maxUses} used`,
      desc: promo.description,
    });
  };

  const checkLoyalty = () => {
    const email = loyaltyEmail.trim().toLowerCase();
    if (!email) { setLoyaltyResult({ found: false, msg: 'Please enter an email address.' }); return; }
    
    const custs = dbCustomers.length > 0 ? dbCustomers : mockCustomers;
    let foundCust = custs.find(c => c.email.toLowerCase() === email);
    if (!foundCust) { setLoyaltyResult({ found: false, msg: `No customer found.` }); return; }
    
    // Dynamically calculate points
    const orders = dbOrders.filter(o => o.customerId === foundCust!.id && o.status !== 'Cancelled');
    const totalSpent = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const pts = Math.floor(totalSpent / 10);
    let tier = 'Bronze', tierColor = '#d97706';
    if (pts >= 2000) { tier = 'Platinum'; tierColor = '#8b5cf6'; }
    else if (pts >= 1000) { tier = 'Gold'; tierColor = '#f59e0b'; }
    else if (pts >= 500) { tier = 'Silver'; tierColor = '#94a3b8'; }

    setLoyaltyResult({ found: true, msg: `Found: ${foundCust.name}`, data: { name: foundCust.name, points: pts, tier, tierColor } });
  };

  // Totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  let discount = 0;
  if (appliedPromo) {
    discount += appliedPromo.type === 'percentage' ? subtotal * (appliedPromo.value / 100) : appliedPromo.value;
  }
  if (appliedLoyaltyPoints > 0) {
    discount += appliedLoyaltyPoints / 10; // 10 points = 1 rupee discount
  }
  const tax = (subtotal - discount) * 0.18; // 18% tax
  const total = subtotal - discount + tax;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    let finalCustomer = selectedCustomer;
    if (isNewCustomer && newCustomer.name) {
      const createdCust = await createCustomer({
        name: newCustomer.name,
        phone: newCustomer.phone,
        email: newCustomer.email,
        address: '', city: '', state: '', zipCode: '', joinDate: new Date().toISOString().split('T')[0], totalOrders: 0, totalSpent: 0
      });
      finalCustomer = createdCust as any;
    }

    const invNo = `INV-${Math.floor(100000 + Math.random() * 900000)}`;

    const newOrder = {
      customerId: finalCustomer ? finalCustomer.id : 0,
      customerName: finalCustomer ? finalCustomer.name : 'Unknown',
      orderDate: new Date().toISOString().split('T')[0],
      totalAmount: total,
      status: 'Delivered' as const,
      invoiceNumber: invNo,
      items: cart.map(item => ({
        id: Math.random(),
        productId: item.productId,
        productName: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: item.price * item.quantity
      }))
    };
    
    if (appliedPromo) appliedPromo.usedCount += 1;

    await createOrder(newOrder);
    setLastInvoice(invNo);
    setOrderComplete(true);
  };

  const resetOrder = () => {
    setCart([]);
    setSelectedCustomer(null);
    setIsNewCustomer(false);
    setNewCustomer({ name: '', phone: '', email: '' });
    setSearchCustomer('');
    setCouponCode('');
    setAppliedPromo(null);
    setAppliedLoyaltyPoints(0);
    setOrderComplete(false);
  };

  if (orderComplete) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '70vh' }}>
        <CheckCircle size={64} style={{ color: 'var(--accent-green)', marginBottom: 24 }} />
        <h2>Order Completed Successfully!</h2>
        <div style={{ padding: '16px 24px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-light)', margin: '20px 0', textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Invoice Number</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-blue)' }}>{lastInvoice}</div>
        </div>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Amount paid: ₹{total.toFixed(2)}</p>
        <button className="btn btn-primary" onClick={resetOrder}>Take Another Order</button>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <h2>Take Order</h2>
        <p>Process walk-in orders, verify coupons, and generate invoices.</p>
      </div>

      {/* Checkers Section (Moved from Customer Lookup) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div className="card">
          <div className="card-header"><h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}><Tag size={14} style={{ color: 'var(--accent-purple)' }} /> Quick Coupon Check</h3></div>
          <div className="card-body" style={{ padding: '12px 16px' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="form-input" placeholder="e.g. WELCOME10" value={checkerCouponCode}
                onChange={e => { setCheckerCouponCode(e.target.value.toUpperCase()); setCheckerCouponResult(null); }}
                style={{ fontFamily: 'monospace', letterSpacing: 1, flex: 1 }} />
              <button className="btn btn-secondary" onClick={checkStandaloneCoupon}>Check</button>
            </div>
            {checkerCouponResult && (
              <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: checkerCouponResult.valid ? 'var(--accent-green-light)' : 'var(--accent-red-light)', color: checkerCouponResult.valid ? 'var(--accent-green)' : 'var(--accent-red)', fontSize: 12, fontWeight: 500 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {checkerCouponResult.valid ? <CheckCircle size={14} /> : <XCircle size={14} />} {checkerCouponResult.msg}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}><Star size={14} style={{ color: '#f59e0b' }} /> Loyalty Check</h3></div>
          <div className="card-body" style={{ padding: '12px 16px' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="form-input" placeholder="Customer email..." value={loyaltyEmail}
                onChange={e => { setLoyaltyEmail(e.target.value); setLoyaltyResult(null); }}
                style={{ flex: 1 }} />
              <button className="btn btn-secondary" onClick={checkLoyalty}>Check</button>
            </div>
            {loyaltyResult && (
              <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: loyaltyResult.found ? 'var(--accent-green-light)' : 'var(--accent-red-light)', color: loyaltyResult.found ? 'var(--accent-green)' : 'var(--accent-red)', fontSize: 12, fontWeight: 500 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {loyaltyResult.found ? <CheckCircle size={14} /> : <XCircle size={14} />} {loyaltyResult.msg}
                  {loyaltyResult.data && <span style={{ marginLeft: 'auto', background: 'rgba(0,0,0,0.1)', padding: '2px 6px', borderRadius: 10 }}>{loyaltyResult.data.points} pts</span>}
                </div>
                {loyaltyResult.data && loyaltyResult.data.points > 0 && cart.length > 0 && (
                  appliedLoyaltyPoints > 0 ? (
                    <button className="btn btn-secondary btn-sm" style={{ marginTop: 8, width: '100%', color: 'var(--accent-red)' }} onClick={() => setAppliedLoyaltyPoints(0)}>
                      Remove Points Discount
                    </button>
                  ) : (
                    <button className="btn btn-primary btn-sm" style={{ marginTop: 8, width: '100%' }} onClick={() => setAppliedLoyaltyPoints(loyaltyResult.data.points)}>
                      Apply Points for ₹{Math.floor(loyaltyResult.data.points / 10)} Discount
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Left Side: Products & Customer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Mandatory Customer Selection */}
          <div className="card" style={{ border: (!selectedCustomer && !isNewCustomer) ? '1px solid var(--accent-red)' : '' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ color: (!selectedCustomer && !isNewCustomer) ? 'var(--accent-red)' : '' }}><User size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }}/>Customer Selection (Required)</h3>
              {!selectedCustomer && !isNewCustomer && (
                <button className="btn btn-sm btn-secondary" onClick={() => setIsNewCustomer(true)}><UserPlus size={14} /> Create New</button>
              )}
            </div>
            <div className="card-body">
              {selectedCustomer ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{selectedCustomer.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{selectedCustomer.phone} | {selectedCustomer.email}</div>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={() => setSelectedCustomer(null)}>Change</button>
                </div>
              ) : isNewCustomer ? (
                <div style={{ background: 'var(--bg-primary)', padding: 16, borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <h4 style={{ margin: 0 }}>New Customer Details</h4>
                    <button className="btn btn-sm btn-secondary" onClick={() => setIsNewCustomer(false)}>Cancel</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <input className="form-input" placeholder="Full Name *" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} />
                    <input className="form-input" placeholder="Phone Number" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} />
                    <input className="form-input" placeholder="Email Address" style={{ gridColumn: 'span 2' }} value={newCustomer.email} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} />
                  </div>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <div className="search-box" style={{ width: '100%' }}>
                    <Search size={16} />
                    <input 
                      type="text" 
                      placeholder="Search existing customer by name or phone..." 
                      value={searchCustomer}
                      onChange={e => setSearchCustomer(e.target.value)}
                    />
                  </div>
                  {filteredCustomers.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-white)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', zIndex: 10, maxHeight: 200, overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                      {filteredCustomers.map(c => (
                        <div key={c.id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-light)', cursor: 'pointer' }} onClick={() => { setSelectedCustomer(c); setSearchCustomer(''); }}>
                          <div style={{ fontWeight: 500 }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.phone}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Product Catalog */}
          <div className="card" style={{ flex: 1 }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Catalog</h3>
              <div className="search-box" style={{ width: 250 }}>
                <Search size={16} />
                <input 
                  type="text" 
                  placeholder="Search products..." 
                  value={searchProduct}
                  onChange={e => setSearchProduct(e.target.value)}
                />
              </div>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                {filteredProducts.map(p => (
                  <div key={p.id} style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', padding: 12, cursor: 'pointer', transition: 'border-color 0.2s' }} onClick={() => addToCart(p)}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{p.category}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>₹{p.price.toFixed(2)}</span>
                      <span style={{ fontSize: 11, padding: '2px 6px', background: p.stock > 10 ? 'var(--accent-green-light)' : 'var(--accent-red-light)', color: p.stock > 10 ? 'var(--accent-green)' : 'var(--accent-red)', borderRadius: 10 }}>Stock: {p.stock}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Cart Summary */}
        <div className="card" style={{ height: 'fit-content', position: 'sticky', top: 24 }}>
          <div className="card-header">
            <h3><ShoppingCart size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }}/>Current Order</h3>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Cart Items */}
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                  Cart is empty. Select products to add.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {cart.map(item => (
                    <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid var(--border-light)' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, fontSize: 14 }}>{item.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>₹{item.price.toFixed(2)} x {item.quantity} = ₹{(item.price * item.quantity).toFixed(2)}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button className="btn-icon" onClick={() => updateQuantity(item.productId, -1)}><Minus size={14}/></button>
                        <span style={{ fontWeight: 600, width: 20, textAlign: 'center' }}>{item.quantity}</span>
                        <button className="btn-icon" onClick={() => updateQuantity(item.productId, 1)}><Plus size={14}/></button>
                        <button className="btn-icon" style={{ color: 'var(--accent-red)' }} onClick={() => removeFromCart(item.productId)}><Trash2 size={14}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Coupon Code */}
            {cart.length > 0 && (
              <div style={{ marginTop: 10 }}>
                {appliedPromo ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--accent-green-light)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--accent-green)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent-green)', fontSize: 13, fontWeight: 600 }}>
                      <Tag size={14} /> {appliedPromo.code} Applied
                    </div>
                    <button className="btn-icon" onClick={removeCartCoupon} style={{ color: 'var(--accent-green)' }}><XCircle size={14}/></button>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Discount Code" 
                        value={couponCode}
                        onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                        style={{ flex: 1, textTransform: 'uppercase' }}
                      />
                      <button className="btn btn-secondary" onClick={applyCartCoupon}>Apply</button>
                    </div>
                    {couponError && <div style={{ color: 'var(--accent-red)', fontSize: 11, marginTop: 4 }}>{couponError}</div>}
                  </div>
                )}
              </div>
            )}

            {/* Totals */}
            {cart.length > 0 && (
              <div style={{ background: 'var(--bg-primary)', padding: 16, borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && appliedPromo && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, color: 'var(--accent-green)' }}>
                    <span>Discount</span>
                    <span>-₹{(appliedPromo.type === 'percentage' ? subtotal * (appliedPromo.value / 100) : appliedPromo.value).toFixed(2)}</span>
                  </div>
                )}
                {appliedLoyaltyPoints > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, color: 'var(--accent-purple)' }}>
                    <span>Loyalty Points ({appliedLoyaltyPoints})</span>
                    <span>-₹{(appliedLoyaltyPoints / 10).toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Tax (18%)</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px dashed var(--border-light)', fontWeight: 700, fontSize: 16 }}>
                  <span>Total</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </div>
            )}

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '12px', fontSize: 16, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
              disabled={cart.length === 0 || (!selectedCustomer && !(isNewCustomer && newCustomer.name))}
              title={(!selectedCustomer && !(isNewCustomer && newCustomer.name)) ? "Please select or create a customer" : ""}
              onClick={handleCheckout}
            >
              <FileText size={18} />
              Generate Invoice (₹{total.toFixed(2)})
            </button>
            <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)' }}>
              Processed by: {userName}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
