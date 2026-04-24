import { useState, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, User, CheckCircle, X, Tag, Star, UserPlus } from 'lucide-react';
import { fetchProducts, fetchCustomers, createOrder, createCustomer, findPromoByCode, logAction } from '../services/api';
import type { Product, Customer } from '../types';

interface Props { userRole: string; userName: string; }
interface CartItem { productId: number; name: string; price: number; quantity: number; }

export default function TakeOrder({ userName }: Props) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchProduct, setSearchProduct] = useState('');
  const [searchCustomer, setSearchCustomer] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any | null>(null);
  const [couponMsg, setCouponMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [useLoyalty, setUseLoyalty] = useState(false);
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchProducts().then(setProducts);
    fetchCustomers().then(setCustomers);
  }, []);

  // Simulate loyalty points based on customer's totalSpent
  useEffect(() => {
    if (selectedCustomer) {
      const pts = Math.floor((selectedCustomer.totalSpent || 0) / 10);
      setLoyaltyPoints(pts);
      setUseLoyalty(false);
      setLoyaltyDiscount(0);
    } else {
      setLoyaltyPoints(0);
      setUseLoyalty(false);
      setLoyaltyDiscount(0);
    }
  }, [selectedCustomer]);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
    (p.sku || '').toLowerCase().includes(searchProduct.toLowerCase())
  );

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchCustomer.toLowerCase()) ||
    (c.phone || '').includes(searchCustomer)
  );

  const addToCart = (p: Product) => {
    if (p.stockQuantity <= 0) return;
    const existing = cart.find(item => item.productId === p.id);
    if (existing) {
      if (existing.quantity >= p.stockQuantity) return;
      setCart(cart.map(item => item.productId === p.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { productId: p.id, name: p.name, price: p.price, quantity: 1 }]);
    }
  };

  const updateQty = (id: number, delta: number) => {
    setCart(cart.map(item => {
      if (item.productId === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: number) => setCart(cart.filter(item => item.productId !== id));

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const promoDiscount = appliedPromo
    ? (appliedPromo.type === 'Percentage' ? (subtotal * appliedPromo.discountValue / 100) : appliedPromo.discountValue)
    : 0;
  const totalDiscount = promoDiscount + loyaltyDiscount;
  const total = Math.max(0, subtotal - totalDiscount);

  const handleApplyCoupon = async () => {
    setCouponMsg(null);
    if (!couponCode.trim()) { setCouponMsg({ type: 'error', text: 'Enter a coupon code' }); return; }
    const promo = await findPromoByCode(couponCode);
    if (promo) {
      setAppliedPromo(promo);
      setCouponMsg({ type: 'success', text: `Coupon "${promo.code}" applied! ${promo.type === 'Percentage' ? promo.discountValue + '% off' : '₹' + promo.discountValue + ' off'}` });
    } else {
      setAppliedPromo(null);
      setCouponMsg({ type: 'error', text: 'Invalid or expired coupon code' });
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedPromo(null);
    setCouponCode('');
    setCouponMsg(null);
  };

  const toggleLoyalty = () => {
    if (!useLoyalty && loyaltyPoints > 0) {
      const maxRedeem = Math.min(loyaltyPoints, Math.floor(subtotal * 0.2));
      setLoyaltyDiscount(maxRedeem);
      setUseLoyalty(true);
    } else {
      setLoyaltyDiscount(0);
      setUseLoyalty(false);
    }
  };

  const handleAddNewCustomer = async () => {
    if (!newCustName.trim() || !newCustEmail.trim() || !newCustPhone.trim()) return;
    try {
      const c = await createCustomer({ name: newCustName.trim(), email: newCustEmail.trim(), phone: newCustPhone.trim() });
      if (c && c.id) {
        setCustomers(prev => [...prev, c]);
        setSelectedCustomer(c);
        setCustomerName(c.name);
        setShowNewCustomer(false);
        setNewCustName(''); setNewCustEmail(''); setNewCustPhone('');
        setOrderError('');
      } else {
        setOrderError('Failed to create customer — invalid response');
      }
    } catch (err: any) { setOrderError(err?.message || 'Failed to create customer'); }
  };

  const handleCheckout = async () => {
    setOrderError('');
    if (!cart.length) { setOrderError('Add items to cart'); return; }
    if (!selectedCustomer && !customerName.trim()) { setOrderError('Select or enter a customer name'); return; }

    setProcessing(true);
    const orderData = {
      customerId: selectedCustomer?.id || 0,
      customerName: selectedCustomer?.name || customerName.trim(),
      items: cart.map(item => ({
        productId: item.productId,
        productName: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: item.price * item.quantity
      })),
      totalAmount: total,
      status: 'Completed',
      paymentMethod,
      orderDate: new Date().toISOString(),
      processedBy: userName,
    };

    try {
      await createOrder(orderData);
      logAction({ user: userName, action: 'Completed order', target: `Customer: ${customerName}, Total: ₹${total}`, severity: 'info', iconStr: 'Plus' });
      setOrderComplete(true);
      setCart([]);
      setSelectedCustomer(null);
      setCustomerName('');
      setAppliedPromo(null);
      setCouponCode('');
      setCouponMsg(null);
      setUseLoyalty(false);
      setLoyaltyDiscount(0);
    } catch (err: any) {
      setOrderError(err?.message || 'Failed to complete order. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="pos-layout">
      {/* Product Selection */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="card-header">
          <div className="search-bar" style={{ width: '100%' }}>
            <Search size={18} />
            <input type="text" placeholder="Search products by name or SKU..." value={searchProduct} onChange={e => setSearchProduct(e.target.value)} />
          </div>
        </div>
        <div className="card-body" style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
            {filteredProducts.map(p => (
              <div key={p.id} onClick={() => addToCart(p)} style={{
                border: `1px solid ${p.stockQuantity <= 0 ? 'var(--accent-red)' : 'var(--border-color)'}`, borderRadius: 12, padding: 12, cursor: p.stockQuantity > 0 ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s', opacity: p.stockQuantity <= 0 ? 0.65 : 1, position: 'relative',
              }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>{p.category}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: p.stockQuantity < 10 ? 'var(--accent-red)' : 'var(--text-muted)' }}>
                    {p.stockQuantity <= 0 ? 'Out of Stock' : `Stock: ${p.stockQuantity}`}
                  </span>
                  <span style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>₹{p.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cart & Checkout */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="card-header"><h3>Current Order</h3></div>
        <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0 }}>

          {/* Customer Selection */}
          <div style={{ padding: 16, borderBottom: '1px solid var(--border-color)' }}>
            {selectedCustomer ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)', padding: '8px 12px', borderRadius: 8 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{selectedCustomer.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{selectedCustomer.phone} • {selectedCustomer.email}</div>
                </div>
                <button className="btn btn-icon" onClick={() => { setSelectedCustomer(null); setCustomerName(''); }}><X size={16} /></button>
              </div>
            ) : (
              <>
                <div style={{ position: 'relative', zIndex: 50 }}>
                  <div className="search-bar">
                    <User size={16} />
                    <input type="text" placeholder="Search existing customer..." value={searchCustomer} onChange={e => setSearchCustomer(e.target.value)} />
                  </div>
                  {searchCustomer && filteredCustomers.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: '#fff',
                      border: '1px solid var(--border-color)',
                      borderTop: 'none',
                      borderRadius: '0 0 8px 8px',
                      zIndex: 100,
                      maxHeight: 180,
                      overflowY: 'auto',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    }}>
                      {filteredCustomers.map(c => (
                        <div key={c.id}
                          style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', fontSize: 13, transition: 'background 0.1s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.06)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          onClick={() => { setSelectedCustomer(c); setCustomerName(c.name); setSearchCustomer(''); }}>
                          <strong>{c.name}</strong> <span style={{ color: 'var(--text-muted)' }}>({c.phone})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)', position: 'relative', zIndex: 1 }}>Or enter name manually:</div>
                <input className="form-input" type="text" placeholder="Customer name *" value={customerName} onChange={e => setCustomerName(e.target.value)} style={{ marginTop: 4, fontSize: 13, position: 'relative', zIndex: 1 }} />
                <button className="btn btn-sm btn-secondary" style={{ marginTop: 8, fontSize: 11, gap: 4, position: 'relative', zIndex: 1 }} onClick={() => setShowNewCustomer(true)}>
                  <UserPlus size={12} /> Add New Customer
                </button>
              </>
            )}
          </div>

          {/* Loyalty Points */}
          {selectedCustomer && loyaltyPoints > 0 && (
            <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-color)', background: useLoyalty ? 'var(--accent-green-light)' : 'var(--bg-primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Star size={16} style={{ color: '#f59e0b' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>Loyalty Points: {loyaltyPoints}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Max redeem: ₹{Math.min(loyaltyPoints, Math.floor(subtotal * 0.2))} (20% of subtotal)</div>
                  </div>
                </div>
                <button className={`btn btn-sm ${useLoyalty ? 'btn-success' : 'btn-secondary'}`} onClick={toggleLoyalty} style={{ fontSize: 11 }}>
                  {useLoyalty ? '✓ Applied' : 'Apply'}
                </button>
              </div>
            </div>
          )}

          {/* Cart Items */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            {cart.map(item => (
              <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>₹{item.price} × {item.quantity} = ₹{(item.price * item.quantity).toLocaleString()}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button className="btn btn-icon btn-sm" onClick={() => updateQty(item.productId, -1)}><Minus size={14} /></button>
                  <span style={{ width: 24, textAlign: 'center', fontWeight: 600 }}>{item.quantity}</span>
                  <button className="btn btn-icon btn-sm" onClick={() => updateQty(item.productId, 1)}><Plus size={14} /></button>
                  <button className="btn btn-icon btn-sm" onClick={() => removeFromCart(item.productId)} style={{ marginLeft: 4, color: 'var(--accent-red)' }}><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
            {cart.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 40 }}>Cart is empty — click products to add</div>}
          </div>

          {/* Coupon + Totals + Checkout */}
          <div style={{ padding: 16, background: 'var(--bg-primary)', borderTop: '1px solid var(--border-color)' }}>
            {/* Coupon Section */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                <Tag size={12} /> Coupon Code
              </div>
              {appliedPromo ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--accent-green-light)', borderRadius: 8, fontSize: 12 }}>
                  <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>✓ {appliedPromo.code} applied</span>
                  <button className="btn btn-icon btn-sm" onClick={handleRemoveCoupon} style={{ color: 'var(--accent-red)' }}><X size={14} /></button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="text" placeholder="Enter coupon code" className="form-input" style={{ flex: 1, fontSize: 12 }} value={couponCode}
                    onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponMsg(null); }}
                    onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()} />
                  <button className="btn btn-secondary" onClick={handleApplyCoupon} style={{ fontSize: 12, whiteSpace: 'nowrap' }}>Check & Apply</button>
                </div>
              )}
              {couponMsg && (
                <div style={{ marginTop: 4, fontSize: 11, color: couponMsg.type === 'success' ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 500 }}>
                  {couponMsg.text}
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Payment Method</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {['Cash', 'Card', 'UPI'].map(m => (
                  <button key={m} className={`btn btn-sm ${paymentMethod === m ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setPaymentMethod(m)} style={{ flex: 1, fontSize: 12 }}>{m}</button>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
              <span>Subtotal ({cart.reduce((a, i) => a + i.quantity, 0)} items)</span>
              <span>₹{subtotal.toLocaleString()}</span>
            </div>
            {promoDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13, color: 'var(--accent-green)' }}>
                <span>Coupon ({appliedPromo.code})</span><span>−₹{promoDiscount.toLocaleString()}</span>
              </div>
            )}
            {useLoyalty && loyaltyDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13, color: '#f59e0b' }}>
                <span>Loyalty Points</span><span>−₹{loyaltyDiscount.toLocaleString()}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontWeight: 700, fontSize: 18, paddingTop: 8, borderTop: '1px solid var(--border-color)' }}>
              <span>Total</span><span>₹{total.toLocaleString()}</span>
            </div>

            {orderError && (
              <div style={{ padding: '8px 12px', marginBottom: 8, background: 'var(--accent-red-light)', color: 'var(--accent-red)', borderRadius: 8, fontSize: 12, fontWeight: 500 }}>
                ⚠ {orderError}
              </div>
            )}

            <button className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: 15, justifyContent: 'center' }}
              disabled={!cart.length || (!selectedCustomer && !customerName.trim()) || processing}
              onClick={handleCheckout}>
              {processing ? 'Processing...' : `Complete Order — ₹${total.toLocaleString()}`}
            </button>
          </div>
        </div>
      </div>

      {/* Order Success Modal */}
      {orderComplete && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 400, textAlign: 'center' }}>
            <div style={{ color: 'var(--accent-green)', marginBottom: 16 }}><CheckCircle size={64} /></div>
            <h2>Order Successful!</h2>
            <p>The order has been processed and saved.</p>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>Payment: {paymentMethod}</div>
            <button className="btn btn-primary" style={{ marginTop: 24, width: '100%' }} onClick={() => setOrderComplete(false)}>New Order</button>
          </div>
        </div>
      )}

      {/* Add New Customer Modal */}
      {showNewCustomer && (
        <div className="modal-overlay" onClick={() => setShowNewCustomer(false)}>
          <div className="modal-content" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><UserPlus size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Add New Customer</h3>
              <button className="close-btn" onClick={() => setShowNewCustomer(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" placeholder="Customer name" value={newCustName} onChange={e => setNewCustName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input className="form-input" type="email" placeholder="email@example.com" value={newCustEmail} onChange={e => setNewCustEmail(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone *</label>
                <input className="form-input" placeholder="Phone number" value={newCustPhone} onChange={e => setNewCustPhone(e.target.value)} />
              </div>
              <button className="btn btn-primary" style={{ width: '100%', marginTop: 8, justifyContent: 'center' }}
                disabled={!newCustName.trim() || !newCustEmail.trim() || !newCustPhone.trim()}
                onClick={handleAddNewCustomer}>
                Save & Select Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
