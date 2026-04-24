import { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart, User, Tag, CheckCircle, XCircle, Star, UserPlus, FileText, X } from 'lucide-react';
import { fetchProducts, fetchCustomers, createOrder, createCustomer, findPromoByCode } from '../services/api';
import type { Product, Customer } from '../types';

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

export default function TakeOrder({ userName }: Props) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchProduct, setSearchProduct] = useState('');
  const [searchCustomer, setSearchCustomer] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  const [couponCode, setCouponCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any | null>(null);
  const [orderComplete, setOrderComplete] = useState(false);

  useEffect(() => {
    fetchProducts().then(setProducts);
    fetchCustomers().then(setCustomers);
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchProduct.toLowerCase())
  );

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchCustomer.toLowerCase()) ||
    c.phone.includes(searchCustomer)
  );

  const addToCart = (p: Product) => {
    const existing = cart.find(item => item.productId === p.id);
    if (existing) {
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
  const discount = appliedPromo ? (appliedPromo.type === 'Percentage' ? (subtotal * appliedPromo.discountValue / 100) : appliedPromo.discountValue) : 0;
  const total = Math.max(0, subtotal - discount);

  const handleCheckout = () => {
    if (!cart.length || !selectedCustomer) return;

    const orderData = {
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      items: cart.map(item => ({
        productId: item.productId,
        productName: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: item.price * item.quantity
      })),
      totalAmount: total,
      status: 'Completed',
      paymentMethod: 'Cash',
      orderDate: new Date().toISOString()
    };

    createOrder(orderData).then(() => {
      setOrderComplete(true);
      setCart([]);
      setSelectedCustomer(null);
    });
  };

  const handleApplyCoupon = () => {
    findPromoByCode(couponCode).then(promo => {
      if (promo) setAppliedPromo(promo);
    });
  };

  return (
    <div className="take-order-container" style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 24, height: 'calc(100vh - 140px)' }}>
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
              <div key={p.id} className="product-item-card" onClick={() => addToCart(p)} style={{ 
                border: '1px solid var(--border-color)', borderRadius: 12, padding: 12, cursor: 'pointer', transition: 'all 0.2s'
              }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>{p.category}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>₹{p.price}</span>
                  <span style={{ fontSize: 11, color: p.stockQuantity < 10 ? 'var(--accent-red)' : 'var(--text-muted)' }}>Stock: {p.stockQuantity}</span>
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
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{selectedCustomer.phone}</div>
                </div>
                <button className="btn btn-icon" onClick={() => setSelectedCustomer(null)}><X size={16} /></button>
              </div>
            ) : (
              <div className="search-bar">
                <User size={16} />
                <input type="text" placeholder="Select customer..." value={searchCustomer} onChange={e => setSearchCustomer(e.target.value)} />
                {searchCustomer && (
                  <div className="dropdown" style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid var(--border-color)', borderRadius: 8, zIndex: 10, maxHeight: 200, overflowY: 'auto' }}>
                    {filteredCustomers.map(c => (
                      <div key={c.id} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }} onClick={() => { setSelectedCustomer(c); setSearchCustomer(''); }}>
                        {c.name} ({c.phone})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cart Items */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            {cart.map(item => (
              <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>₹{item.price} x {item.quantity}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button className="btn btn-icon btn-sm" onClick={() => updateQty(item.productId, -1)}><Minus size={14} /></button>
                  <span style={{ width: 20, textAlign: 'center', fontWeight: 600 }}>{item.quantity}</span>
                  <button className="btn btn-icon btn-sm" onClick={() => updateQty(item.productId, 1)}><Plus size={14} /></button>
                  <button className="btn btn-icon btn-sm text-danger" onClick={() => removeFromCart(item.productId)} style={{ marginLeft: 8 }}><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
            {cart.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 40 }}>Cart is empty</div>}
          </div>

          {/* Totals */}
          <div style={{ padding: 16, background: 'var(--bg-primary)', borderTop: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString()}</span>
            </div>
            {appliedPromo && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14, color: 'var(--accent-green)' }}>
                <span>Discount ({appliedPromo.code})</span>
                <span>-₹{discount.toLocaleString()}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontWeight: 700, fontSize: 18 }}>
              <span>Total</span>
              <span>₹{total.toLocaleString()}</span>
            </div>
            
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input type="text" placeholder="Coupon code" className="form-input" style={{ flex: 1 }} value={couponCode} onChange={e => setCouponCode(e.target.value)} />
              <button className="btn btn-secondary" onClick={handleApplyCoupon}>Apply</button>
            </div>

            <button className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: 16 }} disabled={!cart.length || !selectedCustomer} onClick={handleCheckout}>
              Complete Order
            </button>
          </div>
        </div>
      </div>

      {orderComplete && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 400, textAlign: 'center' }}>
            <div style={{ color: 'var(--accent-green)', marginBottom: 16 }}><CheckCircle size={64} /></div>
            <h2>Order Successful!</h2>
            <p>The order has been processed and saved to the database.</p>
            <button className="btn btn-primary" style={{ marginTop: 24, width: '100%' }} onClick={() => setOrderComplete(false)}>New Order</button>
          </div>
        </div>
      )}
    </div>
  );
}
