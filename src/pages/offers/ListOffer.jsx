import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit3, Trash2, Image as ImageIcon, RefreshCw, Calendar, Eye, EyeOff, Tag, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import offerService from '../../services/offerService';
import { BASE_URL as SERVICE_URL } from '../../config/env';
import Loader from '../../components/Loader';
import './Offer.css';

const ListOffer = () => {
    const [offers, setOffers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
    });
    const [isRowsDropdownOpen, setIsRowsDropdownOpen] = useState(false);
    const navigate = useNavigate();

    // Get the root URL (without /v1) for images
    const ROOT_URL = SERVICE_URL.replace('/v1', '');

    useEffect(() => {
        fetchOffers();
    }, [pagination.page, pagination.limit, searchTerm]);

    const fetchOffers = async () => {
        setIsLoading(true);
        try {
            const res = await offerService.getOffers({
                page: pagination.page,
                limit: pagination.limit,
                search: searchTerm
            });
            setOffers(res.offers || []);
            setPagination(prev => ({
                ...prev,
                total: res.pagination?.total || 0,
                pages: res.pagination?.pages || 0
            }));
        } catch (error) {
            toast.error('Failed to load offer list');
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            await offerService.updateOfferStatus(id, !currentStatus);
            toast.success(`Offer ${!currentStatus ? 'Activated' : 'Deactivated'}! 🚀`);
            fetchOffers();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Delete Offer?',
            text: 'This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, Delete'
        });

        if (result.isConfirmed) {
            setIsLoading(true);
            try {
                await offerService.deleteOffer(id);
                toast.success('Offer deleted');
                fetchOffers();
            } catch (error) {
                toast.error('Deletion failed');
                setIsLoading(false);
            }
        }
    };

    return (
        <div className="offer-page-container fade-in">
            <div className="offer-glass-card power-ui absolute-unified">
                <header className="internal-page-header">
                    <div className="page-header-content">
                        <h1>Offer Management</h1>
                        <p>Create and manage {pagination.total} promotional campaigns across the platform.</p>
                    </div>
                    <div className="header-actions">
                        <button className="secondary-button" onClick={fetchOffers}>
                            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                            <span>Refresh</span>
                        </button>
                        <button className="primary-button" onClick={() => navigate('/offers/create')}>
                            <Plus size={16} /> Create Offer
                        </button>
                    </div>
                </header>

                <hr className="header-divider-internal" />

                <div className="offer-glass-card filter-card" style={{ marginBottom: '1.5rem', padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div 
                        className="offer-search-wrapper" 
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
                            placeholder="Search offers..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPagination(prev => ({ ...prev, page: 1 }));
                            }}
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

                <div className="offer-table-wrapper">
                    <table className="offer-table">
                        <thead>
                            <tr>
                                <th style={{ width: '60px' }}>S.N.</th>
                                <th>Offer Details</th>
                                <th>Discount</th>
                                <th>Schedule</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {offers.length > 0 ? offers.map((offer, index) => (
                                <tr key={offer._id} className="offer-row">
                                    <td style={{ fontWeight: '600', color: 'hsl(var(--muted-foreground))' }}>
                                        {(pagination.page - 1) * pagination.limit + index + 1}
                                    </td>
                                    <td>
                                        <div className="offer-cell-info">
                                            <div className="offer-img-preview">
                                                <img src={`${ROOT_URL}/${offer.image}`} alt="" />
                                            </div>
                                            <div>
                                                <div className="offer-title-text">{offer.title}</div>
                                                <div className="offer-id-text">ID: {offer._id.slice(-6).toUpperCase()}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="offer-discount-badge">
                                            <Tag size={12} style={{ marginRight: '4px' }} />
                                            {offer.discountValue}{offer.discountType === 'Percentage' ? '%' : ' OFF'}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="schedule-info">
                                            <div className="date-item">
                                                <Calendar size={12} />
                                                <span>{new Date(offer.startDate).toLocaleDateString()}</span>
                                            </div>
                                            {offer.expiryDate && (
                                                <div className="date-item expiry">
                                                    <Calendar size={12} />
                                                    <span>Exp: {new Date(offer.expiryDate).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div
                                            className={`status-badge ${offer.isActive ? 'active' : 'inactive'} clickable`}
                                            onClick={() => handleToggleStatus(offer._id, offer.isActive)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {offer.isActive ? <Eye size={12} /> : <EyeOff size={12} />}
                                            <span>{offer.isActive ? 'Active' : 'Hidden'}</span>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div className="offer-action-btns">
                                            <button className="action-btn" onClick={() => navigate(`/offers/edit/${offer._id}`)}>
                                                <Edit3 size={14} />
                                            </button>
                                            <button className="action-btn delete" onClick={() => handleDelete(offer._id)}>
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" className="empty-state">
                                        <ImageIcon size={48} strokeWidth={1} style={{ marginBottom: '1rem', display: 'block', margin: '0 auto' }} />
                                        <p>No offers found.</p>
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
            {isLoading && <Loader />}
        </div>
    );
};

export default ListOffer;
