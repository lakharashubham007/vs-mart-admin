import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, ChevronLeft, ChevronRight, Edit, Trash2, Settings, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import deliveryConfigService from '../../services/deliveryConfigService';
import Loader from '../../components/Loader';
import '../category/Category.css';
import '../employee/Employee.css';

const DeliveryConfigList = () => {
    const [configs, setConfigs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchConfigs();
        }, 300);
        return () => clearTimeout(timer);
    }, [pagination.page, pagination.limit, searchTerm]);

    const fetchConfigs = async () => {
        setIsLoading(true);
        try {
            const data = await deliveryConfigService.getDeliveryConfigs({
                page: pagination.page,
                limit: pagination.limit,
                search: searchTerm
            });
            setConfigs(data.results || []);
            setPagination(prev => ({ ...prev, total: data.totalResults || 0 }));
        } catch (error) {
            console.error('Fetch delivery configs failed:', error);
            toast.error('Failed to load delivery zones');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Delete Delivery Zone?',
            text: 'This will permanently remove the delivery radius and its buckets.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: 'hsl(var(--destructive))',
            cancelButtonColor: 'hsl(var(--secondary))',
            confirmButtonText: 'Yes, Delete Zone',
            cancelButtonText: 'Cancel',
            background: 'hsl(var(--card))',
            color: 'hsl(var(--foreground))',
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
                await deliveryConfigService.deleteDeliveryConfig(id);
                toast.success('Zone deleted successfully');
                fetchConfigs();
            } catch (error) {
                toast.error(error.message || 'Deletion failed');
                setIsLoading(false);
            }
        }
    };

    const toggleStatus = async (id) => {
        setIsLoading(true);
        try {
            await deliveryConfigService.toggleStatus(id);
            toast.success('Status updated successfully');
            fetchConfigs();
        } catch (error) {
            toast.error(error.message || 'Failed to update status');
            setIsLoading(false);
        }
    };

    return (
        <div className="category-page-container fade-in">
            <div className="category-content-pane">
                <header className="internal-page-header" style={{ padding: '0 0 1.5rem 0' }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>Delivery Setting</h1>
                        <p style={{ margin: 0, color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem' }}>Manage delivery radiuses and dynamic pricing buckets.</p>
                    </div>
                    <div className="header-actions">
                        <button className="primary-button" onClick={() => navigate('/delivery/create')} style={{ padding: '0.5rem 1rem' }}>
                            <Plus size={18} /> Add Delivery Zone
                        </button>
                    </div>
                </header>

                <div className="category-glass-card" style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', width: '100%' }}>
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
                                placeholder="Search delivery zones by name..."
                                className="category-search-input"
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

                        {searchTerm && (
                            <button
                                className="secondary-button"
                                style={{ padding: '0.65rem', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                onClick={() => {
                                    setSearchTerm('');
                                    setPagination(prev => ({ ...prev, page: 1 }));
                                }}
                                title="Clear search"
                            >
                                <RefreshCw size={16} />
                            </button>
                        )}
                    </div>
                </div>

                <div className="category-table-wrapper">
                    <table className="category-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Max Radius (KM)</th>
                                <th>Buckets Setup</th>
                                <th>Status</th>
                                <th>Created On</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {configs.length > 0 ? configs.map((config) => (
                                <tr key={config._id} className="category-row">
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '8px',
                                                background: 'hsl(var(--primary) / 0.1)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'hsl(var(--primary))'
                                            }}>
                                                <Settings size={16} />
                                            </div>
                                            <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{config.name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{ fontWeight: '600' }}>{config.maxRadius} KM</span>
                                    </td>
                                    <td>
                                        <span style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.85rem' }}>
                                            {config.buckets?.length || 0} Buckets defined
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }} onClick={() => toggleStatus(config._id)}>
                                            {config.isActive ? (
                                                <span className="category-badge active"><CheckCircle2 size={12} /> Active</span>
                                            ) : (
                                                <span className="category-badge inactive"><XCircle size={12} /> Inactive</span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.85rem' }}>
                                            {new Date(config.createdAt).toLocaleDateString()}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="category-actions">
                                            <button
                                                className="action-btn"
                                                onClick={() => navigate(`/delivery/edit/${config._id}`)}
                                                title="Edit Config"
                                            >
                                                <Edit size={14} />
                                            </button>
                                            <button
                                                className="action-btn delete"
                                                onClick={() => handleDelete(config._id)}
                                                title="Delete Zone"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'hsl(var(--muted-foreground))' }}>
                                        No delivery zones found matching your search.
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
                                style={{ padding: '8px', minWidth: '40px' }}
                                disabled={pagination.page === 1}
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                className="secondary-button"
                                style={{ padding: '8px', minWidth: '40px' }}
                                disabled={pagination.page * pagination.limit >= pagination.total}
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
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

export default DeliveryConfigList;
