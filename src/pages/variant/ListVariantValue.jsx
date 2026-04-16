import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit3, Trash2, Filter, RefreshCw, ChevronLeft, ChevronRight, ChevronDown, ListTree, ArrowLeft } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import productService from '../../services/productService';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import QuickCreateModal from '../../components/QuickCreateModal';
import '../category/Category.css';
import Loader from '../../components/Loader';

const ListVariantValue = () => {
    const { attributeId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const attribute = location.state?.attribute || { name: 'Attribute', _id: attributeId };

    const [values, setValues] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editSelectedItem, setEditSelectedItem] = useState(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [isRowsDropdownOpen, setIsRowsDropdownOpen] = useState(false);

    useEffect(() => {
        fetchValues();
    }, [attributeId]);

    const fetchValues = async () => {
        setIsLoading(true);
        try {
            const data = await productService.getVariantValues(attributeId);
            if (data.success) {
                setValues(data.variantValues);
            } else {
                toast.error(data.message || 'Failed to fetch values');
            }
        } catch (error) {
            toast.error(error.message || 'Error loading values');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Delete Value?',
            text: "This mapping will be removed from all related variants.",
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
                await productService.deleteVariantValue(id);
                toast.success('Value removed successfully');
                fetchValues();
            } catch (error) {
                toast.error(error.message || 'Deletion failed');
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, rowsPerPage]);

    const filteredValues = values.filter(val =>
        val.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredValues.length / rowsPerPage);
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = filteredValues.slice(indexOfFirstRow, indexOfLastRow);

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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <button
                                onClick={() => navigate('/variants')}
                                style={{ background: 'transparent', border: 'none', color: 'hsl(var(--muted-foreground))', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.85rem', cursor: 'pointer', padding: 0 }}
                                onMouseEnter={(e) => e.target.style.color = 'hsl(var(--primary))'}
                                onMouseLeave={(e) => e.target.style.color = 'hsl(var(--muted-foreground))'}
                            >
                                <ArrowLeft size={14} /> Back to Attributes
                            </button>
                            <span style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.85rem' }}>/</span>
                            <span style={{ fontWeight: '600', color: 'hsl(var(--primary))', fontSize: '0.85rem' }}>{attribute.name}</span>
                        </div>
                        <h1>Variant Values</h1>
                        <p>Manage specific values like sizes (S, M, L) or colors (#000, #FFF) for attributes.</p>
                    </div>
                    <div className="header-actions">
                        <button className="secondary-button" onClick={fetchValues} title="Refresh Data">
                            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                            <span>Refresh</span>
                        </button>
                        <button className="primary-button" onClick={() => {
                            setEditSelectedItem(null);
                            setIsCreateModalOpen(true);
                        }}>
                            <Plus size={16} /> Create Value
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
                                placeholder={`Search for ${attribute.name.toLowerCase()} value...`}
                                className="category-search-input"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
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
                                <th>Value Name</th>
                                <th>Sort Order</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Management</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="5">
                                        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                                            <Loader />
                                        </div>
                                    </td>
                                </tr>
                            ) : currentRows.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '4rem 0' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'hsl(var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <ListTree size={32} style={{ color: 'hsl(var(--muted-foreground))' }} />
                                            </div>
                                            <div>
                                                <h3 style={{ margin: '0 0 0.5rem 0', color: 'hsl(var(--foreground))', fontSize: '1.2rem' }}>No Values Found</h3>
                                                <p style={{ margin: 0, color: 'hsl(var(--muted-foreground))' }}>Add your first option for "{attribute.name}".</p>
                                            </div>
                                            <button className="primary-button" style={{ marginTop: '1rem', padding: '0.75rem 1.5rem' }} onClick={() => {
                                                setEditSelectedItem(null);
                                                setIsCreateModalOpen(true);
                                            }}>
                                                <Plus size={18} /> Create Value
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                currentRows.map((val, index) => (
                                    <tr key={val._id} className="category-row">
                                        <td style={{ textAlign: 'center', color: 'hsl(var(--muted-foreground))', fontWeight: '500' }}>
                                            {indexOfFirstRow + index + 1}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                                {attribute.inputType === 'Color Picker' && val.colorCode && (
                                                    <div style={{
                                                        width: '20px',
                                                        height: '20px',
                                                        borderRadius: '50%',
                                                        background: val.colorCode,
                                                        border: '1px solid hsl(var(--border))',
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                    }} />
                                                )}
                                                <div>
                                                    <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{val.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>ID: {val._id.slice(-6).toUpperCase()}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: '600', color: 'hsl(var(--muted-foreground))' }}>
                                                {val.sortOrder || 0}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="category-status-pill" style={{
                                                background: val.status ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--muted) / 0.5)',
                                                color: val.status ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'
                                            }}>
                                                {val.status ? 'Active' : 'Inactive'}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="category-actions">
                                                <button
                                                    className="action-btn"
                                                    onClick={() => {
                                                        setEditSelectedItem(val);
                                                        setIsCreateModalOpen(true);
                                                    }}
                                                    title="Edit Value"
                                                >
                                                    <Edit3 size={14} />
                                                </button>
                                                <button
                                                    className="action-btn delete"
                                                    onClick={() => handleDelete(val._id)}
                                                    title="Delete Value"
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

                    {!isLoading && filteredValues.length > 0 && (
                        <div className="category-pagination-footer">
                            <div className="pagination-info">
                                <span>Showing {indexOfFirstRow + 1} to {Math.min(indexOfLastRow, filteredValues.length)} of {filteredValues.length} entries</span>
                            </div>
                            <div className="pagination-controls">
                                <button
                                    className="secondary-button"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button
                                    className="secondary-button"
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
                type="Value"
                masters={{ variantTypeId: attributeId, inputType: attribute.inputType }}
                editItem={editSelectedItem}
                onSuccess={() => {
                    fetchValues();
                    setIsCreateModalOpen(false);
                    setEditSelectedItem(null);
                }}
            />
        </div>
    );
};

export default ListVariantValue;
