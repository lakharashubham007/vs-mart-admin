import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    RefreshCw, Box, History, TrendingUp, TrendingDown, ChevronDown,
    AlertTriangle, Check, Tag, Calendar, Database, Edit2, X, Zap, Search, Plus
} from 'lucide-react';
import toast from 'react-hot-toast';
import stockService from '../../services/stockService';
import Loader from '../../components/Loader';
import CustomSelect from '../../components/CustomSelect';
import { BASE_IMAGE_URL } from '../../config/env';
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
                limit: pagination.limit
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

                <div className="product-glass-card" style={{ marginBottom: '1.5rem' }}>
                    <div className="product-filter-bar" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div className="product-search-wrapper" style={{ flex: 1 }}>
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Search by Batch No (e.g. SUGAR-B1)..."
                                className="product-search-input"
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                            />
                        </div>

                        <div style={{ position: 'relative', marginLeft: 'auto' }}>
                            <button
                                className="secondary-button"
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1rem', background: 'hsl(var(--card))', height: '42px', minWidth: '110px' }}
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
                                    {[10, 20, 50, 100].map(limit => (
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

                <div className="product-table-wrapper">
                    <table className="product-table w-full">
                        <thead>
                            <tr>
                                <th style={{ width: '60px', paddingLeft: '1.5rem' }}>#</th>
                                <th>Product / Variant</th>
                                <th>Batch Details</th>
                                <th>Remaining Inv</th>
                                <th>Batch Price</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right', paddingRight: '1.5rem' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {batches.length > 0 ? batches.map((batch, index) => {
                                const status = getStockStatus(batch.currentQuantity, batch.quantity);
                                const isVariant = !!batch.variantId;

                                return (
                                    <tr key={batch._id} className="category-row">
                                        <td style={{ color: 'hsl(var(--muted-foreground))', paddingLeft: '1.5rem' }}>
                                            {(pagination.page - 1) * pagination.limit + index + 1}
                                        </td>
                                        <td>
                                            <div className="category-cell-name">
                                                <div className="category-img-box">
                                                    {batch.productId?.images?.thumbnail ? (
                                                        <img src={`${BASE_IMAGE_URL}/${batch.productId.images.thumbnail}`} alt="" />
                                                    ) : (
                                                        <Box size={20} className="text-muted-foreground" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '600' }}>{batch.productId?.name || 'Unknown Product'}</div>
                                                    {isVariant && (
                                                        <div style={{ fontSize: '0.75rem', color: 'hsl(var(--primary))', fontWeight: '500' }}>
                                                            {batch.variantId.attributes?.map(attr => attr.valueName || attr.valueId?.name).join(' / ')}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                <code className="batch-tag">{batch.batchNo}</code>
                                                <span style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))' }}>
                                                    Added: {formatDate(batch.createdAt)}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <div style={{ fontWeight: '700', fontSize: '1rem' }}>
                                                    {batch.currentQuantity} <span style={{ fontSize: '0.75rem', fontWeight: '400', color: 'hsl(var(--muted-foreground))' }}>/ {batch.quantity}</span>
                                                </div>
                                                <span style={{
                                                    fontSize: '0.65rem',
                                                    padding: '2px 8px',
                                                    borderRadius: '10px',
                                                    backgroundColor: status.bg,
                                                    color: status.color,
                                                    width: 'fit-content',
                                                    fontWeight: '800',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {status.label}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <div style={{ fontWeight: '600', color: 'hsl(var(--foreground))' }}>RS{batch.pricing?.sellingPrice}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))', textDecoration: 'line-through' }}>
                                                    MRP: RS{batch.pricing?.mrp}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem' }}>
                                                {batch.currentQuantity === 0 ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', fontWeight: 600 }}>
                                                        <X size={12} strokeWidth={3} />
                                                        <span>Fully Depleted</span>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: 600 }}>
                                                        <Check size={12} strokeWidth={3} />
                                                        <span>In Stock</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ paddingRight: '1.5rem' }}>
                                            <div className="category-actions">
                                                <button
                                                    className="action-btn"
                                                    title="View Batch History"
                                                    onClick={() => navigate(`/stock/history/${batch.productId?._id}?variantId=${batch.variantId?._id || ''}`)}
                                                >
                                                    <History size={16} />
                                                </button>
                                                <button
                                                    className="action-btn"
                                                    title="Edit Batch"
                                                    onClick={() => handleEditClick(batch._id)}
                                                    style={{ color: 'hsl(var(--primary))' }}
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan="7" className="text-center py-24">
                                        {isLoading ? <Loader /> : 'No stock records found in the repository.'}
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
