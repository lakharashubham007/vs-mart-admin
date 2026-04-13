import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    UserPlus, Search, ChevronLeft, ChevronRight, 
    ChevronDown, RefreshCw, Mail, Phone, MapPin, 
    Edit, Trash2, User
} from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import deliveryBoyService from '../../services/deliveryBoyService';
import Loader from '../../components/Loader';
import { BASE_URL } from '../../config/env';
import '../customer/Customer.css';

const DeliveryBoyList = () => {
    const [deliveryBoys, setDeliveryBoys] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
    const [isRowsDropdownOpen, setIsRowsDropdownOpen] = useState(false);
    
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchDeliveryBoys();
        }, 300);
        return () => clearTimeout(timer);
    }, [pagination.page, pagination.limit, searchTerm]);

    const fetchDeliveryBoys = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await deliveryBoyService.getAll({
                page: pagination.page,
                limit: pagination.limit,
                search: searchTerm
            });
            setDeliveryBoys(data.data || []);
            setPagination(prev => ({ ...prev, total: data.pagination?.total || 0 }));
        } catch {
            toast.error('Failed to load delivery boy list');
        } finally {
            setIsLoading(false);
        }
    }, [pagination.page, pagination.limit, searchTerm]);

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await deliveryBoyService.delete(id);
                toast.success('Delivery boy deleted successfully');
                fetchDeliveryBoys();
            } catch {
                toast.error('Failed to delete delivery boy');
            }
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            await deliveryBoyService.toggleStatus(id, !currentStatus);
            toast.success(`Delivery boy ${!currentStatus ? 'activated' : 'deactivated'}`);
            fetchDeliveryBoys();
        } catch {
            toast.error('Failed to update status');
        }
    };

    return (
        <div className="category-page-container fade-in">
            <div className="category-content-pane">
                <header className="internal-page-header" style={{ padding: '0 0 1.5rem 0' }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>Delivery Boy Management</h1>
                        <p style={{ margin: 0, color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem' }}>Managing {pagination.total} delivery personnel.</p>
                    </div>
                    <div className="header-actions">
                        <button className="primary-button" onClick={() => navigate('/delivery-boy/add')} style={{ padding: '0.5rem 1rem' }}>
                            <UserPlus size={18} /> Add Delivery Boy
                        </button>
                    </div>
                </header>

                <div className="category-glass-card" style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', width: '100%' }}>
                        <div style={{ position: 'relative' }}>
                            <button
                                className="secondary-button"
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1rem', background: 'hsl(var(--card))', height: '42px' }}
                                onClick={() => setIsRowsDropdownOpen(!isRowsDropdownOpen)}
                            >
                                <span style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>Rows:</span>
                                <span style={{ fontWeight: '600' }}>{pagination.limit}</span>
                                <ChevronDown size={14} className={isRowsDropdownOpen ? 'rotate-180' : ''} />
                            </button>

                            {isRowsDropdownOpen && (
                                <div className="rows-dropdown">
                                    {[10, 25, 50, 100].map(limit => (
                                        <div
                                            key={limit}
                                            className={`dropdown-item ${pagination.limit === limit ? 'selected' : ''}`}
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

                        <div className="category-search-wrapper" style={{ flex: '1', minWidth: '250px' }}>
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Search by name, email or mobile..."
                                className="category-search-input"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setPagination(prev => ({ ...prev, page: 1 }));
                                }}
                            />
                        </div>

                        {searchTerm && (
                            <button
                                className="secondary-button"
                                style={{ padding: '0.65rem', height: '42px' }}
                                onClick={() => setSearchTerm('')}
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
                                <th style={{ width: '60px' }}>S.No.</th>
                                <th>Delivery Boy</th>
                                <th>Contact Information</th>
                                <th>Location</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deliveryBoys.length > 0 ? deliveryBoys.map((boy, index) => (
                                <tr key={boy._id} className="category-row">
                                    <td style={{ fontWeight: '500', color: 'hsl(var(--muted-foreground))' }}>
                                        {(pagination.page - 1) * pagination.limit + index + 1}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div className="customer-avatar-box" style={{ overflow: 'hidden' }}>
                                                {boy.profileImage ? (
                                                    <img 
                                                        src={`${BASE_URL.replace('/v1', '')}/${boy.profileImage}`} 
                                                        alt="Profile" 
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                ) : (
                                                    <User size={16} />
                                                )}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{boy.firstName} {boy.lastName}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>Created: {new Date(boy.createdAt).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                                                <Phone size={12} className="text-muted-foreground" />
                                                {boy.mobile}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))' }}>
                                                <Mail size={12} />
                                                {boy.email}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.8rem', maxWidth: '200px' }}>
                                            <MapPin size={14} className="text-muted-foreground" style={{ marginTop: '2px' }} />
                                            <span style={{ color: 'hsl(var(--muted-foreground))' }}>{boy.address?.fullAddress}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <button 
                                            onClick={() => handleToggleStatus(boy._id, boy.status)}
                                            className={`status-badge ${boy.status ? 'active' : 'inactive'}`}
                                            style={{ border: 'none', cursor: 'pointer', background: 'transparent' }}
                                        >
                                            {boy.status ? '● Active' : '● Inactive'}
                                        </button>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div className="category-actions" style={{ justifyContent: 'flex-end' }}>
                                            <button 
                                                className="action-btn" 
                                                title="Edit"
                                                onClick={() => navigate(`/delivery-boy/edit/${boy._id}`)}
                                            >
                                                <Edit size={14} />
                                            </button>
                                            <button 
                                                className="action-btn" 
                                                style={{ color: 'hsl(var(--destructive))' }}
                                                title="Delete"
                                                onClick={() => handleDelete(boy._id)}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" className="empty-table-cell">
                                        No delivery boys found matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {pagination.total > 0 && (
                    <div className="pagination-footer">
                        <div style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>
                            Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                className="secondary-button"
                                style={{ padding: '8px' }}
                                disabled={pagination.page === 1}
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                className="secondary-button"
                                style={{ padding: '8px' }}
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

export default DeliveryBoyList;
