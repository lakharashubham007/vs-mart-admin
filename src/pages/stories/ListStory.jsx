import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit3, Trash2, Video, RefreshCw, ChevronLeft, ChevronRight, ChevronDown, Calendar, Eye, EyeOff, PlayCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import storyService from '../../services/storyService';
import { BASE_URL as SERVICE_URL, BASE_IMAGE_URL } from '../../config/env';
import Loader from '../../components/Loader';
import './Story.css';

const ListStory = () => {
    const [stories, setStories] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
    const [isRowsDropdownOpen, setIsRowsDropdownOpen] = useState(false);
    const navigate = useNavigate();

    // Helper to resolve media URLs (handles local server vs Cloudinary)
    const resolveMediaUrl = (path) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        
        const cleanPath = path.replace(/^\//, '');
        // If it looks like a Cloudinary path
        if (cleanPath.includes('vsmart/') || cleanPath.startsWith('thumbnail-') || cleanPath.startsWith('image-')) {
            return `https://res.cloudinary.com/dlucla0js/image/upload/q_auto,f_jpg/${cleanPath}`;
        }
        // Otherwise use the local base image URL
        return `${BASE_IMAGE_URL}/${cleanPath}`;
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchStories();
        }, 300);
        return () => clearTimeout(timer);
    }, [pagination.page, pagination.limit, searchTerm]);

    const fetchStories = async () => {
        setIsLoading(true);
        try {
            const res = await storyService.getStories({
                page: pagination.page,
                limit: pagination.limit,
                search: searchTerm
            });
            setStories(res.data || []);
            setPagination(prev => ({
                ...prev,
                total: res.pagination?.total || 0,
                pages: res.pagination?.pages || 0
            }));
        } catch (error) {
            toast.error('Failed to load stories');
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            await storyService.updateStory(id, { isActive: !currentStatus });
            toast.success(`Story ${!currentStatus ? 'Activated' : 'Deactivated'}! 🚀`);
            fetchStories();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Delete Story?',
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
                await storyService.deleteStory(id);
                toast.success('Story deleted');
                fetchStories();
            } catch (error) {
                toast.error('Deletion failed');
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <div className="category-page-container fade-in">
            <div className="category-content-pane absolute-unified power-ui">
                <header className="internal-page-header">
                    <div className="page-header-content">
                        <h1>Stories Management</h1>
                        <p>Create and manage 24h auto-expiring stories (image/video).</p>
                    </div>
                    <div className="header-actions">
                        <button className="secondary-button" onClick={fetchStories}>
                            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                            <span>Refresh</span>
                        </button>
                        <button className="primary-button" onClick={() => navigate('/stories/create')}>
                            <Plus size={16} /> Create Story
                        </button>
                    </div>
                </header>

                <hr className="header-divider-internal" />

                <div className="banner-glass-card filter-card" style={{ marginBottom: '1.5rem', padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div 
                        className="banner-search-wrapper" 
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
                            placeholder="Search stories..."
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

                <div className="banner-table-wrapper">
                    <table className="banner-table">
                        <thead>
                            <tr>
                                <th>Preview & Title</th>
                                <th>Type & Duration</th>
                                <th>Expiry</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stories.length > 0 ? stories.map((story) => {
                                const previewMedia = story.mediaType === 'video' ? (story.thumbnail || story.media) : story.media;
                                const previewUrl = resolveMediaUrl(previewMedia);

                                return (
                                    <tr key={story._id} className="banner-row">
                                        <td>
                                            <div className="banner-cell-info">
                                                <div className="banner-img-preview" style={{ width: '45px', height: '80px', borderRadius: '8px', position: 'relative', overflow: 'hidden', backgroundColor: 'hsl(var(--secondary) / 0.2)' }}>
                                                    <img 
                                                        src={previewUrl} 
                                                        alt="" 
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                                        onError={(e) => {
                                                            e.target.src = 'https://placehold.co/45x80?text=No+Img';
                                                        }}
                                                    />
                                                    {story.mediaType === 'video' && (
                                                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                                                            <Video size={14} color="#fff" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="banner-title-text">{story.title || 'Untitled Story'}</div>
                                                    <div className="banner-id-text">ID: {story._id.slice(-6).toUpperCase()}</div>
                                                </div>
                                            </div>
                                        </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '600' }}>
                                                {story.mediaType === 'video' ? <Video size={14} /> : <PlayCircle size={14} />}
                                                <span style={{ textTransform: 'capitalize' }}>{story.mediaType}</span>
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
                                                Duration: {story.duration}s
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="schedule-info">
                                            <div className="date-item expiry">
                                                <Calendar size={12} />
                                                <span>Exp: {new Date(story.expireAt).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div
                                            className={`status-badge ${story.isActive ? 'active' : 'inactive'} clickable`}
                                            onClick={() => handleToggleStatus(story._id, story.isActive)}
                                            style={{ cursor: 'pointer' }}
                                            title="Click to toggle status"
                                        >
                                            {story.isActive ? <Eye size={12} /> : <EyeOff size={12} />}
                                            <span>{story.isActive ? 'Active' : 'Hidden'}</span>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div className="banner-actions" style={{ justifyContent: 'flex-end' }}>
                                            <button className="action-btn" onClick={() => navigate(`/stories/edit/${story._id}`)}>
                                                <Edit3 size={14} />
                                            </button>
                                            <button className="action-btn delete" onClick={() => handleDelete(story._id)}>
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                    );
                                }) : (
                                <tr>
                                    <td colSpan="5" className="empty-state">
                                        <Video size={48} strokeWidth={1} style={{ marginBottom: '1rem', display: 'block', margin: '0 auto' }} />
                                        <p>No stories found.</p>
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

export default ListStory;
