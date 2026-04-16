import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    UserPlus, Search, Plus, ChevronLeft, ChevronRight, 
    ChevronDown, RefreshCw, Mail, Phone, User, 
    Calendar, CheckCircle2, X, Trash2, Edit 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { createPortal } from 'react-dom';
import customerService from '../../services/customerService';
import Loader from '../../components/Loader';
import '../category/Category.css';
import '../employee/Employee.css';
import './Customer.css';

const ListCustomer = () => {
    const [customers, setCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
    const [isRowsDropdownOpen, setIsRowsDropdownOpen] = useState(false);
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    
    // Register Form State
    const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCustomers();
        }, 300);
        return () => clearTimeout(timer);
    }, [pagination.page, pagination.limit, searchTerm]);

    const fetchCustomers = async () => {
        setIsLoading(true);
        try {
            const data = await customerService.getCustomers({
                page: pagination.page,
                limit: pagination.limit,
                search: searchTerm
            });
            setCustomers(data.data?.users || []);
            setPagination(prev => ({ ...prev, total: data.data?.pagination?.total || 0 }));
        } catch (error) {
            console.error('Fetch customers failed:', error);
            toast.error('Failed to load customer list');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.phone) {
            return toast.error('Name and Phone are required');
        }
        
        setIsSubmitting(true);
        try {
            await customerService.registerCustomer(formData);
            toast.success('Customer registered successfully');
            setIsRegisterModalOpen(false);
            setFormData({ name: '', phone: '', email: '' });
            fetchCustomers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="category-page-container fade-in">
            <div className="category-content-pane">
                <header className="internal-page-header" style={{ padding: '0 0 1.5rem 0' }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>Customer Repository</h1>
                        <p style={{ margin: 0, color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem' }}>Monitoring {pagination.total} registered mobile app users.</p>
                    </div>
                    <div className="header-actions">
                        <button className="primary-button" onClick={() => setIsRegisterModalOpen(true)} style={{ padding: '0.5rem 1rem' }}>
                            <UserPlus size={18} /> Register Customer
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
                                placeholder="Search by name, email or mobile..."
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
                                <th>Customer Identity</th>
                                <th>Contact Information</th>
                                <th>Registration Date</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.length > 0 ? customers.map((customer, index) => (
                                <tr key={customer._id} className="category-row">
                                    <td style={{ fontWeight: '500', color: 'hsl(var(--muted-foreground))' }}>
                                        {(pagination.page - 1) * pagination.limit + index + 1}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div className="customer-avatar-box">
                                                <User size={16} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{customer.name || 'Anonymous'}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>ID: {customer._id.slice(-8).toUpperCase()}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                                                <Phone size={12} className="text-muted-foreground" />
                                                {customer.phone}
                                            </div>
                                            {customer.email && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))' }}>
                                                    <Mail size={12} />
                                                    {customer.email}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                            <Calendar size={14} className="text-muted-foreground" />
                                            {new Date(customer.createdAt).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${customer.status ? 'active' : 'inactive'}`}>
                                            {customer.status ? '● Verified' : '● Pending'}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div className="category-actions" style={{ justifyContent: 'flex-end' }}>
                                            <button className="action-btn" title="View Details">
                                                <Plus size={14} />
                                            </button>
                                            <button className="action-btn" title="Edit Profile">
                                                <Edit size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" className="empty-table-cell">
                                        No customers found matching your criteria.
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

            {isRegisterModalOpen && createPortal(
                <div className="quick-modal-overlay" onClick={(e) => { if (e.target.className === 'quick-modal-overlay') setIsRegisterModalOpen(false); }}>
                    <div className="quick-modal-container" style={{ maxWidth: '450px' }}>
                        <div className="quick-modal-gradient-bar" />
                        <div className="quick-modal-content">
                            <div className="quick-modal-header">
                                <div>
                                    <h3 className="quick-modal-title">
                                        <UserPlus size={20} style={{ color: 'hsl(var(--primary))' }} />
                                        Register Customer
                                    </h3>
                                    <p className="quick-modal-subtitle">Manually add a new user to the system.</p>
                                </div>
                                <button onClick={() => setIsRegisterModalOpen(false)} className="quick-modal-close-btn">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleRegisterSubmit} className="quick-modal-form">
                                <div className="quick-modal-form-group">
                                    <label className="quick-modal-label">Full Name</label>
                                    <div className="input-with-icon">
                                        <User size={16} />
                                        <input 
                                            type="text" 
                                            placeholder="Enter customer name"
                                            className="quick-modal-input"
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="quick-modal-form-group">
                                    <label className="quick-modal-label">Mobile Number</label>
                                    <div className="input-with-icon">
                                        <Phone size={16} />
                                        <input 
                                            type="text" 
                                            placeholder="Enter mobile number"
                                            className="quick-modal-input"
                                            value={formData.phone}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                                setFormData({...formData, phone: value});
                                            }}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="quick-modal-form-group">
                                    <label className="quick-modal-label">Email Address (Optional)</label>
                                    <div className="input-with-icon">
                                        <Mail size={16} />
                                        <input 
                                            type="email" 
                                            placeholder="Enter email address"
                                            className="quick-modal-input"
                                            value={formData.email}
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <button 
                                    type="submit" 
                                    className="quick-modal-submit-btn"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Registering...' : 'Complete Registration'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {isLoading && <Loader />}
        </div>
    );
};

export default ListCustomer;
