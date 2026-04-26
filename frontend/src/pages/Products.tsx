import { useEffect, useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, Download, Upload, X, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { fetchProducts, deleteProduct, exportToCSV, createProduct, updateProduct } from '../services/api';
import BulkUpload from '../components/BulkUpload';
import type { Product } from '../types';
import { type UserRole, canEditModule, canDeleteInModule, ROLES } from '../services/auth';

export default function Products({ globalSearch = '', userRole = 'admin' as UserRole }: { globalSearch?: string; userRole?: UserRole }) {
  const canEdit = canEditModule(userRole, 'products');
  const canDelete = canDeleteInModule(userRole, 'products');
  const canExport = ROLES[userRole].canExport;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortKey, setSortKey] = useState<'name' | 'price' | 'stockQuantity'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const perPage = 8;

  useEffect(() => { fetchProducts().then(p => { setProducts(p); setLoading(false); }); }, []);

  const categories = useMemo(() => [...new Set(products.map(p => p.category))], [products]);

  const filtered = useMemo(() => {
    let list = products.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      p.name.toLowerCase().includes(globalSearch.toLowerCase()) &&
      (!categoryFilter || p.category === categoryFilter)
    );
    list.sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [products, search, categoryFilter, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this product?')) return;
    await deleteProduct(id);
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const openAdd = () => { setEditProduct(null); setModalOpen(true); };
  const openEdit = (p: Product) => { setEditProduct(p); setModalOpen(true); };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      name: fd.get('name') as string, categoryName: fd.get('category') as string,
      price: parseFloat(fd.get('price') as string), stockQuantity: parseInt(fd.get('stockQuantity') as string),
    };
    if (editProduct) {
      await updateProduct(editProduct.id, data);
    } else {
      await createProduct(data);
    }
    fetchProducts().then(setProducts);
    setModalOpen(false);
  };

  const handleBulkUpload = async (data: any[]) => {
    // Process each row in sequence (or Promise.all)
    for (const row of data) {
      if (row.name && row.price) {
        await createProduct({
          name: row.name,
          categoryName: row.category || 'General',
          price: parseFloat(row.price) || 0,
          stockQuantity: parseInt(row.stock || row.stockquantity || row.quantity) || 0,
        });
      }
    }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <>
      <div className="page-header"><h2>Product Management</h2><p>Manage your product inventory and catalog.</p></div>
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-box"><Search size={16} /><input placeholder="Search products..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></div>
          <select className="form-select" style={{ width: 180 }} value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="toolbar-right">
          {canExport && (
            <>
              <button className="btn btn-secondary" onClick={() => setShowBulkUpload(true)}><Upload size={14} />Import CSV</button>
              <button className="btn btn-secondary" onClick={() => exportToCSV(products as unknown as Record<string, unknown>[], 'products')}><Download size={14} />Export CSV</button>
            </>
          )}
          {canEdit ? (
            <button className="btn btn-primary" onClick={openAdd}><Plus size={14} />Add Product</button>
          ) : (
            <span className="badge badge-processing" style={{ padding: '8px 14px' }}><Lock size={12} /> View Only</span>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="data-table">
            <thead><tr>
              <th>ID</th>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('name')}>Name {sortKey === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</th>
              <th>Category</th>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('price')}>Price {sortKey === 'price' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</th>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('stockQuantity')}>Stock {sortKey === 'stockQuantity' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</th>
              <th>Actions</th>
            </tr></thead>
            <tbody>
              {paginated.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>#{p.id}</td>
                  <td style={{ fontWeight: 500 }}>{p.name}</td>
                  <td><span className="badge badge-processing">{p.category}</span></td>
                  <td>₹{p.price.toFixed(2)}</td>
                  <td>
                    <span style={{ color: p.stockQuantity === 0 ? 'var(--accent-red)' : p.stockQuantity < 10 ? 'var(--accent-orange)' : 'var(--accent-green)', fontWeight: 600 }}>
                      {p.stockQuantity}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {canEdit && <button className="btn btn-secondary btn-icon btn-sm" onClick={() => openEdit(p)}><Edit2 size={13} /></button>}
                      {canDelete && <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(p.id)}><Trash2 size={13} /></button>}
                      {!canEdit && !canDelete && <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>—</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="pagination">
        <span className="pagination-info">Showing {Math.min((page - 1) * perPage + 1, filtered.length)}–{Math.min(page * perPage, filtered.length)} of {filtered.length}</span>
        <div className="pagination-btns">
          <button className="pagination-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={14} /></button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} className={`pagination-btn ${page === i + 1 ? 'active' : ''}`} onClick={() => setPage(i + 1)}>{i + 1}</button>
          ))}
          <button className="pagination-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight size={14} /></button>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <button className="btn btn-icon btn-secondary btn-sm" onClick={() => setModalOpen(false)}><X size={14} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label">Product Name</label><input className="form-input" name="name" required defaultValue={editProduct?.name || ''} /></div>
                <div className="form-group"><label className="form-label">Category</label><input className="form-input" name="category" required defaultValue={editProduct?.category || ''} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group"><label className="form-label">Price (₹)</label><input className="form-input" name="price" type="number" step="0.01" required defaultValue={editProduct?.price || ''} /></div>
                  <div className="form-group"><label className="form-label">Stock Quantity</label><input className="form-input" name="stockQuantity" type="number" required defaultValue={editProduct?.stockQuantity || ''} /></div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editProduct ? 'Save Changes' : 'Add Product'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBulkUpload && (
        <BulkUpload 
          type="products" 
          onClose={() => setShowBulkUpload(false)} 
          onSuccess={() => fetchProducts().then(setProducts)}
          onUpload={handleBulkUpload}
        />
      )}
    </>
  );
}
