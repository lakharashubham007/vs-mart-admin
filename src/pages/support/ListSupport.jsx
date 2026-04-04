import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit3, Trash2, RefreshCw, HelpCircle, ChevronLeft, ChevronRight, ChevronDown, Phone, Mail, Globe, Instagram, Facebook, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import CustomDeleteModal from '../../components/UI/CustomDeleteModal';
import supportService from '../../services/supportService';
import Loader from '../../components/Loader';
import '../category/Category.css';

const ICON_MAP = {
    Phone, Mail, Globe, Instagram, Facebook, HelpCircle, MessageSquare
};

const ListSupport = () => {
    const [supportOptions, setSupportOptions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, supportId: null, title: '' });
    const [isDeleting, setIsDeleting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [isRowsDropdownOpen, setIsRowsDropdownOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchSupport();
    }, []);

    const fetchSupport = async (showLoader = true) => {
        if (showLoader) setIsLoading(true);
        try {
            const data = await supportService.getAllSupport();
            setSupportOptions(data || []);
        } catch (error) {
            toast.error('Failed to load support options');
        } finally {
            if (showLoader) setIsLoading(false);
        }
    };

    const handleDeleteClick = (id, title) => {
        setDeleteModal({ isOpen: true, supportId: id, title });
    };

    const confirmDelete = async () => {
        if (!deleteModal.supportId) return;
        setIsDeleting(true);
        try {
            await supportService.deleteSupport(deleteModal.supportId);
            toast.success('Support option deleted');
            setDeleteModal({ isOpen: false, supportId: null, title: '' });
            fetchSupport(false);
        } catch (error) {
            toast.error('Deletion failed');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            await supportService.changeSupportStatus(id, !currentStatus);
            toast.success(`Option ${!currentStatus ? 'Activated' : 'Hidden'}`);
            fetchSupport(false);
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const filteredOptions = supportOptions.filter(o =>
        o.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.value.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredOptions.length / rowsPerPage);
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentOptions = filteredOptions.slice(indexOfFirstRow, indexOfLastRow);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    if (isLoading && supportOptions.length === 0) return <Loader />;

    return (
        <div className="category-page-container fade-in">
            <div className="category-content-pane">
                <header className="internal-page-header">
                    <div>
                        <h1>Support Management</h1>
                        <p>Manage help desk links and contact channels for customers.</p>
                    </div>
                    <div className="header-actions">
                        <button className="secondary-button" onClick={() => fetchSupport()}>
                            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                            <span>Refresh</span>
                        </button>
                        <button className="primary-button" onClick={() => navigate('/cms/support-us/create')}>
                            <Plus size={16} /> Add Method
                        </button>
                    </div>
                </header>

                <div className="category-glass-card" style={{ marginBottom: '1.5rem' }}>
                    <div className="category-filter-bar">
                        <div className="category-search-wrapper">
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Search support methods..."
                                className="category-search-input"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="category-table-wrapper">
                    <table className="category-table">
                        <thead>
                            <tr>
                                <th style={{ paddingLeft: '1.5rem' }}>Method Configuration</th>
                                <th>Contact Value</th>
                                <th>Order</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right', paddingRight: '1.5rem' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentOptions.length > 0 ? currentOptions.map((option) => {
                                const IconComp = ICON_MAP[option.icon] || HelpCircle;
                                return (
                                    <tr key={option._id} className="category-row">
                                        <td style={{ paddingLeft: '1.5rem' }}>
                                            <div className="category-cell-name">
                                                <div className="category-img-box" style={{ 
                                                    backgroundColor: option.bgColor || 'rgba(30, 132, 73, 0.1)',
                                                    border: 'none',
                                                    width: '42px',
                                                    height: '42px'
                                                }}>
                                                    <IconComp size={20} color={option.color || '#1e8449'} />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{option.title}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>Icon: {option.icon}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: '700', color: 'hsl(var(--foreground))', fontSize: '0.9rem' }}>{option.value}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{option.url}</div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: '800', color: 'hsl(var(--primary))', fontSize: '0.9rem' }}>#{option.displayOrder}</div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <label className="switch">
                                                    <input
                                                        type="checkbox"
                                                        checked={option.isActive}
                                                        onChange={() => handleToggleStatus(option._id, option.isActive)}
                                                    />
                                                    <span className="slider round"></span>
                                                </label>
                                                <span style={{
                                                    fontSize: '0.7rem',
                                                    fontWeight: '800',
                                                    color: option.isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {option.isActive ? 'Active' : 'Hidden'}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ paddingRight: '1.5rem' }}>
                                            <div className="category-actions">
                                                <button
                                                    className="action-btn"
                                                    onClick={() => navigate(`/cms/support-us/edit/${option._id}`)}
                                                    title="Edit Method"
                                                >
                                                    <Edit3 size={14} />
                                                </button>
                                                <button
                                                    className="action-btn delete"
                                                    onClick={() => handleDeleteClick(option._id, option.title)}
                                                    title="Delete Method"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan="5" className="text-center py-24">
                                        <div className="flex flex-col items-center gap-6 opacity-20">
                                            <HelpCircle size={80} strokeWidth={1} />
                                            <div className="text-center">
                                                <h3 className="text-2xl font-black">NO METHODS</h3>
                                                <p className="text-sm">Configure your first support method to help users.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {filteredOptions.length > 0 && (
                    <div className="category-pagination-footer">
                        <div style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>
                            <span>Showing {indexOfFirstRow + 1} to {Math.min(indexOfLastRow, filteredOptions.length)} of {filteredOptions.length} entries</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ position: 'relative' }}>
                                <button
                                    className="secondary-button"
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.8rem', height: '36px' }}
                                    onClick={() => setIsRowsDropdownOpen(!isRowsDropdownOpen)}
                                >
                                    <span style={{ fontSize: '0.8rem' }}>{rowsPerPage} rows</span>
                                    <ChevronDown size={14} className={isRowsDropdownOpen ? 'rotate-180' : ''} />
                                </button>
                                {isRowsDropdownOpen && (
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '100%',
                                        right: 0,
                                        marginBottom: '0.5rem',
                                        background: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border) / 0.5)',
                                        borderRadius: '8px',
                                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                                        zIndex: 50,
                                        minWidth: '100px',
                                        overflow: 'hidden'
                                    }}>
                                        {[5, 10, 20, 50].map(num => (
                                            <div
                                                key={num}
                                                style={{
                                                    padding: '0.6rem 1rem',
                                                    cursor: 'pointer',
                                                    background: rowsPerPage === num ? 'hsl(var(--primary) / 0.1)' : 'transparent',
                                                    color: rowsPerPage === num ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
                                                    fontSize: '0.85rem',
                                                    fontWeight: rowsPerPage === num ? '600' : '400',
                                                }}
                                                onClick={() => {
                                                    setRowsPerPage(num);
                                                    setCurrentPage(1);
                                                    setIsRowsDropdownOpen(false);
                                                }}
                                            >
                                                {num} rows
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    className="secondary-button"
                                    style={{ padding: '0.4rem', borderRadius: '6px' }}
                                    disabled={currentPage === 1}
                                    onClick={() => handlePageChange(currentPage - 1)}
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button
                                    className="secondary-button"
                                    style={{ padding: '0.4rem', borderRadius: '6px' }}
                                    disabled={currentPage === totalPages}
                                    onClick={() => handlePageChange(currentPage + 1)}
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <CustomDeleteModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, supportId: null, title: '' })}
                onConfirm={confirmDelete}
                title="Delete Support Option"
                itemName={deleteModal.title}
                isLoading={isDeleting}
            />
        </div>
    );
};

export default ListSupport;
