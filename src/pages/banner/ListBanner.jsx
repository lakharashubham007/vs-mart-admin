import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit3, Trash2, Image as ImageIcon, RefreshCw, ChevronLeft, ChevronRight, ChevronDown, Calendar, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import bannerService from '../../services/bannerService';
import { BASE_URL as SERVICE_URL } from '../../config/env';
import Loader from '../../components/Loader';
import CustomSelect from '../../components/CustomSelect';
import './Banner.css';

const ListBanner = () => {
    const [banners, setBanners] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
    const [isRowsDropdownOpen, setIsRowsDropdownOpen] = useState(false);
    const navigate = useNavigate();

    // Get the root URL (without /v1) for images
    const ROOT_URL = SERVICE_URL.replace('/v1', '');

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchBanners();
        }, 300);
        return () => clearTimeout(timer);
    }, [pagination.page, pagination.limit, searchTerm]);

    const fetchBanners = async () => {
        setIsLoading(true);
        try {
            const res = await bannerService.getBanners({
                page: pagination.page,
                limit: pagination.limit,
                search: searchTerm
            });
            setBanners(res.banners || []);
            setPagination(prev => ({
                ...prev,
                total: res.pagination?.total || 0,
                pages: res.pagination?.pages || 0
            }));
        } catch (error) {
            toast.error('Failed to load banner list');
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            await bannerService.updateBannerStatus(id, !currentStatus);
            toast.success(`Banner ${!currentStatus ? 'Activated' : 'Deactivated'}! 🚀`);
            fetchBanners();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Delete Banner?',
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
                await bannerService.deleteBanner(id);
                toast.success('Banner deleted');
                fetchBanners();
            } catch (error) {
                toast.error('Deletion failed');
                setIsLoading(false);
            }
        }
    };

    return (
        <div className="category-page-container fade-in">
            <div className="category-content-pane absolute-unified power-ui">
                <header className="internal-page-header">
                    <div className="page-header-content">
                        <h1>Banner Management</h1>
                        <p>Manage home screen dynamic banners and promotions.</p>
                    </div>
                    <div className="header-actions">
                        <button className="secondary-button" onClick={fetchBanners}>
                            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                            <span>Refresh</span>
                        </button>
                        <button className="primary-button" onClick={() => navigate('/banners/create')}>
                            <Plus size={16} /> Create Banner
                        </button>
                    </div>
                </header>

                <hr className="header-divider-internal" />

                <div className="banner-glass-card filter-card" style={{ marginBottom: '1.5rem', padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div className="banner-search-wrapper" style={{ flex: 1 }}>
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search banners..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPagination(prev => ({ ...prev, page: 1 }));
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

                <div className="banner-table-wrapper">
                    <table className="banner-table">
                        <thead>
                            <tr>
                                <th>Preview & Title</th>
                                <th>Schedule</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {banners.length > 0 ? banners.map((banner) => (
                                <tr key={banner._id} className="banner-row">
                                    <td>
                                        <div className="banner-cell-info">
                                            <div className="banner-img-preview">
                                                <img src={`${ROOT_URL}/${banner.image}`} alt="" />
                                            </div>
                                            <div>
                                                <div className="banner-title-text">{banner.title}</div>
                                                <div className="banner-id-text">ID: {banner._id.slice(-6).toUpperCase()}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="schedule-info">
                                            <div className="date-item">
                                                <Calendar size={12} />
                                                <span>{new Date(banner.publishDate).toLocaleDateString()}</span>
                                            </div>
                                            {banner.expiryDate && (
                                                <div className="date-item expiry">
                                                    <Calendar size={12} />
                                                    <span>Exp: {new Date(banner.expiryDate).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div
                                            className={`status-badge ${banner.isActive ? 'active' : 'inactive'} clickable`}
                                            onClick={() => handleToggleStatus(banner._id, banner.isActive)}
                                            style={{ cursor: 'pointer' }}
                                            title="Click to toggle status"
                                        >
                                            {banner.isActive ? <Eye size={12} /> : <EyeOff size={12} />}
                                            <span>{banner.isActive ? 'Active' : 'Hidden'}</span>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div className="banner-actions" style={{ justifyContent: 'flex-end' }}>
                                            <button className="action-btn" onClick={() => navigate(`/banners/edit/${banner._id}`)}>
                                                <Edit3 size={14} />
                                            </button>
                                            <button className="action-btn delete" onClick={() => handleDelete(banner._id)}>
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" className="empty-state">
                                        <ImageIcon size={48} strokeWidth={1} style={{ marginBottom: '1rem', display: 'block', margin: '0 auto' }} />
                                        <p>No banners found.</p>
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

export default ListBanner;
