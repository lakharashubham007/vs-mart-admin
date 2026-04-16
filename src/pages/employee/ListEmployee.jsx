import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Edit, Trash2, Mail, Shield, User, Search, Plus, ChevronLeft, ChevronRight, ChevronDown, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import employeeService from '../../services/employeeService';
import Loader from '../../components/Loader';
import { resolveImageUrl } from '../../utils/imageUtils';
import '../category/Category.css';
import './Employee.css';

const ListEmployee = () => {
    const [employees, setEmployees] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
    const [isRowsDropdownOpen, setIsRowsDropdownOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchEmployees();
        }, 300);
        return () => clearTimeout(timer);
    }, [pagination.page, pagination.limit, searchTerm]);

    const fetchEmployees = async () => {
        setIsLoading(true);
        try {
            const data = await employeeService.getEmployees({
                page: pagination.page,
                limit: pagination.limit,
                search: searchTerm
            });
            setEmployees(data.admins || []);
            setPagination(prev => ({ ...prev, total: data.pagination?.total || 0 }));
        } catch (error) {
            console.error('Fetch employees failed:', error);
            toast.error('Failed to load employee list');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Remove Staff Access?',
            text: 'This will permanently revoke all administrative privileges for this employee.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: 'hsl(var(--destructive))',
            cancelButtonColor: 'hsl(var(--secondary))',
            confirmButtonText: 'Yes, Revoke Access',
            cancelButtonText: 'Cancel',
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
                await employeeService.deleteEmployee(id);
                toast.success('Employee access revoked successfully');
                fetchEmployees();
            } catch (error) {
                toast.error(error.message || 'Deletion failed');
                setIsLoading(false);
            }
        }
    };

    // No longer filtering on frontend as it's done on the backend

    return (
        <div className="category-page-container fade-in">
            <div className="category-content-pane">
                <header className="internal-page-header" style={{ padding: '0 0 1.5rem 0' }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>Staff Management</h1>
                        <p style={{ margin: 0, color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem' }}>Manage administrative access and team roles across the enterprise.</p>
                    </div>
                    <div className="header-actions">
                        <button className="primary-button" onClick={() => navigate('/admins/create-admin')} style={{ padding: '0.5rem 1rem' }}>
                            <Plus size={18} /> Create Employee
                        </button>
                    </div>
                </header>

                <div className="category-glass-card" style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', width: '100%' }}>
                        {/* Rows Per Page Dropdown */}
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
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    marginTop: '0.5rem',
                                    background: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border) / 0.5)',
                                    borderRadius: '8px',
                                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                                    zIndex: 50,
                                    minWidth: '120px',
                                    overflow: 'hidden'
                                }}>
                                    {[10, 25, 50, 100].map(limit => (
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
                                placeholder="Find application admins..."
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

                        {/* Clear Filters Button */}
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
                                <th style={{ width: '60px' }}>S.No.</th>
                                <th>Name & Identity</th>
                                <th>Email Address</th>
                                <th>Assigned Role</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.length > 0 ? employees.map((employee, index) => (
                                <tr key={employee._id} className="category-row">
                                    <td style={{ fontWeight: '500', color: 'hsl(var(--muted-foreground))', width: '60px' }}>
                                        {(pagination.page - 1) * pagination.limit + index + 1}
                                    </td>
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
                                                color: 'hsl(var(--primary))',
                                                overflow: 'hidden'
                                            }}>
                                                {employee.profileImage ? (
                                                    <img
                                                        src={resolveImageUrl(`v1/public/admin-image/${employee._id}`)}
                                                        alt={employee.name}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                ) : (
                                                    <User size={16} />
                                                )}
                                            </div>
                                            <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{employee.name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'hsl(var(--muted-foreground))' }}>
                                            <Mail size={14} />
                                            {employee.email}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="enterprise-role-badge">
                                            <Shield size={12} />
                                            {employee.roleId?.name || 'Unassigned'}
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{ color: 'hsl(142 70% 45%)', fontSize: '0.8rem', fontWeight: '600' }}>● Active</span>
                                    </td>
                                    <td>
                                        <div className="category-actions">
                                            <button
                                                className="action-btn"
                                                onClick={() => navigate(`/admins/edit-employee/${employee._id}`)}
                                                title="Edit Details"
                                            >
                                                <Edit size={14} />
                                            </button>
                                            <button
                                                className="action-btn delete"
                                                onClick={() => handleDelete(employee._id)}
                                                title="Remove Access"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'hsl(var(--muted-foreground))' }}>
                                        No employees found matching your search.
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

export default ListEmployee;
