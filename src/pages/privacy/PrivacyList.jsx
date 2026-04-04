import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FileText,
    Edit3,
    Plus,
    Trash2,
    Search,
    RefreshCw,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import privacyService from '../../services/privacyService';
import Loader from '../../components/Loader';
import toast from 'react-hot-toast';
import CustomDeleteModal from '../../components/UI/CustomDeleteModal';
import '../category/Category.css';

const PrivacyList = () => {
    const [privacies, setPrivacies] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, policyId: null, title: '' });
    const [isDeleting, setIsDeleting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchPrivacies();
    }, []);

    const fetchPrivacies = async (showLoader = true) => {
        if (showLoader) setIsLoading(true);
        try {
            const res = await privacyService.getPrivacies();
            if (res.success) {
                setPrivacies(res.data);
            }
        } catch (error) {
            toast.error('Failed to load Privacy Policies');
        } finally {
            if (showLoader) setIsLoading(false);
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            await privacyService.changePrivacyStatus(id, !currentStatus);
            toast.success(`Policy ${!currentStatus ? 'Activated' : 'Deactivated'}`);
            fetchPrivacies(false);
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleDeleteClick = (id, title) => {
        setDeleteModal({ isOpen: true, policyId: id, title });
    };

    const confirmDelete = async () => {
        if (!deleteModal.policyId) return;
        setIsDeleting(true);
        try {
            await privacyService.deletePrivacy(deleteModal.policyId);
            toast.success('Privacy Policy deleted successfully');
            setDeleteModal({ isOpen: false, policyId: null, title: '' });
            fetchPrivacies(false);
        } catch (error) {
            toast.error('Failed to delete Privacy Policy');
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredPrivacies = privacies.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (isLoading) return <Loader />;

    return (
        <div className="category-page-container fade-in">
            <div className="category-content-pane">
                <header className="internal-page-header">
                    <div>
                        <h1>Privacy Policy</h1>
                        <p>Manage your application's privacy policy and data protection terms.</p>
                    </div>
                    <div className="header-actions">
                        <button className="secondary-button" onClick={fetchPrivacies}>
                            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                            <span>Refresh</span>
                        </button>
                        <button className="primary-button" onClick={() => navigate('/cms/privacy-policy/create')}>
                            <Plus size={16} /> Create Policy
                        </button>
                    </div>
                </header>

                <div className="category-glass-card" style={{ marginBottom: '1.5rem' }}>
                    <div className="category-filter-bar">
                        <div className="category-search-wrapper">
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Search policies..."
                                className="category-search-input"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="category-table-wrapper">
                    <table className="category-table">
                        <thead>
                            <tr>
                                <th style={{ paddingLeft: '1.5rem' }}>Policy Version</th>
                                <th>Description</th>
                                <th>Created Date</th>
                                <th>Active Status</th>
                                <th style={{ textAlign: 'right', paddingRight: '1.5rem' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPrivacies.length > 0 ? filteredPrivacies.map((policy) => (
                                <tr key={policy._id} className="category-row">
                                    <td style={{ paddingLeft: '1.5rem' }}>
                                        <div className="category-cell-name">
                                            <div className="category-img-box" style={{ 
                                                backgroundColor: policy.isActive ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--muted) / 0.5)',
                                                border: 'none'
                                            }}>
                                                <FileText size={20} color={policy.isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{policy.title}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>ID: {policy._id.slice(-8).toUpperCase()}</div>
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
                                            {policy.description || 'No description provided'}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                                            {new Date(policy.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <label className="switch">
                                                <input
                                                    type="checkbox"
                                                    checked={policy.isActive}
                                                    onChange={() => handleToggleStatus(policy._id, policy.isActive)}
                                                />
                                                <span className="slider round"></span>
                                            </label>
                                            <span style={{
                                                fontSize: '0.7rem',
                                                fontWeight: '800',
                                                color: policy.isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.05em'
                                            }}>
                                                {policy.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ paddingRight: '1.5rem' }}>
                                        <div className="category-actions">
                                            <button
                                                className="action-btn"
                                                onClick={() => navigate(`/cms/privacy-policy/edit/${policy._id}`)}
                                                title="Edit Policy"
                                            >
                                                <Edit3 size={14} />
                                            </button>
                                            <button
                                                className="action-btn delete"
                                                onClick={() => handleDeleteClick(policy._id, policy.title)}
                                                title="Delete Policy"
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
                                                <h3 className="text-2xl font-black">NO POLICIES</h3>
                                                <p className="text-sm">Create your first privacy policy to begin.</p>
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
                onClose={() => setDeleteModal({ isOpen: false, policyId: null, title: '' })}
                onConfirm={confirmDelete}
                title="Delete Privacy Policy"
                itemName={deleteModal.title}
                isLoading={isDeleting}
            />
        </div>
    );
};

export default PrivacyList;
