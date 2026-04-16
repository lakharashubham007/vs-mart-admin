import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FileText,
    Edit3,
    Plus,
    Trash2,
    Search,
    RefreshCw
} from 'lucide-react';
import termsService from '../../services/termsService';
import Loader from '../../components/Loader';
import toast from 'react-hot-toast';
import CustomDeleteModal from '../../components/UI/CustomDeleteModal';
import '../category/Category.css';

const TermsList = () => {
    const [terms, setTerms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, termId: null, title: '' });
    const [isDeleting, setIsDeleting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchTerms();
    }, []);

    const fetchTerms = async (showLoader = true) => {
        if (showLoader) setIsLoading(true);
        try {
            const res = await termsService.getTerms();
            if (res.success) {
                setTerms(res.data);
            }
        } catch (error) {
            toast.error('Failed to load Terms & Conditions');
        } finally {
            if (showLoader) setIsLoading(false);
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            await termsService.changeTermStatus(id, !currentStatus);
            toast.success(`Term ${!currentStatus ? 'Activated' : 'Deactivated'}`);
            fetchTerms(false);
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleDeleteClick = (id, title) => {
        setDeleteModal({ isOpen: true, termId: id, title });
    };

    const confirmDelete = async () => {
        if (!deleteModal.termId) return;
        setIsDeleting(true);
        try {
            await termsService.deleteTerm(deleteModal.termId);
            toast.success('Term deleted successfully');
            setDeleteModal({ isOpen: false, termId: null, title: '' });
            fetchTerms(false);
        } catch (error) {
            toast.error('Failed to delete Term');
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredTerms = terms.filter(term =>
        term.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (term.description && term.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (isLoading) return <Loader />;

    return (
        <div className="category-page-container fade-in">
            <div className="category-content-pane">
                <header className="internal-page-header">
                    <div>
                        <h1>Terms & Conditions</h1>
                        <p>Manage your application's terms of service and legal conditions.</p>
                    </div>
                    <div className="header-actions">
                        <button className="secondary-button" onClick={fetchTerms}>
                            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                            <span>Refresh</span>
                        </button>
                        <button className="primary-button" onClick={() => navigate('/cms/terms/create')}>
                            <Plus size={16} /> Create Terms
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
                                placeholder="Search terms..."
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

                <div className="category-table-wrapper">
                    <table className="category-table">
                        <thead>
                            <tr>
                                <th style={{ paddingLeft: '1.5rem' }}>Version Title</th>
                                <th>Description</th>
                                <th>Created Date</th>
                                <th>Active Status</th>
                                <th style={{ textAlign: 'right', paddingRight: '1.5rem' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTerms.length > 0 ? filteredTerms.map((term) => (
                                <tr key={term._id} className="category-row">
                                    <td style={{ paddingLeft: '1.5rem' }}>
                                        <div className="category-cell-name">
                                            <div className="category-img-box" style={{ 
                                                backgroundColor: term.isActive ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--muted) / 0.5)',
                                                border: 'none'
                                            }}>
                                                <FileText size={20} color={term.isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{term.title}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>ID: {term._id.slice(-8).toUpperCase()}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ 
                                            maxWidth: '300px', 
                                            fontSize: '0.9rem',
                                            color: 'hsl(var(--muted-foreground))',
                                            overflow: 'hidden', 
                                            textOverflow: 'ellipsis', 
                                            whiteSpace: 'nowrap' 
                                        }}>
                                            {term.description || 'No description provided'}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                                            {new Date(term.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <label className="switch">
                                                <input
                                                    type="checkbox"
                                                    checked={term.isActive}
                                                    onChange={() => handleToggleStatus(term._id, term.isActive)}
                                                />
                                                <span className="slider round"></span>
                                            </label>
                                            <span style={{
                                                fontSize: '0.7rem',
                                                fontWeight: '800',
                                                color: term.isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.05em'
                                            }}>
                                                {term.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ paddingRight: '1.5rem' }}>
                                        <div className="category-actions">
                                            <button
                                                className="action-btn"
                                                onClick={() => navigate(`/cms/terms/edit/${term._id}`)}
                                                title="Edit Terms"
                                            >
                                                <Edit3 size={14} />
                                            </button>
                                            <button
                                                className="action-btn delete"
                                                onClick={() => handleDeleteClick(term._id, term.title)}
                                                title="Delete Terms"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="text-center py-24">
                                        <div className="flex flex-col items-center gap-6 opacity-20">
                                            <FileText size={80} strokeWidth={1} />
                                            <div className="text-center">
                                                <h3 className="text-2xl font-black">NO TERMS</h3>
                                                <p className="text-sm">Create your first terms of service to begin.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <CustomDeleteModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, termId: null, title: '' })}
                onConfirm={confirmDelete}
                title="Delete Terms Version"
                itemName={deleteModal.title}
                isLoading={isDeleting}
            />
        </div>
    );
};

export default TermsList;
