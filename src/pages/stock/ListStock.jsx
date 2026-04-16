import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    RefreshCw, Box, History, TrendingUp, TrendingDown, ChevronDown, ChevronLeft, ChevronRight,
    AlertTriangle, Check, Tag, Calendar, Database, Edit2, X, Zap, Search, Plus
} from 'lucide-react';
import toast from 'react-hot-toast';
import stockService from '../../services/stockService';
import Loader from '../../components/Loader';
import CustomSelect from '../../components/CustomSelect';
import { resolveImageUrl } from '../../utils/imageUtils';
import '../products/Product.css';
import './Stock.css';

const ListStock = () => {
    const [batches, setBatches] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
    const [filters, setFilters] = useState({ search: '' });
    const [isRowsDropdownOpen, setIsRowsDropdownOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchStockRecords();
        }, 300);
        return () => clearTimeout(timer);
    }, [pagination.page, filters]);

    const fetchStockRecords = async () => {
        setIsLoading(true);
        try {
            const data = await stockService.getStockInRecords({
                ...filters,
                page: pagination.page,
                limit: pagination.limit,
                aggregate: true // NEW: Request combined stock totals
            });
            setBatches(data.stockInRecords || []);
            setPagination(prev => ({
                ...prev,
                total: data.pagination?.total || 0,
                pages: data.pagination?.pages || 0
            }));
        } catch (error) {
            toast.error('Failed to load stock records');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditClick = (batchId) => {
        navigate(`/stock/edit/${batchId}`);
    };

    const getStockStatus = (current, total) => {
        const ratio = current / total;
        if (current <= 0) return { label: 'Exhausted', color: '#ef4444', bg: '#fee2e2' };
        if (ratio <= 0.2) return { label: 'Critical', color: '#f59e0b', bg: '#fef3c7' };
        return { label: 'Active', color: '#10b981', bg: '#d1fae5' };
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className="product-page-container fade-in">
            <div className="product-content-pane">
                <header className="internal-page-header" style={{ padding: '0 0 1.5rem 0' }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>Batch Repository</h1>
                        <p style={{ margin: 0, color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem' }}>
                            Granular tracking of every incoming stock shipment and batch lifecycle.
                        </p>
                    </div>
                    <div className="header-actions">
                        <button className="secondary-button" onClick={fetchStockRecords} title="Refresh Data">
                            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                            <span style={{ marginLeft: '6px' }}>Refresh</span>
                        </button>
                        <button className="primary-button" onClick={() => navigate('/stock/add')}>
                            <Plus size={18} />
                            <span>Add New Batch</span>
                        </button>
                    </div>
                </header>

                <div className="modern-filter-container" style={{ marginBottom: '2rem' }}>
                    <div 
                        className="category-search-wrapper" 
                        style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            background: 'hsl(var(--secondary) / 0.3)',
                            border: '1px solid hsl(var(--border) / 0.4)',
                            borderRadius: '12px',
                            paddingLeft: '15px',
                            flex: 1,
                            transition: 'all 0.3s ease',
                            height: '48px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                        }}
                    >
                        <Search 
                            size={20} 
                            style={{ 
                                color: 'hsl(var(--muted-foreground))', 
                                flexShrink: 0,
                                position: 'static',
                                marginRight: '12px'
                            }} 
                        />
                        <input
                            type="text"
                            placeholder="Search by Batch No, Product Name..."
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
                                fontSize: '1rem'
                            }}
                        />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <button
                            className="secondary-button"
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.65rem', 
                                padding: '0.75rem 1.25rem', 
                                background: 'white',
                                border: '1px solid hsl(var(--border) / 0.4)',
                                borderRadius: '12px',
                                height: '48px', 
                                minWidth: '130px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                            }}
                            onClick={() => setIsRowsDropdownOpen(!isRowsDropdownOpen)}
                        >
                            <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Rows:</span>
                            <span style={{ fontWeight: '800', fontSize: '1rem' }}>{pagination.limit}</span>
                            <ChevronDown size={14} className={isRowsDropdownOpen ? 'rotate-180' : ''} style={{ marginLeft: 'auto', transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                        </button>

                        {isRowsDropdownOpen && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                marginTop: '0.65rem',
                                background: 'white',
                                border: '1px solid hsl(var(--border) / 0.5)',
                                borderRadius: '14px',
                                boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.15)',
                                zIndex: 1000,
                                minWidth: '150px',
                                overflow: 'hidden',
                                animation: 'fade-in 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
                            }}>
                                {[10, 20, 50, 100].map(limit => (
                                    <div
                                        key={limit}
                                        style={{
                                            padding: '0.85rem 1.25rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            background: pagination.limit === limit ? 'hsl(var(--primary) / 0.08)' : 'transparent',
                                            color: pagination.limit === limit ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
                                            fontSize: '0.9rem',
                                            fontWeight: pagination.limit === limit ? '800' : '600',
                                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                        }}
                                        className="rows-option"
                                        onClick={() => {
                                            setPagination(prev => ({ ...prev, limit, page: 1 }));
                                            setIsRowsDropdownOpen(false);
                                        }}
                                    >
                                        <span>{limit} rows</span>
                                        {pagination.limit === limit && <Check size={14} strokeWidth={3} />}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="stock-table-container">
                    <table className="stock-premium-table">
                        <thead className="stock-table-header">
                            <tr>
                                <th style={{ textAlign: 'center' }}>#</th>
                                <th style={{ minWidth: '240px' }}>Product / Variant</th>
                                <th>Sample Batch</th>
                                <th>Total Inventory</th>
                                <th style={{ textAlign: 'center' }}>Standard Pricing</th>
                                <th style={{ textAlign: 'center' }}>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {batches.length > 0 ? batches.map((batch, index) => {
                                const status = getStockStatus(batch.currentQuantity, batch.quantity);
                                const isVariant = !!batch.variantId;
                                const invPercentage = (batch.currentQuantity / batch.quantity) * 100;

                                return (
                                    <tr key={batch._id} className="stock-table-row">
                                        <td style={{ textAlign: 'center' }}>
                                            {(pagination.page - 1) * pagination.limit + index + 1}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                <div className="stock-list-image-box">
                                                    {batch.productId?.images?.thumbnail ? (
                                                        <img 
                                                            src={resolveImageUrl(batch.productId.images.thumbnail)} 
                                                            alt="" 
                                                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                                        />
                                                    ) : (
                                                        <Box size={22} style={{ opacity: 0.2 }} />
                                                    )}
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                                    <div style={{ fontWeight: '800', color: 'hsl(var(--foreground))', fontSize: '1rem', letterSpacing: '-0.01em' }}>
                                                        {batch.productId?.name || 'Unknown Product'}
                                                    </div>
                                                    {isVariant && (
                                                        <div style={{ fontSize: '0.72rem', color: 'hsl(var(--primary))', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                                            {batch.variantId.attributes?.map(attr => attr.valueName || attr.valueId?.name).join(' • ')}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                <span className="batch-badge-premium">{batch.batchNo}</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'hsl(var(--muted-foreground))', fontWeight: '600' }}>
                                                    <Calendar size={13} style={{ opacity: 0.7 }} />
                                                    <span>{formatDate(batch.createdAt)}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', minWidth: '130px', gap: '4px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontWeight: '900', fontSize: '1.05rem', color: status.color, letterSpacing: '-0.02em' }}>
                                                        {batch.currentQuantity}
                                                        <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'hsl(var(--muted-foreground))', marginLeft: '4px', opacity: 0.5 }}>/ {batch.quantity}</span>
                                                    </span>
                                                    <span style={{ fontSize: '0.65rem', fontWeight: '900', color: status.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                        {status.label}
                                                    </span>
                                                </div>
                                                <div className="inv-progress-container">
                                                    <div 
                                                        className="inv-progress-fill" 
                                                        style={{ 
                                                            width: `${Math.max(invPercentage, 4)}%`, 
                                                            backgroundColor: status.color,
                                                            boxShadow: `0 0 8px ${status.color}40`
                                                        }} 
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
                                                <div style={{ fontSize: '1.05rem', fontWeight: '900', color: 'hsl(var(--foreground))' }}>RS {batch.pricing?.finalSellingPrice}</div>
                                                <div style={{ fontSize: '0.72rem', color: 'hsl(var(--muted-foreground))', textDecoration: 'line-through', fontWeight: '600', opacity: 0.6 }}>MRP: RS {batch.pricing?.mrp}</div>
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            {batch.currentQuantity === 0 ? (
                                                <div className="status-capsule depleted">
                                                    <div className="status-capsule-dot" />
                                                    <span>Depleted</span>
                                                </div>
                                            ) : (
                                                <div className="status-capsule in-stock">
                                                    <div className="status-capsule-dot" />
                                                    <span>In Stock</span>
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <div className="stock-actions">
                                                <button 
                                                    className="action-btn"
                                                    onClick={() => navigate(`/stock/history/${batch._id}`)}
                                                    title="View History"
                                                >
                                                    <History size={16} />
                                                </button>
                                                <button 
                                                    className="action-btn edit"
                                                    onClick={() => navigate(`/stock/edit/${batch._id}`)}
                                                    title="Edit Batch"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan="7" className="text-center py-40">
                                        {isLoading ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                                                <Loader />
                                                <span style={{ fontSize: '1rem', color: 'hsl(var(--muted-foreground))', fontWeight: '600', letterSpacing: '0.01em' }}>Curating stock inventory...</span>
                                            </div>
                                        ) : (
                                            <div style={{ opacity: 0.6, padding: '4rem' }}>
                                                <div style={{ background: 'hsl(var(--secondary) / 0.2)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyCenter: 'center', margin: '0 auto 1.5rem' }}>
                                                    <Box size={40} style={{ opacity: 0.5 }} />
                                                </div>
                                                <p style={{ fontSize: '1.25rem', fontWeight: '900', color: 'hsl(var(--foreground))', letterSpacing: '-0.02em' }}>Repository Empty</p>
                                                <p style={{ fontSize: '0.9rem', color: 'hsl(var(--muted-foreground))', marginTop: '0.5rem' }}>No batch records were found for the current filter. Try a different search term.</p>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {pagination.total > 0 && (
                    <div className="pagination-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderTop: '1px solid hsl(var(--border) / 0.1)' }}>
                        <div style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>
                            <span>Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                className="secondary-button"
                                disabled={pagination.page === 1}
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                style={{ padding: '8px', minWidth: '40px' }}
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                className="secondary-button"
                                disabled={pagination.page >= pagination.pages}
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                style={{ padding: '8px', minWidth: '40px' }}
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ListStock;
