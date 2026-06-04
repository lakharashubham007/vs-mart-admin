import React, { useState, useEffect } from 'react';
import { X, Search, RefreshCw, ChevronLeft, ChevronRight, History, ArrowDownToLine, ArrowUpFromLine, RefreshCcw, ShoppingBag } from 'lucide-react';
import { createPortal } from 'react-dom';
import customerService from '../../services/customerService';
import Loader from '../../components/Loader';
import { resolveImageUrl } from '../../utils/imageUtils';
import './Customer.css';

const CartHistoryModal = ({ isOpen, onClose, customer }) => {
    const [historyData, setHistoryData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [actionFilter, setActionFilter] = useState('ALL');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

    useEffect(() => {
        if (isOpen && customer) {
            const timer = setTimeout(() => {
                fetchHistory();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen, customer, pagination.page, actionFilter, searchTerm]);

    const fetchHistory = async () => {
        setIsLoading(true);
        try {
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                search: searchTerm
            };
            if (actionFilter !== 'ALL') {
                params.actionType = actionFilter;
            }
            const res = await customerService.getCustomerCartHistory(customer._id, params);
            if (res.success) {
                setHistoryData(res.data.results);
                setPagination(prev => ({ ...prev, total: res.data.totalResults }));
            }
        } catch (error) {
            console.error('Failed to fetch cart history', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const getActionStyle = (type) => {
        switch (type) {
            case 'ADD': return { bg: 'hsl(var(--success) / 0.15)', color: 'hsl(var(--success))', icon: <ArrowDownToLine size={14} /> };
            case 'REMOVE': return { bg: 'hsl(var(--destructive) / 0.15)', color: 'hsl(var(--destructive))', icon: <ArrowUpFromLine size={14} /> };
            case 'UPDATE': return { bg: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))', icon: <RefreshCcw size={14} /> };
            case 'ORDER_PLACED': return { bg: '#F3E8FF', color: '#9333EA', icon: <ShoppingBag size={14} /> }; // Purple
            default: return { bg: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))', icon: <History size={14} /> };
        }
    };

    const getRowBackground = (type) => {
        switch (type) {
            case 'ADD': return 'rgba(34, 197, 94, 0.12)'; // Solid Light Green
            case 'REMOVE': return 'rgba(239, 68, 68, 0.12)'; // Solid Light Red
            default: return 'transparent';
        }
    };

    return createPortal(
        <div className="quick-modal-overlay" onClick={(e) => { if (e.target.className === 'quick-modal-overlay') onClose(); }} style={{ zIndex: 1100 }}>
            <div className="quick-modal-container" style={{ maxWidth: '900px', height: '85vh', display: 'flex', flexDirection: 'column' }}>
                <div className="quick-modal-gradient-bar" />
                <div className="quick-modal-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
                    
                    {/* Header */}
                    <div className="quick-modal-header" style={{ padding: '1.5rem', borderBottom: '1px solid hsl(var(--border) / 0.5)' }}>
                        <div>
                            <h3 className="quick-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <History size={20} style={{ color: 'hsl(var(--primary))' }} />
                                Cart Activity Log
                            </h3>
                            <p className="quick-modal-subtitle">Tracking history for <span style={{ fontWeight: 600, color: 'hsl(var(--foreground))' }}>{customer?.name}</span></p>
                        </div>
                        <button onClick={onClose} className="quick-modal-close-btn">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Toolbar */}
                    <div style={{ padding: '1rem 1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', background: 'hsl(var(--secondary) / 0.1)', borderBottom: '1px solid hsl(var(--border) / 0.5)' }}>
                        <div className="category-search-wrapper" style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px', padding: '0 12px' }}>
                            <Search size={16} style={{ color: 'hsl(var(--muted-foreground))', marginRight: '10px', flexShrink: 0, position: 'static' }} />
                            <input
                                type="text"
                                placeholder="Search by product name..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setPagination(prev => ({ ...prev, page: 1 })); }}
                                style={{ flex: 1, padding: '0.6rem 0.5rem', background: 'transparent', border: 'none', outline: 'none', fontSize: '0.9rem', color: 'hsl(var(--foreground))', width: '100%', minWidth: 0 }}
                            />
                            {searchTerm && (
                                <RefreshCw size={14} style={{ cursor: 'pointer', color: 'hsl(var(--muted-foreground))', flexShrink: 0, marginLeft: '8px' }} onClick={() => setSearchTerm('')} />
                            )}
                        </div>

                        <div style={{ position: 'relative' }}>
                            <button 
                                className="secondary-button" 
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))', color: 'hsl(var(--foreground))', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', minWidth: '140px', justifyContent: 'space-between' }}
                            >
                                <span>{actionFilter === 'ALL' ? 'All Actions' : actionFilter === 'ADD' ? 'Additions' : actionFilter === 'REMOVE' ? 'Removals' : actionFilter === 'UPDATE' ? 'Updates' : 'Orders Placed'}</span>
                                <ChevronRight size={14} style={{ transform: isDropdownOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                            </button>
                            {isDropdownOpen && (
                                <>
                                    <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setIsDropdownOpen(false)} />
                                    <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 20, width: '100%', minWidth: '140px', overflow: 'hidden' }}>
                                        {['ALL', 'ADD', 'REMOVE', 'UPDATE', 'ORDER_PLACED'].map(filter => (
                                            <div 
                                                key={filter}
                                                onClick={() => { setActionFilter(filter); setPagination(prev => ({ ...prev, page: 1 })); setIsDropdownOpen(false); }}
                                                style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', cursor: 'pointer', background: actionFilter === filter ? 'hsl(var(--secondary))' : 'transparent', color: actionFilter === filter ? 'hsl(var(--primary))' : 'hsl(var(--foreground))', fontWeight: actionFilter === filter ? 600 : 400 }}
                                                onMouseEnter={(e) => { if(actionFilter !== filter) e.currentTarget.style.background = 'hsl(var(--secondary) / 0.5)' }}
                                                onMouseLeave={(e) => { if(actionFilter !== filter) e.currentTarget.style.background = 'transparent' }}
                                            >
                                                {filter === 'ALL' ? 'All Actions' : filter === 'ADD' ? 'Additions' : filter === 'REMOVE' ? 'Removals' : filter === 'UPDATE' ? 'Updates' : 'Orders Placed'}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Table Area */}
                    <div style={{ flex: 1, overflowY: 'auto', position: 'relative', padding: '0 1.5rem' }}>
                        {isLoading && <Loader />}
                        
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', textAlign: 'left' }}>
                            <thead style={{ position: 'sticky', top: 0, background: 'hsl(var(--background))', zIndex: 10 }}>
                                <tr>
                                    <th style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date & Time</th>
                                    <th style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Product</th>
                                    <th style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Action</th>
                                    <th style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quantity</th>
                                    <th style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historyData.length > 0 ? historyData.map((log) => {
                                    const actionStyle = getActionStyle(log.actionType);
                                    const rowBg = getRowBackground(log.actionType);
                                    return (
                                        <tr key={log._id} style={{ background: rowBg, transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }} className="history-row">
                                            <td style={{ padding: '1rem', verticalAlign: 'middle', borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px', borderTop: '1px solid hsl(var(--border) / 0.5)', borderBottom: '1px solid hsl(var(--border) / 0.5)', borderLeft: '1px solid hsl(var(--border) / 0.5)' }}>
                                                <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{new Date(log.createdAt).toLocaleDateString()}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>{new Date(log.createdAt).toLocaleTimeString()}</div>
                                            </td>
                                            <td style={{ padding: '1rem', verticalAlign: 'middle', borderTop: '1px solid hsl(var(--border) / 0.5)', borderBottom: '1px solid hsl(var(--border) / 0.5)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <img 
                                                        src={log.productId?.images?.thumbnail ? resolveImageUrl(log.productId.images.thumbnail) : 'https://via.placeholder.com/40'} 
                                                        alt=""
                                                        style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '6px', border: '1px solid hsl(var(--border) / 0.3)' }}
                                                    />
                                                    <div>
                                                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'hsl(var(--foreground))' }} className="line-clamp-1">{log.productId?.name || 'Unknown Product'}</div>
                                                        {log.variantId && <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>Var: {log.variantId.attributes?.map(a => a.value).join(', ')}</div>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem', verticalAlign: 'middle', borderTop: '1px solid hsl(var(--border) / 0.5)', borderBottom: '1px solid hsl(var(--border) / 0.5)' }}>
                                                <span style={{ 
                                                    display: 'inline-flex', alignItems: 'center', gap: '0.35rem', 
                                                    background: actionStyle.bg, color: actionStyle.color, 
                                                    padding: '0.35rem 0.6rem', borderRadius: '20px', 
                                                    fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.3px' 
                                                }}>
                                                    {actionStyle.icon}
                                                    {log.actionType}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem', verticalAlign: 'middle', borderTop: '1px solid hsl(var(--border) / 0.5)', borderBottom: '1px solid hsl(var(--border) / 0.5)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                                    {log.previousQuantity != null ? (
                                                        <>
                                                            <span style={{ color: 'hsl(var(--muted-foreground))', textDecoration: 'line-through' }}>{log.previousQuantity}</span>
                                                            <ChevronRight size={12} style={{ color: 'hsl(var(--muted-foreground))' }} />
                                                            <span style={{ fontWeight: 600 }}>{log.quantity}</span>
                                                        </>
                                                    ) : (
                                                        <span style={{ fontWeight: 600 }}>{log.quantity}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem', verticalAlign: 'middle', textAlign: 'right', fontWeight: 600, color: 'hsl(var(--primary))', borderTopRightRadius: '8px', borderBottomRightRadius: '8px', borderTop: '1px solid hsl(var(--border) / 0.5)', borderBottom: '1px solid hsl(var(--border) / 0.5)', borderRight: '1px solid hsl(var(--border) / 0.5)' }}>
                                                {log.price ? `₹${log.price}` : '-'}
                                            </td>
                                        </tr>
                                    );
                                }) : !isLoading && (
                                    <tr>
                                        <td colSpan="5">
                                            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'hsl(var(--muted-foreground))' }}>
                                                <History size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
                                                <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>No history found</p>
                                                <p style={{ fontSize: '0.9rem' }}>Try adjusting your search or filters.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.total > 0 && (
                        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid hsl(var(--border) / 0.5)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'hsl(var(--background))' }}>
                            <div style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>
                                Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    className="secondary-button"
                                    style={{ padding: '6px' }}
                                    disabled={pagination.page === 1}
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button
                                    className="secondary-button"
                                    style={{ padding: '6px' }}
                                    disabled={pagination.page * pagination.limit >= pagination.total}
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            <style>{`
                .history-row:hover {
                    background-color: hsl(var(--secondary) / 0.2) !important;
                }
            `}</style>
        </div>,
        document.body
    );
};

export default CartHistoryModal;
