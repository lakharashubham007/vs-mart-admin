import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Plus, 
    Search, 
    MoreVertical, 
    Edit, 
    Trash2, 
    ExternalLink, 
    Eye, 
    EyeOff, 
    Filter,
    Calendar,
    Home,
    Gift,
    ImageIcon,
    LayoutGrid,
    Tag
} from 'lucide-react';
import toast from 'react-hot-toast';
import bannerService from '../../services/bannerService';
import Loader from '../../components/Loader';
import { BASE_IMAGE_URL } from '../../config/env';
import './Banner.css';


const ListBanner = () => {
    const navigate = useNavigate();
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('ALL');
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 });

    const fetchBanners = async (page = 1, type = '') => {
        setLoading(true);
        try {
            const params = { 
                page, 
                limit: 10, 
                search: searchTerm,
                type: type === 'ALL' ? '' : type
            };
            const response = await bannerService.getBanners(params);
            if (response.success) {
                setBanners(response.banners);
                setPagination(response.pagination);
            }
        } catch (error) {
            toast.error('Failed to fetch banners');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchBanners(1, activeTab);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, activeTab]);

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            await bannerService.updateBannerStatus(id, !currentStatus);
            toast.success(`Banner ${!currentStatus ? 'activated' : 'deactivated'}!`);
            fetchBanners(pagination.page, activeTab);
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this banner permanently?')) return;
        try {
            await bannerService.deleteBanner(id);
            toast.success('Banner deleted successfully');
            fetchBanners(pagination.page, activeTab);
        } catch (error) {
            toast.error('Failed to delete banner');
        }
    };

    return (
        <div className="banner-page-container fade-in">
            <div className="banner-content-pane absolute-unified power-ui">
                <header className="banner-header-section">

                    <div className="page-header-content">
                        <h1>Banner Management</h1>
                        <p>Control and monitor all active promotions across your ecosystem.</p>
                    </div>
                    <div className="header-actions">
                        <button className="primary-button" onClick={() => navigate('/create-banner')}>
                            <Plus size={18} /> New Banner
                        </button>
                    </div>
                </header>

                <hr className="header-divider-internal" />

                {/* Filter Bar */}
                <div className="banner-list-toolbar">
                    <div className="list-tabs">
                        <button className={`tab-btn ${activeTab === 'ALL' ? 'active' : ''}`} onClick={() => setActiveTab('ALL')}>All Banners</button>
                        <button className={`tab-btn ${activeTab === 'HOME_BANNER' ? 'active' : ''}`} onClick={() => setActiveTab('HOME_BANNER')}><Home size={14} /> Home</button>
                        <button className={`tab-btn ${activeTab === 'OFFER_BANNER' ? 'active' : ''}`} onClick={() => setActiveTab('OFFER_BANNER')}><Gift size={14} /> Offers</button>
                    </div>
                    <div className="search-box-wrapper">
                        <Search size={16} className="search-icon" />
                        <input 
                            type="text" 
                            placeholder="Search by title or link..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader /></div> : (
                    <div className="banner-grid-layout">
                        {banners.length === 0 ? (
                            <div className="empty-state-card">
                                <ImageIcon size={48} strokeWidth={1} />
                                <h3>No Banners Found</h3>
                                <p>Start by creating a new banner to drive more engagement.</p>
                            </div>
                        ) : (
                            banners.map((banner) => (
                                <div key={banner._id} className={`banner-list-card ${!banner.isActive ? 'is-disabled' : ''}`}>

                                    <div className="banner-card-image">
                                        <img 
                                            src={banner.image?.startsWith('http') ? banner.image : `${BASE_IMAGE_URL}/${banner.image?.replace(/^\//, '')}`} 
                                            alt={banner.title} 
                                            onError={(e) => {
                                                if (e.target.src !== 'https://via.placeholder.com/800x400?text=Graphic+Not+Found') {
                                                    e.target.src = 'https://via.placeholder.com/800x400?text=Graphic+Not+Found';
                                                }
                                            }}
                                        />
                                        <div className="banner-type-badge">
                                            {banner.type === 'OFFER_BANNER' ? <Gift size={12} /> : <Home size={12} />}
                                            {banner.type ? (banner.type === 'HOME_BANNER' ? 'Home' : 'Offer') : 'Home'}
                                        </div>
                                    </div>
                                    <div className="banner-card-details">
                                        <div className="banner-card-header">
                                            <div className="title-area">
                                                <div className="type-label-tiny" style={{ color: banner.isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}>
                                                    {banner.type === 'OFFER_BANNER' ? 'OFFER PLACEMENT' : 'HOME PLACEMENT'} • {banner.isActive ? 'LIVE' : 'DRAFT'}
                                                </div>
                                                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: '0.1rem 0' }}>{banner.title}</h3>
                                            </div>
                                            <div className="banner-card-actions" style={{ display: 'flex', gap: '0.4rem' }}>
                                                <button className="action-btn edit" onClick={() => navigate(`/edit-banner/${banner._id}`)} title="Edit" style={{ width: '30px', height: '30px' }}><Edit size={14} /></button>
                                                <button className="action-btn delete" onClick={() => handleDelete(banner._id)} title="Delete" style={{ width: '30px', height: '30px' }}><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                        
                                        <div className="banner-info-row" style={{ marginTop: '0.25rem', marginBottom: '0.5rem' }}>
                                            <div className="info-item" style={{ fontSize: '0.75rem' }}>
                                                <Tag size={12} color="hsl(var(--primary))" />
                                                <span>{banner.linkType || 'No Link'}</span>
                                            </div>
                                            <div className="info-item" style={{ fontSize: '0.75rem' }}>
                                                <Calendar size={12} />
                                                <span>{new Date(banner.publishDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
                                            </div>
                                            {banner.linkId && banner.linkType !== 'None' && (
                                                <div className="info-item" style={{ fontSize: '0.75rem', marginLeft: 'auto', opacity: 0.7 }}>
                                                    <LayoutGrid size={12} />
                                                    <span>ID: {banner.linkId.substring(0, 5)}...</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="banner-card-footer" style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid hsl(var(--border) / 0.1)' }}>
                                            <button 
                                                className={`toggle-status-btn ${banner.isActive ? 'is-active' : ''}`}
                                                onClick={() => handleToggleStatus(banner._id, banner.isActive)}
                                                style={{ 
                                                    width: '100%', 
                                                    justifyContent: 'center', 
                                                    height: '38px', 
                                                    fontSize: '0.8rem',
                                                    borderRadius: '12px',
                                                    background: banner.isActive ? 'hsl(var(--destructive) / 0.05)' : 'hsl(var(--primary) / 0.05)',
                                                    color: banner.isActive ? 'hsl(var(--destructive))' : 'hsl(var(--primary))',
                                                    borderColor: banner.isActive ? 'hsl(var(--destructive) / 0.1)' : 'hsl(var(--primary) / 0.1)'
                                                }}
                                            >
                                                {banner.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                                                {banner.isActive ? 'Deactivate Banner' : 'Activate Banner'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ListBanner;
