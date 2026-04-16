import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FileText,
    Edit3,
    Search,
    RefreshCw,
    Plus,
    Trash2,
    AlertCircle,
    Clock
} from 'lucide-react';
import cmsService from '../../services/cmsService';
import toast from 'react-hot-toast';
import CustomDeleteModal from '../../components/UI/CustomDeleteModal';
import '../category/Category.css';

const CMSList = () => {
    const [cmsItems, setCmsItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: null });
    const navigate = useNavigate();

    useEffect(() => {
        fetchCMS();
    }, []);

    const fetchCMS = async () => {
        setIsLoading(true);
        try {
            const res = await cmsService.getAllCMS();
            if (res.success) {
                setCmsItems(res.data);
            }
        } catch (error) {
            toast.error('Failed to load CMS content');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            const res = await cmsService.deleteCMS(deleteModal.type);
            if (res.success) {
                toast.success('CMS content deleted successfully');
                setDeleteModal({ isOpen: false, type: null });
                fetchCMS();
            }
        } catch (error) {
            toast.error('Failed to delete CMS content');
        }
    };

    const filteredItems = cmsItems.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="category-page-container fade-in">
            <div className="category-content-pane">
                <header className="internal-page-header" style={{ padding: '0 0 1.5rem 0' }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>Page Management</h1>
                        <p style={{ margin: 0, color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem' }}>Create and manage static pages like About Us, Contact, and more.</p>
                    </div>
                    <div className="header-actions">
                        <button className="secondary-button" onClick={fetchCMS} style={{ padding: '0.5rem 1rem' }}>
                            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                            <span style={{ marginLeft: '6px' }}>Refresh</span>
                        </button>
                        <button className="primary-button" onClick={() => navigate('/cms/create')} style={{ padding: '0.5rem 1rem' }}>
                            <Plus size={16} /> Create Page
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
                                flex: 2,
                                transition: 'all 0.3s ease',
                                minWidth: '250px'
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
                                placeholder="Search pages by title..."
                                className="category-search-input"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
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
                    </div>
                </div>

                {isLoading ? (
                    <div className="category-glass-card" style={{ padding: '3rem', textAlign: 'center' }}>Loading...</div>
                ) : filteredItems.length === 0 ? (
                    <div className="category-glass-card" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
                        <AlertCircle size={40} style={{ margin: '0 auto 1rem', color: 'hsl(var(--muted-foreground))' }} />
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>No Content Found</h2>
                        <p style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {searchQuery ? "We couldn't find any CMS items matching your search." : "You haven't created any CMS pages yet."}
                        </p>
                    </div>
                ) : (
                    <div className="stock-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
                        {filteredItems.map((item) => (
                            <div key={item._id} className="category-glass-card" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ padding: '1.5rem', borderBottom: '1px solid hsl(var(--border) / 0.3)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'hsl(var(--primary) / 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <FileText size={20} style={{ color: 'hsl(var(--primary))' }} />
                                        </div>
                                        <span style={{ fontSize: '0.65rem', padding: '4px 10px', background: item.isActive ? '#D1FAE5' : '#FEE2E2', color: item.isActive ? '#065F46' : '#991B1B', borderRadius: '100px', fontWeight: '700', textTransform: 'uppercase' }}>
                                            {item.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: '700' }}>{item.title}</h3>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))', WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {item.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
                                    </p>
                                </div>
                                <div style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'hsl(var(--card) / 0.5)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
                                        <Clock size={14} />
                                        {new Date(item.updatedAt).toLocaleDateString()}
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button className="secondary-button" style={{ padding: '0.5rem' }} onClick={() => setDeleteModal({ isOpen: true, type: item.type })}>
                                            <Trash2 size={16} color="#EF4444" />
                                        </button>
                                        <button className="primary-button" style={{ padding: '0.5rem 1rem' }} onClick={() => navigate(`/cms/edit/${item.type}`)}>
                                            <Edit3 size={16} /> Edit
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <CustomDeleteModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, type: null })}
                onConfirm={handleDelete}
                title="Delete Page"
                message={`Are you sure you want to delete "${deleteModal.type}"? This action cannot be undone.`}
            />
        </div>
    );
};

export default CMSList;
