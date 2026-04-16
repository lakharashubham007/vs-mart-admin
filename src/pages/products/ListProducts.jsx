import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
    Search, Plus, Filter, Edit, Trash2, Package,
    ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Layers, Tag, Eye,
    AlertCircle, CheckCircle2, MoreHorizontal, RefreshCw, Copy, X, Image as ImageIcon, QrCode, ScanBarcode
} from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import productService from '../../services/productService';
import Loader from '../../components/Loader';
import CustomSelect from '../../components/CustomSelect';
import { resolveImageUrl } from '../../utils/imageUtils';
import '../category/Category.css';
import './Product.css';

const ListProducts = () => {
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [masters, setMasters] = useState({ categories: [], brands: [] });
    const [filters, setFilters] = useState({
        search: '',
        categoryId: '',
        brandId: '',
        productType: '',
        status: ''
    });
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
    const [isRowsDropdownOpen, setIsRowsDropdownOpen] = useState(false);
    const [expandedRows, setExpandedRows] = useState({});
    const [selectedProductForGallery, setSelectedProductForGallery] = useState(null);
    const [galleryModalOpen, setGalleryModalOpen] = useState(false);
    const [selectedDisplayImage, setSelectedDisplayImage] = useState(null);
    const [selectedQrCode, setSelectedQrCode] = useState(null);
    const [selectedBarcode, setSelectedBarcode] = useState(null);
    const [selectedQrTitle, setSelectedQrTitle] = useState('');
    const [modalType, setModalType] = useState('QR'); // 'QR' or 'BARCODE'
    const [qrModalOpen, setQrModalOpen] = useState(false);

    // Drag to scroll state
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const navigate = useNavigate();

    const toggleRow = (productId) => {
        setExpandedRows(prev => ({
            ...prev,
            [productId]: !prev[productId]
        }));
    };

    useEffect(() => {
        fetchMasters();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchProducts();
        }, 300);
        return () => clearTimeout(timer);
    }, [pagination.page, filters]);

    const fetchMasters = async () => {
        try {
            const [cat, br] = await Promise.all([
                productService.getCategories(),
                productService.getBrands()
            ]);
            setMasters({
                categories: cat.categories || [],
                brands: br.brands || []
            });
        } catch (error) {
            console.error('Failed to load masters');
        }
    };

    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            const data = await productService.getProducts({
                ...filters,
                page: pagination.page,
                limit: pagination.limit
            });
            setProducts(data.products || []);
            setPagination(prev => ({ ...prev, total: data.pagination?.total || 0 }));
        } catch (error) {
            toast.error('Failed to load products');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Terminate Listing?',
            text: 'This product will be archived and removed from sale.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Yes, Archive',
            background: 'hsl(var(--card))',
            color: 'hsl(var(--foreground))',
        });

        if (result.isConfirmed) {
            try {
                await productService.deleteProduct(id);
                toast.success('Product archived successfully');
                fetchProducts();
            } catch (error) {
                toast.error('Deletion failed');
            }
        }
    };

    const getStockInfo = (product) => {
        if (product.productType === 'Single') {
            const qty = product.pricing?.quantity || 0;
            const min = product.pricing?.minStock || 0;
            return {
                qty,
                intensity: qty <= min ? 'stock-low' : qty <= min * 2 ? 'stock-mid' : 'stock-high',
                label: qty <= min ? 'Critical' : 'Healthy'
            };
        } else {
            const totalQty = (product.variants || []).reduce((acc, v) => acc + (v.inventory?.quantity || 0), 0);
            return {
                qty: totalQty,
                intensity: totalQty === 0 ? 'stock-low' : 'stock-high',
                label: `${product.variants?.length || 0} Variants`
            };
        }
    };

    const getPriceRange = (product) => {
        if (product.productType === 'Single') {
            return `RS${product.pricing?.finalSellingPrice || product.pricing?.sellingPrice || 0}`;
        } else {
            const prices = (product.variants || []).map(v => v.pricing?.finalSellingPrice || v.pricing?.sellingPrice).filter(p => p !== undefined && !isNaN(p));
            if (prices.length === 0) return 'N/A';
            const min = Math.min(...prices);
            const max = Math.max(...prices);
            return min === max ? `RS${min}` : `RS${min} - RS${max}`;
        }
    };

    return (
        <div className="category-page-container fade-in">
            <div className="category-content-pane">
                <header className="internal-page-header">
                    <div>
                        <h1>Product Repository</h1>
                        <p>Monitoring {pagination.total} global assets across all distribution channels.</p>
                    </div>
                    <div className="header-actions">
                        <button className="secondary-button" onClick={fetchProducts} title="Refresh Data">
                            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                            <span>Refresh</span>
                        </button>
                        <button className="primary-button" onClick={() => navigate('/products/add-product')}>
                            <Plus size={16} /> Add Product
                        </button>
                    </div>
                </header>

                <div className="category-glass-card" style={{ marginBottom: '1.5rem' }}>
                    <div className="category-filter-bar">
                        <div 
                            className="category-search-wrapper"
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                background: 'hsl(var(--secondary) / 0.3)', 
                                border: '1px solid hsl(var(--border) / 0.5)',
                                borderRadius: '12px',
                                paddingLeft: '12px',
                                flex: 1,
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <Search 
                                size={18} 
                                style={{ 
                                    color: 'hsl(var(--muted-foreground))', 
                                    flexShrink: 0,
                                    position: 'static',
                                    marginRight: '10px'
                                }} 
                            />
                            <input
                                type="text"
                                placeholder="Search products..."
                                className="category-search-input"
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem 0',
                                    background: 'transparent',
                                    border: 'none',
                                    outline: 'none',
                                    color: 'hsl(var(--foreground))',
                                    fontSize: '0.95rem'
                                }}
                            />
                        </div>

                        <div className="category-filter-group">
                            <CustomSelect
                                options={[
                                    { value: '', label: 'All Categories' },
                                    ...masters.categories.map(c => ({ value: c._id, label: c.name }))
                                ]}
                                value={filters.categoryId}
                                onChange={(val) => setFilters(prev => ({ ...prev, categoryId: val, page: 1 }))}
                                placeholder="All Categories"
                            />
                        </div>

                        <div className="category-filter-group">
                            <CustomSelect
                                options={[
                                    { value: '', label: 'All Brands' },
                                    ...masters.brands.map(b => ({ value: b._id, label: b.name }))
                                ]}
                                value={filters.brandId}
                                onChange={(val) => setFilters(prev => ({ ...prev, brandId: val, page: 1 }))}
                                placeholder="All Brands"
                            />
                        </div>

                        <div className="category-filter-group" style={{ minWidth: '160px' }}>
                            <CustomSelect
                                options={[
                                    { value: '', label: 'All Types' },
                                    { value: 'Single', label: 'Static/Single' },
                                    { value: 'Variant', label: 'Variable Matrix' }
                                ]}
                                value={filters.productType}
                                onChange={(val) => setFilters(prev => ({ ...prev, productType: val, page: 1 }))}
                                placeholder="Product Type"
                            />
                        </div>

                        <div className="category-filter-group">
                            <CustomSelect
                                options={[
                                    { value: '', label: 'Any Status' },
                                    { value: 'true', label: 'Active Live' },
                                    { value: 'false', label: 'Draft Mode' }
                                ]}
                                value={filters.status}
                                onChange={(val) => setFilters(prev => ({ ...prev, status: val, page: 1 }))}
                                placeholder="Status"
                            />
                        </div>

                        {/* Clear Filters Button */}
                        {(filters.search || filters.categoryId || filters.brandId || filters.productType || filters.status) && (
                            <button
                                className="secondary-button"
                                style={{ padding: '0.65rem', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                onClick={() => setFilters({ search: '', categoryId: '', brandId: '', productType: '', status: '' })}
                                title="Clear all filters"
                            >
                                <RefreshCw size={16} />
                            </button>
                        )}

                        {/* Rows Per Page Dropdown */}
                        <div style={{ position: 'relative', marginLeft: 'auto' }}>
                            <button
                                className="secondary-button"
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1rem', background: 'hsl(var(--card))', height: '42px' }}
                                onClick={() => setIsRowsDropdownOpen(!isRowsDropdownOpen)}
                            >
                                <span style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>Rows:</span>
                                <span style={{ fontWeight: '600' }}>{pagination.limit}</span>
                                <ChevronDown size={14} className={isRowsDropdownOpen ? 'rotate-180' : ''} />
                            </button>

                            {isRowsDropdownOpen && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    right: 0,
                                    marginTop: '0.5rem',
                                    background: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border) / 0.5)',
                                    borderRadius: '8px',
                                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                                    zIndex: 50,
                                    minWidth: '120px',
                                    overflow: 'hidden'
                                }}>
                                    {[10, 25, 50, 100].map(limit => (
                                        <div
                                            key={limit}
                                            style={{
                                                padding: '0.6rem 1rem',
                                                cursor: 'pointer',
                                                background: pagination.limit === limit ? 'hsl(var(--primary) / 0.1)' : 'transparent',
                                                color: pagination.limit === limit ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
                                                fontSize: '0.9rem',
                                                fontWeight: pagination.limit === limit ? '600' : '400',
                                            }}
                                            onClick={() => {
                                                setPagination(prev => ({ ...prev, limit, page: 1 }));
                                                setIsRowsDropdownOpen(false);
                                            }}
                                        >
                                            {limit} rows
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="category-table-wrapper">
                    <table className="category-table w-full">
                        <thead>
                            <tr>
                                <th style={{ width: '60px', paddingLeft: '1.5rem' }}>S.No.</th>
                                <th>Product Name & Image</th>
                                <th>Category & Brand</th>
                                <th>Pricing & Inventory</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right', paddingRight: '1.5rem' }}>Management</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.length > 0 ? products.map((product, index) => {
                                const stock = getStockInfo(product);
                                const isExpanded = expandedRows[product._id];
                                return (
                                    <React.Fragment key={product._id}>
                                        <tr className="category-row cursor-default">
                                            <td style={{ fontWeight: '500', color: 'hsl(var(--muted-foreground))', paddingLeft: '1.5rem' }}>
                                                {(pagination.page - 1) * pagination.limit + index + 1}
                                            </td>
                                            <td>
                                                <div className="category-cell-name">
                                                    <div
                                                        className="category-img-box"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedProductForGallery(product);
                                                            // Set default display image to thumbnail, or first gallery image, or null
                                                            const defaultImg = product.images?.thumbnail || (product.images?.gallery?.[0]) || null;
                                                            setSelectedDisplayImage(defaultImg);
                                                            setGalleryModalOpen(true);
                                                        }}
                                                        style={{ cursor: 'pointer', position: 'relative' }}
                                                        title="View Image Gallery"
                                                    >
                                                        {product.images?.thumbnail ? (
                                                            <img src={resolveImageUrl(product.images.thumbnail)} alt="" />
                                                        ) : (
                                                            <Package size={20} className="text-muted-foreground" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{product.name}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                            <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider ${product.productType === 'Variant' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                                                {product.productType === 'Variant' ? 'Variable' : 'Static'}
                                                            </span>
                                                            <span style={{ color: 'hsl(var(--muted-foreground))' }}>• SKU: {product.productType === 'Single' ? (product.pricing?.sku || 'N/A') : `MTX-${product.variants?.length || 0}`}</span>
                                                            {product.productType === 'Variant' && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); toggleRow(product._id); }}
                                                                    className="variant-expand-btn"
                                                                    title={isExpanded ? "Hide Variants" : "Show Variants"}
                                                                >
                                                                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'hsl(var(--foreground))' }}>{product.categoryName || 'Uncategorized'}</span>
                                                    <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>{product.brandName || 'Generic Brand'}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                                    <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'hsl(var(--foreground))' }}>{getPriceRange(product)}</span>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: stock.intensity === 'stock-high' ? '#10b981' : stock.intensity === 'stock-mid' ? '#f59e0b' : '#ef4444' }} />
                                                        <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', fontWeight: '500' }}>{stock.qty} Units in Stock</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`category-badge ${product.status ? 'active' : 'inactive'}`}>
                                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: product.status ? 'currentColor' : 'hsl(var(--muted-foreground))' }} />
                                                    {product.status ? 'Live' : 'Draft'}
                                                </span>
                                            </td>
                                            <td style={{ paddingRight: '1.5rem' }}>
                                                <div className="category-actions">
                                                    <button
                                                        className="action-btn"
                                                        onClick={(e) => { e.stopPropagation(); navigate(`/products/edit-product/${product._id}`); }}
                                                        title="Edit Product"
                                                    >
                                                        <Edit size={14} />
                                                    </button>
                                                    {product.productType === 'Single' && (
                                                        <button
                                                            className="action-btn"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedQrCode(resolveImageUrl(product.qrCode));
                                                                setSelectedBarcode(resolveImageUrl(product.barcode));
                                                                setSelectedQrTitle(`${product.name}`);
                                                                setModalType('QR');
                                                                setQrModalOpen(true);
                                                            }}
                                                            title="View QR/Barcode"
                                                        >
                                                            <QrCode size={18} />
                                                        </button>
                                                    )}
                                                    <button
                                                        className="action-btn delete"
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(product._id); }}
                                                        title="Delete Product"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {isExpanded && product.variants && product.variants.length > 0 && (
                                            <tr className="variant-subrow">
                                                <td colSpan="1" style={{ padding: 0, borderBottom: '1px solid hsl(var(--border) / 0.1)' }}></td>
                                                <td colSpan="5" style={{ padding: 0 }}>
                                                    <div className="variant-subrow-content" style={{ paddingLeft: '0', paddingRight: '2rem' }}>
                                                        <table className="variant-matrix-subtable">
                                                            <thead>
                                                                <tr>
                                                                    <th style={{ width: '10%' }}>QR</th>
                                                                    <th style={{ width: '30%' }}>Variant Combination</th>
                                                                    <th style={{ width: '25%' }}>SKU</th>
                                                                    <th style={{ width: '20%', textAlign: 'right' }}>Price (MRP)</th>
                                                                    <th style={{ width: '15%', textAlign: 'right', paddingRight: '1.5rem' }}>In Stock</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {product.variants.map((v, i) => (
                                                                    <tr key={v._id || i}>
                                                                        <td>
                                                                            <div
                                                                                className="variant-qr-thumb"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setSelectedQrCode(resolveImageUrl(v.qrCode));
                                                                                    setSelectedBarcode(resolveImageUrl(v.barcode));
                                                                                    const attrText = v.attributes?.map(attr => attr.valueName || attr.valueId?.name || attr.valueId?.valueName || attr.valueId?.value).join(' / ') || 'Variant';
                                                                                    setSelectedQrTitle(`${attrText}`);
                                                                                    setModalType('QR');
                                                                                    setQrModalOpen(true);
                                                                                }}
                                                                                title="View QR/Barcode"
                                                                            >
                                                                                <QrCode size={16} className="text-muted-foreground opacity-40 hover:text-primary transition-colors" />
                                                                            </div>
                                                                        </td>
                                                                        <td style={{ fontWeight: '500' }}>
                                                                            {v.attributes?.map(attr => attr.valueName || attr.valueId?.name || attr.valueId?.valueName || attr.valueId?.value).join(' / ') || 'Variant'}
                                                                        </td>
                                                                        <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>{v.sku}</td>
                                                                        <td style={{ textAlign: 'right' }}>
                                                                            <span style={{ fontWeight: '600' }}>RS{v.pricing?.finalSellingPrice || v.pricing?.sellingPrice}</span> <span style={{ textDecoration: 'line-through', color: 'hsl(var(--muted-foreground) / 0.5)', fontSize: '0.75rem', marginLeft: '0.2rem' }}>RS{v.pricing?.mrp}</span>
                                                                        </td>
                                                                        <td style={{ textAlign: 'right', paddingRight: '1.5rem' }}>
                                                                            <span className={`px-2 py-0.5 rounded textxs font-bold ${v.inventory?.quantity > (v.inventory?.minStock || 5) ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                                                                                {v.inventory?.quantity || 0} Units
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            }) : (
                                <tr>
                                    <td colSpan="8" className="text-center py-24">
                                        <div className="flex flex-col items-center gap-6">
                                            <div style={{ opacity: 0.15 }}>
                                                <Package size={80} strokeWidth={1} />
                                            </div>
                                            <div className="text-center">
                                                <h3 className="text-2xl font-black" style={{ letterSpacing: '0.1em', color: 'hsl(var(--foreground))' }}>
                                                    {filters.categoryId ? 'NO PRODUCTS IN CATEGORY' : 
                                                     filters.search ? 'NO MATCHING PRODUCTS' : 'CATALOG EMPTY'}
                                                </h3>
                                                <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))', marginTop: '4px' }}>
                                                    {filters.categoryId ? 'We couldn\'t find any active listings in the selected category.' :
                                                     filters.search ? `No results found for "${filters.search}". Try different keywords.` :
                                                     'Initiate your first product to begin tracking your global assets.'}
                                                </p>
                                                {(filters.categoryId || filters.search || filters.brandId || filters.productType || filters.status) && (
                                                    <button 
                                                        className="secondary-button" 
                                                        style={{ marginTop: '1.5rem' }}
                                                        onClick={() => setFilters({ search: '', categoryId: '', brandId: '', productType: '', status: '' })}
                                                    >
                                                        Clear All Filters
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {pagination.total > 0 && (
                    <div className="category-pagination-footer">
                        <div style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>
                            <span>Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                className="secondary-button"
                                style={{ padding: '0.4rem', borderRadius: '6px' }}
                                disabled={pagination.page === 1}
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                className="secondary-button"
                                style={{ padding: '0.4rem', borderRadius: '6px' }}
                                disabled={pagination.page * pagination.limit >= pagination.total}
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {galleryModalOpen && selectedProductForGallery && createPortal(
                <div className="quick-modal-overlay" onClick={(e) => { if (e.target.className === 'quick-modal-overlay') setGalleryModalOpen(false); }}>
                    <div className="quick-modal-container" style={{
                        maxWidth: '900px', width: '90vw',
                        display: 'flex', flexDirection: 'column'
                    }}>
                        <div className="quick-modal-gradient-bar" />
                        <div className="quick-modal-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0 }}>
                            <div className="quick-modal-header" style={{ padding: '24px 32px', borderBottom: '1px solid hsl(var(--border) / 0.5)', marginBottom: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        width: '48px', height: '48px', borderRadius: '12px',
                                        background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))'
                                    }}>
                                        <ImageIcon size={24} />
                                    </div>
                                    <div>
                                        <h3 className="quick-modal-title" style={{ margin: 0, fontSize: '1.5rem' }}>Image Gallery</h3>
                                        <p className="quick-modal-subtitle" style={{ margin: '6px 0 0 0', fontSize: '0.75rem' }}>Viewing assets for <span style={{ fontWeight: '800' }}>{selectedProductForGallery.name}</span></p>
                                    </div>
                                </div>
                                <button onClick={() => setGalleryModalOpen(false)} className="quick-modal-close-btn" title="Close Gallery" style={{ alignSelf: 'flex-start' }}>
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="quick-modal-form" style={{ padding: '32px', flex: 1, backgroundColor: 'hsl(var(--muted) / 0.1)', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                                {/* Main Image Viewer (Scrollable) */}
                                <div
                                    id="main-gallery-scroll"
                                    style={{
                                        display: 'flex', overflowX: 'auto', gap: '24px', paddingBottom: '16px',
                                        paddingLeft: 'calc(50% - 190px)', paddingRight: 'calc(50% - 190px)',
                                        scrollBehavior: isDragging ? 'auto' : 'smooth',
                                        cursor: isDragging ? 'grabbing' : 'grab',
                                        msOverflowStyle: 'none', scrollbarWidth: 'none',
                                        flex: 1, alignItems: 'center'
                                    }}
                                    className="hide-scrollbar"
                                    onMouseDown={(e) => {
                                        setIsDragging(true);
                                        setStartX(e.pageX - e.currentTarget.offsetLeft);
                                        setScrollLeft(e.currentTarget.scrollLeft);
                                    }}
                                    onMouseLeave={() => setIsDragging(false)}
                                    onMouseUp={() => setIsDragging(false)}
                                    onMouseMove={(e) => {
                                        if (!isDragging) return;
                                        e.preventDefault();
                                        const x = e.pageX - e.currentTarget.offsetLeft;
                                        const walk = (x - startX) * 2;
                                        e.currentTarget.scrollLeft = scrollLeft - walk;
                                    }}
                                    onScroll={(e) => {
                                        // Auto-detect which image is currently in the center of the scroll view
                                        const container = e.currentTarget;
                                        const scrollCenter = container.scrollLeft + container.clientWidth / 2;
                                        let closestIndex = 0;
                                        let minDistance = Infinity;

                                        Array.from(container.children).forEach((child, index) => {
                                            // Skip the <style> tag
                                            if (child.tagName.toLowerCase() === 'style') return;
                                            const childCenter = child.offsetLeft - container.offsetLeft + child.clientWidth / 2;
                                            const distance = Math.abs(scrollCenter - childCenter);
                                            if (distance < minDistance) {
                                                minDistance = distance;
                                                closestIndex = index - 1; // -1 because of <style> tag
                                            }
                                        });

                                        const allImages = [];
                                        if (selectedProductForGallery?.images?.thumbnail) allImages.push(selectedProductForGallery.images.thumbnail);
                                        if (selectedProductForGallery?.images?.gallery) allImages.push(...selectedProductForGallery.images.gallery);

                                        if (allImages[closestIndex] && allImages[closestIndex] !== selectedDisplayImage) {
                                            setSelectedDisplayImage(allImages[closestIndex]);
                                        }
                                    }}
                                >
                                    <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>

                                    {selectedProductForGallery.images?.thumbnail && (
                                        <div style={{
                                            flex: '0 0 auto', width: '380px', height: '380px',
                                            border: '1px solid hsl(var(--border) / 0.5)', borderRadius: '12px',
                                            overflow: 'hidden', backgroundColor: 'hsl(var(--card))',
                                            display: 'flex', flexDirection: 'column',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                        }}>
                                            <div style={{ padding: '12px 16px', borderBottom: '1px solid hsl(var(--border) / 0.3)', backgroundColor: 'hsl(var(--secondary) / 0.5)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsl(var(--foreground))' }}>Primary Thumbnail</span>
                                            </div>
                                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                                                <img draggable="false" src={resolveImageUrl(selectedProductForGallery.images.thumbnail)} alt="Thumbnail" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', userSelect: 'none' }} />
                                            </div>
                                        </div>
                                    )}

                                    {selectedProductForGallery.images?.gallery?.map((img, idx) => (
                                        <div key={idx} style={{
                                            flex: '0 0 auto', width: '380px', height: '380px',
                                            border: '1px solid hsl(var(--border) / 0.5)', borderRadius: '12px',
                                            overflow: 'hidden', backgroundColor: 'hsl(var(--card))',
                                            display: 'flex', flexDirection: 'column',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                        }}>
                                            <div style={{ padding: '12px 16px', borderBottom: '1px solid hsl(var(--border) / 0.3)', backgroundColor: 'hsl(var(--secondary) / 0.5)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsl(var(--muted-foreground))' }}>Gallery Image {idx + 1}</span>
                                            </div>
                                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                                                <img draggable="false" src={resolveImageUrl(img)} alt={`Gallery ${idx + 1}`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', userSelect: 'none' }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Thumbnail Strip */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsl(var(--muted-foreground))' }}>
                                        {selectedProductForGallery.images?.gallery ? selectedProductForGallery.images.gallery.length + (selectedProductForGallery.images.thumbnail ? 1 : 0) : (selectedProductForGallery.images?.thumbnail ? 1 : 0)} assets available
                                    </div>
                                    <div
                                        style={{
                                            display: 'flex', overflowX: 'auto', gap: '12px', paddingBottom: '8px', maxWidth: '100%',
                                            msOverflowStyle: 'none', scrollbarWidth: 'none', justifyContent: 'center'
                                        }}
                                        className="hide-scrollbar"
                                    >
                                        {/* Primary Thumbnail in Strip */}
                                        {selectedProductForGallery.images?.thumbnail && (
                                            <div
                                                onClick={() => {
                                                    setSelectedDisplayImage(selectedProductForGallery.images.thumbnail);
                                                    const container = document.getElementById('main-gallery-scroll');
                                                    if (container) {
                                                        const el = container.children[1]; // indices 0 is style tag
                                                        if (el) container.scrollTo({ left: el.offsetLeft - container.offsetLeft, behavior: 'smooth' });
                                                    }
                                                }}
                                                style={{
                                                    flex: '0 0 auto', width: '64px', height: '64px',
                                                    border: selectedDisplayImage === selectedProductForGallery.images.thumbnail
                                                        ? '2px solid hsl(var(--primary))'
                                                        : '1px solid hsl(var(--border))',
                                                    borderRadius: '8px',
                                                    overflow: 'hidden', backgroundColor: 'hsl(var(--card))',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px',
                                                    cursor: 'pointer', transition: 'all 0.2s ease',
                                                    opacity: selectedDisplayImage === selectedProductForGallery.images.thumbnail ? 1 : 0.6,
                                                    filter: selectedDisplayImage === selectedProductForGallery.images.thumbnail ? 'none' : 'grayscale(40%)'
                                                }}
                                            >
                                                <img draggable="false" src={resolveImageUrl(selectedProductForGallery.images.thumbnail)} alt="Thumbnail View" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', userSelect: 'none' }} />
                                            </div>
                                        )}

                                        {/* Gallery Images in Strip */}
                                        {selectedProductForGallery.images?.gallery?.map((img, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => {
                                                    setSelectedDisplayImage(img);
                                                    const container = document.getElementById('main-gallery-scroll');
                                                    if (container) {
                                                        const offsetIdx = selectedProductForGallery.images?.thumbnail ? idx + 2 : idx + 1;
                                                        const el = container.children[offsetIdx];
                                                        if (el) container.scrollTo({ left: el.offsetLeft - container.offsetLeft, behavior: 'smooth' });
                                                    }
                                                }}
                                                style={{
                                                    flex: '0 0 auto', width: '64px', height: '64px',
                                                    border: selectedDisplayImage === img
                                                        ? '2px solid hsl(var(--primary))'
                                                        : '1px solid hsl(var(--border))',
                                                    borderRadius: '8px',
                                                    overflow: 'hidden', backgroundColor: 'hsl(var(--card))',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px',
                                                    cursor: 'pointer', transition: 'all 0.2s ease',
                                                    opacity: selectedDisplayImage === img ? 1 : 0.6,
                                                    filter: selectedDisplayImage === img ? 'none' : 'grayscale(40%)'
                                                }}
                                            >
                                                <img draggable="false" src={resolveImageUrl(img)} alt={`Gallery View ${idx + 1}`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', userSelect: 'none' }} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* QR Code Modal */}
            {qrModalOpen && createPortal(
                <div className="quick-modal-overlay" onClick={(e) => { if (e.target.className === 'quick-modal-overlay') setQrModalOpen(false); }}>
                    <div className="quick-modal-container" style={{ maxWidth: '450px', width: '90vw' }}>
                        <div className="quick-modal-gradient-bar" />
                        <div className="quick-modal-header" style={{ borderBottom: 'none', paddingBottom: '0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    width: '40px', height: '40px', borderRadius: '10px',
                                    background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))'
                                }}>
                                    {modalType === 'QR' ? <QrCode size={20} /> : <ScanBarcode size={20} />}
                                </div>
                                <h3 className="quick-modal-title" style={{ margin: 0 }}>{modalType === 'QR' ? 'QR Identity' : 'EAN Barcode'}</h3>
                            </div>
                            <button onClick={() => setQrModalOpen(false)} className="quick-modal-close-btn">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Toggle Bar */}
                        <div style={{ padding: '0 32px', marginTop: '16px' }}>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                background: 'hsl(var(--muted)/0.5)',
                                borderRadius: '12px',
                                padding: '4px',
                                gap: '4px'
                            }}>
                                <button
                                    onClick={() => setModalType('QR')}
                                    style={{
                                        padding: '10px',
                                        borderRadius: '8px',
                                        fontSize: '0.85rem',
                                        fontWeight: '700',
                                        border: 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        background: modalType === 'QR' ? 'white' : 'transparent',
                                        color: modalType === 'QR' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                                        boxShadow: modalType === 'QR' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    <QrCode size={14} /> QR Code
                                </button>
                                <button
                                    onClick={() => setModalType('BARCODE')}
                                    style={{
                                        padding: '10px',
                                        borderRadius: '8px',
                                        fontSize: '0.85rem',
                                        fontWeight: '700',
                                        border: 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        background: modalType === 'BARCODE' ? 'white' : 'transparent',
                                        color: modalType === 'BARCODE' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                                        boxShadow: modalType === 'BARCODE' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    <ScanBarcode size={14} /> Barcode
                                </button>
                            </div>
                        </div>

                        <div className="quick-modal-form" style={{ padding: '32px', textAlign: 'center' }}>
                            <div style={{
                                background: 'white',
                                padding: '1.5rem',
                                borderRadius: '1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid hsl(var(--border) / 0.5)',
                                boxShadow: '0 15px 35px -10px rgba(0, 0, 0, 0.08)',
                                marginBottom: '1.5rem',
                                width: '100%',
                            }}>
                                {modalType === 'QR' ? (
                                    selectedQrCode ? (
                                        <img src={selectedQrCode} alt="QR Code" style={{ maxWidth: '100%', height: 'auto' }} />
                                    ) : (
                                        <div style={{ padding: '3rem', opacity: 0.2 }}>
                                            <QrCode size={120} strokeWidth={1} />
                                            <p style={{ marginTop: '1rem', fontWeight: '800' }}>NO QR DATA</p>
                                        </div>
                                    )
                                ) : (
                                    selectedBarcode ? (
                                        <img src={selectedBarcode} alt="Barcode" style={{ maxWidth: '100%', height: 'auto' }} />
                                    ) : (
                                        <div style={{ padding: '3rem', opacity: 0.2 }}>
                                            <ScanBarcode size={120} strokeWidth={1} />
                                            <p style={{ marginTop: '1rem', fontWeight: '800' }}>NO BARCODE DATA</p>
                                        </div>
                                    )
                                )}
                            </div>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: '700' }}>{selectedQrTitle}</h4>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))' }}>Global assets identity tag for internal logistics tracking.</p>
                            
                            <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                                <button className="secondary-button" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setQrModalOpen(false)}>
                                    Close
                                </button>
                                <button className="primary-button" style={{ flex: 1, justifyContent: 'center' }} onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = modalType === 'QR' ? selectedQrCode : selectedBarcode;
                                    link.download = `${selectedQrTitle.replace(/\s+/g, '_')}_${modalType.toLowerCase()}.png`;
                                    link.click();
                                    toast.success('Asset downloaded successfully');
                                }}>
                                    Download Image
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default ListProducts;
