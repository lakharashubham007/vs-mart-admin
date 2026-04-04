import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit3, Trash2, LayoutGrid, Layers, Filter, MoreVertical, RefreshCw, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import productService from '../../services/productService';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import QuickCreateModal from '../../components/QuickCreateModal';
import '../category/Category.css';
import Loader from '../../components/Loader';


import { BASE_IMAGE_URL as API_BASE_URL } from '../../config/env';

const ListSubcategory = () => {
    const [subcategories, setSubcategories] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editSelectedItem, setEditSelectedItem] = useState(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [isRowsDropdownOpen, setIsRowsDropdownOpen] = useState(false);

    useEffect(() => {
        fetchSubcategories();
        fetchCategories(); // Needed for the QuickCreateModal dropdown
    }, []);

    const fetchCategories = async () => {
        try {
            const data = await productService.getCategories();
            if (data.success) {
                setCategories(data.categories);
            }
        } catch (error) {
            console.error("Failed to fetch categories:", error);
        }
    };

    const fetchSubcategories = async () => {
        setIsLoading(true);
        try {
            const data = await productService.getSubcategories();
            if (data.success) {
                setSubcategories(data.subcategories);
            } else {
                toast.error(data.message || 'Failed to fetch subcategories');
            }
        } catch (error) {
            toast.error(error.message || 'Error loading subcategories');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Delete Subcategory?',
            text: "This action cannot be undone.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, Delete',
            background: 'hsl(var(--card))',
            color: 'hsl(var(--foreground))',
            backdrop: `rgba(0,0,0,0.4) blur(4px)`,
            customClass: {
                popup: 'enterprise-alert-popup',
                title: 'enterprise-alert-title',
                confirmButton: 'enterprise-alert-confirm',
                cancelButton: 'enterprise-alert-cancel'
            }
        });

        if (result.isConfirmed) {
            setIsLoading(true);
            try {
                await productService.deleteSubcategory(id);
                toast.success('Subcategory removed successfully');
                fetchSubcategories();
            } catch (error) {
                toast.error(error.message || 'Deletion failed');
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, rowsPerPage]);

    const filteredSubcategories = subcategories.filter(sub =>
        sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sub.categoryId && sub.categoryId.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const totalPages = Math.ceil(filteredSubcategories.length / rowsPerPage);
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = filteredSubcategories.slice(indexOfFirstRow, indexOfLastRow);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };


    return (
        <div className="category-page-container fade-in">
            <div className="category-content-pane">
                <header className="internal-page-header" style={{ padding: '0 0 1.5rem 0' }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>Subcategory Management</h1>
                        <p style={{ margin: 0, color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem' }}>Organize your product hierarchy with premium sub-classification tools.</p>
                    </div>
                    <div className="header-actions">
                        <button className="secondary-button" onClick={fetchSubcategories} title="Refresh Data" style={{ padding: '0.5rem 1rem' }}>
                            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                            <span style={{ marginLeft: '6px' }}>Refresh</span>
                        </button>
                        <button className="primary-button" onClick={() => {
                            setEditSelectedItem(null);
                            setIsCreateModalOpen(true);
                        }} style={{ padding: '0.5rem 1rem' }}>
                            <Plus size={16} /> Create Subcategory
                        </button>
                    </div>
                </header>

                <div className="category-glass-card" style={{ marginBottom: '1.5rem' }}>
                    <div className="category-filter-bar">
                        <div className="category-search-wrapper">
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Search by subcategory name..."
                                className="category-search-input"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button className="secondary-button" style={{ padding: '0.75rem' }}>
                            <Filter size={18} />
                        </button>

                        <div style={{ position: 'relative', marginLeft: 'auto' }}>
                            <button
                                className="secondary-button"
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'hsl(var(--card))' }}
                                onClick={() => setIsRowsDropdownOpen(!isRowsDropdownOpen)}
                            >
                                <span style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>Rows:</span>
                                <span style={{ fontWeight: '600' }}>{rowsPerPage}</span>
                                <ChevronDown size={14} style={{ color: 'hsl(var(--muted-foreground))' }} />
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
                                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                                    zIndex: 50,
                                    minWidth: '120px',
                                    overflow: 'hidden'
                                }}>
                                    {[10, 25, 50, 100].map(option => (
                                        <div
                                            key={option}
                                            style={{
                                                padding: '0.6rem 1rem',
                                                cursor: 'pointer',
                                                background: rowsPerPage === option ? 'hsl(var(--primary) / 0.1)' : 'transparent',
                                                color: rowsPerPage === option ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
                                                fontSize: '0.9rem',
                                                fontWeight: rowsPerPage === option ? '600' : '400',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between'
                                            }}
                                            onClick={() => {
                                                setRowsPerPage(option);
                                                setCurrentPage(1);
                                                setIsRowsDropdownOpen(false);
                                            }}
                                            onMouseEnter={(e) => {
                                                if (rowsPerPage !== option) e.currentTarget.style.background = 'hsl(var(--secondary) / 0.5)';
                                            }}
                                            onMouseLeave={(e) => {
                                                if (rowsPerPage !== option) e.currentTarget.style.background = 'transparent';
                                            }}
                                        >
                                            {option} rows
                                            {rowsPerPage === option && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'hsl(var(--primary))' }} />}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="category-table-wrapper">
                    <table className="category-table">
                        <thead>
                            <tr>
                                <th style={{ width: '60px' }}>S.No.</th>
                                <th>Subcategory Name & Image</th>
                                <th>Parent Category</th>
                                <th style={{ textAlign: 'right' }}>Management</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <Loader />
                                // <tr>
                                //     <td colSpan="4" style={{ textAlign: 'center', padding: '4rem 0' }}>
                                //         <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                //             <div className="loader-spinner" style={{ width: '40px', height: '40px', borderTopColor: 'hsl(var(--primary))' }}></div>
                                //             <span style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem', fontWeight: '500' }}>Loading hierarchy...</span>
                                //         </div>
                                //     </td>
                                // </tr>

                            ) : currentRows.length === 0 ? (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '4rem 0' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'hsl(var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <LayoutGrid size={32} style={{ color: 'hsl(var(--muted-foreground))' }} />
                                            </div>
                                            <div>
                                                <h3 style={{ margin: '0 0 0.5rem 0', color: 'hsl(var(--foreground))', fontSize: '1.2rem' }}>No Subcategories Found</h3>
                                                <p style={{ margin: 0, color: 'hsl(var(--muted-foreground))' }}>Get started by creating your first child category.</p>
                                            </div>
                                            <button className="primary-button" style={{ marginTop: '1rem', padding: '0.75rem 1.5rem' }} onClick={() => {
                                                setEditSelectedItem(null);
                                                setIsCreateModalOpen(true);
                                            }}>
                                                <Plus size={18} /> Create Subcategory
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                currentRows.map((sub, index) => (
                                    <tr key={sub._id} className="category-row">
                                        <td style={{ textAlign: 'center', color: 'hsl(var(--muted-foreground))', fontWeight: '500' }}>
                                            {indexOfFirstRow + index + 1}
                                        </td>
                                        <td>
                                            <div className="category-cell-name">
                                                <div className="category-img-box">
                                                    {sub.image ? (
                                                        <img src={`${API_BASE_URL}/${sub.image}`} alt={sub.name} crossOrigin="anonymous" />
                                                    ) : (
                                                        <Layers size={20} className="text-muted-foreground" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{sub.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>ID: {sub._id.slice(-6).toUpperCase()}</div>
                                                </div>
                                            </div>
                                        </td>

                                        <td>
                                            {sub.categoryId ? (
                                                <span className="parent-category-tag">{sub.categoryId.name}</span>
                                            ) : (
                                                <span style={{ color: 'hsl(var(--destructive))', fontSize: '0.85rem' }}>Orphaned</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="category-actions">
                                                <button
                                                    className="action-btn"
                                                    onClick={() => {
                                                        setEditSelectedItem(sub);
                                                        setIsCreateModalOpen(true);
                                                    }}
                                                    title="Edit Subcategory"
                                                >
                                                    <Edit3 size={14} />
                                                </button>
                                                <button
                                                    className="action-btn delete"
                                                    onClick={() => handleDelete(sub._id)}
                                                    title="Delete Subcategory"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* Pagination Controls */}
                    {!isLoading && filteredSubcategories.length > 0 && (
                        <div className="pagination-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderTop: '1px solid hsl(var(--border) / 0.1)' }}>
                            <div style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>
                                <span>Showing {indexOfFirstRow + 1} to {Math.min(indexOfLastRow, filteredSubcategories.length)} of {filteredSubcategories.length} entries</span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    className="secondary-button"
                                    style={{ padding: '8px', minWidth: '40px' }}
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button
                                    className="secondary-button"
                                    style={{ padding: '8px', minWidth: '40px' }}
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

            </div>

            <QuickCreateModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                type="Subcategory"
                masters={{ categories }}
                editItem={editSelectedItem}
                onSuccess={() => {
                    fetchSubcategories();
                    setIsCreateModalOpen(false);
                    setEditSelectedItem(null);
                }}
            />
        </div>
    );
};

export default ListSubcategory;
