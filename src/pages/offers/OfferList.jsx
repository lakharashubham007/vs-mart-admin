import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    Plus, 
    Search, 
    Edit2, 
    Trash2, 
    Calendar, 
    ArrowRight,
    Tag,
    RefreshCw,
    Filter,
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    ChevronRight,
    Ticket,
    CheckCircle2,
    XCircle,
    MoreHorizontal,
    Users,
    Eye
} from 'lucide-react';
import CustomSelect from '../../components/CustomSelect';
import offerService from '../../services/offerService';
import './Offer.css';
import '../products/Product.css';
import '../category/Category.css';
import { toast } from 'react-hot-toast';
import CustomDeleteModal from '../../components/UI/CustomDeleteModal';
import OfferUsageModal from './OfferUsageModal';

const OfferList = () => {
    const navigate = useNavigate();
    const [offers, setOffers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        type: '',
        isActive: ''
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        totalResults: 0,
        totalPages: 1
    });
    const [sortBy, setSortBy] = useState('createdAt:desc');

    // Delete Modal State
    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        id: null,
        name: '',
        isLoading: false
    });
    
    const [usageModal, setUsageModal] = useState({
        isOpen: false,
        offerId: null,
        offerTitle: ''
    });

    const fetchOffers = async () => {
        setIsLoading(true);
        try {
            const response = await offerService.getOffers({ 
                search: filters.search, 
                type: filters.type,
                isActive: filters.isActive,
                page: pagination.page, 
                limit: pagination.limit,
                sortBy
            });
            if (response.success) {
                setOffers(response.data.results);
                setPagination(prev => ({
                    ...prev,
                    totalResults: response.data.totalResults,
                    totalPages: response.data.totalPages
                }));
            }
        } catch (error) {
            console.error('Error fetching offers:', error);
            toast.error('Failed to load offers');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchOffers();
        }, 300);
        return () => clearTimeout(timer);
    }, [filters, pagination.page, pagination.limit, sortBy]);

    const handleToggleStatus = async (id) => {
        try {
            const response = await offerService.toggleStatus(id);
            if (response.success) {
                toast.success(response.message || 'Status updated');
                // Optimistic UI update or refetch
                setOffers(prev => prev.map(o => o._id === id ? { ...o, isActive: !o.isActive } : o));
            }
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleDeleteClick = (offer) => {
        setDeleteModal({
            isOpen: true,
            id: offer._id,
            name: offer.title,
            isLoading: false
        });
    };

    const confirmDelete = async () => {
        setDeleteModal(prev => ({ ...prev, isLoading: true }));
        try {
            const response = await offerService.deleteOffer(deleteModal.id);
            if (response.success) {
                toast.success(response.message || 'Offer deleted successfully');
                fetchOffers();
                setDeleteModal({ isOpen: false, id: null, name: '', isLoading: false });
            }
        } catch (error) {
            toast.error('Failed to delete offer');
            setDeleteModal(prev => ({ ...prev, isLoading: false }));
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Not Set';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getDiscountDisplay = (offer) => {
        switch (offer.discountType) {
            case 'PERCENTAGE':
                return `${offer.discountValue}% OFF`;
            case 'FLAT':
            case 'Fixed': // Legacy support
                return `₹${offer.discountValue} OFF`;
            case 'FREE_PRODUCT':
                return `Free Product`;
            case 'FREE_DELIVERY':
                return `Free Delivery`;
            default:
                return 'N/A';
        }
    };

    const handleSort = (field) => {
        const [currentField, currentOrder] = sortBy.split(':');
        if (currentField === field) {
            setSortBy(`${field}:${currentOrder === 'desc' ? 'asc' : 'desc'}`);
        } else {
            setSortBy(`${field}:desc`);
        }
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    return (
        <div className="category-page-container fade-in">
            <div className="category-content-pane">
                <header className="internal-page-header">
                    <div>
                        <h1 className="flex items-center gap-2">
                            <Ticket className="text-primary" /> Offer Repository
                        </h1>
                        <p>Monitoring {pagination.totalResults} promotional assets across distribution channels.</p>
                    </div>
                    <div className="header-actions">
                        <button className="secondary-button" onClick={fetchOffers} title="Refresh Data">
                            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                            <span>Refresh</span>
                        </button>
                        <button className="primary-button" onClick={() => navigate('/offers/create')}>
                            <Plus size={16} /> Create New Offer
                        </button>
                    </div>
                </header>

                <div className="category-glass-card" style={{ marginBottom: '1.5rem' }}>
                    <div className="category-filter-bar">
                        <div className="category-search-wrapper" style={{ flex: 2 }}>
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Search by title or coupon code..."
                                className="category-search-input"
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                            />
                        </div>

                        <div className="category-filter-group">
                            <CustomSelect
                                options={[
                                    { value: '', label: 'All Types' },
                                    { value: 'OFFER', label: 'Manual Coupons' },
                                    { value: 'AUTO', label: 'Auto-Applied' }
                                ]}
                                value={filters.type}
                                onChange={(val) => setFilters(prev => ({ ...prev, type: val, page: 1 }))}
                                placeholder="Offer Type"
                            />
                        </div>

                        <div className="category-filter-group">
                            <CustomSelect
                                options={[
                                    { value: '', label: 'Any Status' },
                                    { value: 'true', label: 'Active Live' },
                                    { value: 'false', label: 'Disabled' }
                                ]}
                                value={filters.isActive}
                                onChange={(val) => setFilters(prev => ({ ...prev, isActive: val, page: 1 }))}
                                placeholder="Status"
                            />
                        </div>

                        {(filters.search || filters.type || filters.isActive) && (
                            <button
                                className="secondary-button"
                                style={{ padding: '0.65rem', height: '42px' }}
                                onClick={() => setFilters({ search: '', type: '', isActive: '' })}
                                title="Clear all filters"
                            >
                                <RefreshCw size={16} />
                            </button>
                        )}
                    </div>
                </div>

                <div className="category-table-wrapper">
                    <table className="category-table w-full">
                        <thead>
                            <tr>
                                <th onClick={() => handleSort('title')} className="cursor-pointer">
                                    <div className="flex items-center gap-1">
                                        Offer Details {sortBy.startsWith('title') && (sortBy.endsWith('desc') ? <ChevronDown size={14} /> : <ChevronUp size={14} />)}
                                    </div>
                                </th>
                                <th onClick={() => handleSort('type')} className="cursor-pointer">
                                    <div className="flex items-center gap-1">
                                        Type {sortBy.startsWith('type') && (sortBy.endsWith('desc') ? <ChevronDown size={14} /> : <ChevronUp size={14} />)}
                                    </div>
                                </th>
                                <th>Discount Structure</th>
                                <th onClick={() => handleSort('validTo')} className="cursor-pointer">
                                    <div className="flex items-center gap-1">
                                        Validity {sortBy.startsWith('validTo') && (sortBy.endsWith('desc') ? <ChevronDown size={14} /> : <ChevronUp size={14} />)}
                                    </div>
                                </th>
                                <th onClick={() => handleSort('usedCount')} className="cursor-pointer">
                                    <div className="flex items-center gap-1">
                                        Usage Analytics {sortBy.startsWith('usedCount') && (sortBy.endsWith('desc') ? <ChevronDown size={14} /> : <ChevronUp size={14} />)}
                                    </div>
                                </th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right', paddingRight: '1.5rem' }}>Management</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-24">
                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
                                        <p className="mt-4 text-gray-500 font-medium">Synchronizing Offer Data...</p>
                                    </td>
                                </tr>
                            ) : offers.length > 0 ? offers.map((offer) => (
                                <tr key={offer._id} className="category-row">
                                    <td>
                                        <div className="flex flex-col">
                                            <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>{offer.title}</span>
                                            {offer.code ? (
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="offer-code-badge">{offer.code}</span>
                                                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Manual</span>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-primary/70 font-black uppercase tracking-widest mt-1">System Auto-Apply</span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`category-badge ${offer.type === 'OFFER' ? 'active' : 'inactive'}`} style={{ fontSize: '0.7rem' }}>
                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: offer.type === 'OFFER' ? '#0ea5e9' : '#10b981' }} />
                                            {offer.type}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex flex-col gap-1">
                                            <span className="font-black text-primary text-sm">{getDiscountDisplay(offer)}</span>
                                            {offer.minOrderAmount > 0 && (
                                                <span className="text-[10px] text-muted-foreground font-bold italic">Min. Purchase: ₹{offer.minOrderAmount}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex flex-col text-xs text-gray-600">
                                            <div className="flex items-center gap-1.5 font-bold">
                                                <Calendar size={12} className="text-primary/60" /> {formatDate(offer.validFrom)}
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-1 text-muted-foreground font-medium">
                                                <ArrowRight size={12} /> {formatDate(offer.validTo)}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5 font-black text-xs text-gray-700">
                                                <Users size={12} className="text-primary/70" />
                                                <span>{offer.usedCount || 0} Redemptions</span>
                                            </div>
                                            {offer.usageLimit > 0 ? (
                                                <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1 overflow-hidden" style={{ width: '80px' }}>
                                                    <div 
                                                        className="bg-primary h-full rounded-full" 
                                                        style={{ 
                                                            width: `${Math.min(100, ((offer.usedCount || 0) / offer.usageLimit) * 100)}%`,
                                                            background: (offer.usedCount || 0) >= offer.usageLimit ? '#ef4444' : 'var(--primary)'
                                                        }} 
                                                    />
                                                </div>
                                            ) : (
                                                <span className="text-[9px] text-primary/60 font-black uppercase tracking-tighter">Unlimited Usage</span>
                                            )}
                                            {offer.usageLimit > 0 && (
                                                <span className="text-[10px] text-muted-foreground font-bold">Limit: {offer.usageLimit}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <button 
                                            onClick={() => handleToggleStatus(offer._id)}
                                            className={`category-badge ${offer.isActive ? 'active' : 'inactive'}`}
                                            style={{ cursor: 'pointer', border: 'none' }}
                                        >
                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: offer.isActive ? '#10b981' : '#ef4444' }} />
                                            {offer.isActive ? 'Live' : 'Disabled'}
                                        </button>
                                    </td>
                                    <td style={{ paddingRight: '1.5rem' }}>
                                        <div className="category-actions">
                                            <button
                                                className="action-btn"
                                                style={{ color: 'var(--primary)' }}
                                                onClick={() => setUsageModal({ isOpen: true, offerId: offer._id, offerTitle: offer.title })}
                                                title="View Usage Analytics"
                                            >
                                                <Eye size={14} />
                                            </button>
                                            <button
                                                className="action-btn"
                                                onClick={() => navigate(`/offers/edit/${offer._id}`)}
                                                title="Modify Offer"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                className="action-btn delete"
                                                onClick={() => handleDeleteClick(offer)}
                                                title="Terminate Offer"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="7" className="text-center py-24">
                                        <div className="flex flex-col items-center gap-4 opacity-40">
                                            <Ticket size={64} strokeWidth={1} />
                                            <div>
                                                <h3 className="text-xl font-black tracking-widest uppercase">No Active Promotions</h3>
                                                <p className="text-sm">Initiate a new campaign to begin driving customer conversion.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {pagination.totalResults > 0 && (
                    <div className="category-pagination-footer">
                        <div style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>
                            <span>Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.totalResults)} of {pagination.totalResults} promotions</span>
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
                                disabled={pagination.page * pagination.limit >= pagination.totalResults}
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <CustomDeleteModal 
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmDelete}
                title="Terminate Offer"
                itemName={deleteModal.name}
                isLoading={deleteModal.isLoading}
            />
            <OfferUsageModal 
                isOpen={usageModal.isOpen}
                onClose={() => setUsageModal(prev => ({ ...prev, isOpen: false }))}
                offerId={usageModal.offerId}
                offerTitle={usageModal.offerTitle}
            />
        </div>
    );
};

export default OfferList;
