import React, { useState, useEffect, useCallback } from 'react';
import { 
    Search, RefreshCw, ChevronLeft, ChevronRight, 
    Truck, Package, CheckCircle2, ShoppingBag,
    User, MapPin, Phone, ExternalLink, Filter, Map as MapIcon,
    Banknote, X, ChevronDown, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import deliveryBoyService from '../../services/deliveryBoyService';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/Loader';
import DeliveryMapModal from '../../components/DeliveryMapModal';
import { BASE_IMAGE_URL } from '../../config/env';
import './DeliveryAssignmentList.css';

const DeliveryAssignmentList = () => {
    const { user } = useAuth();
    const [assignments, setAssignments] = useState([]);
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
    const [showMap, setShowMap] = useState(false);
    const [selectedMapId, setSelectedMapId] = useState(null);
    const [isCODModalOpen, setIsCODModalOpen] = useState(false);
    const [pendingAssignment, setPendingAssignment] = useState(null);
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const statusDropdownRef = React.useRef(null);

    const isAdmin = ['Super Admin', 'Admin', 'Shop Admin'].includes(user?.roleId?.name || user?.role);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            // Parallel fetch for stats and assignments
            const [assignmentsData, statsData] = await Promise.all([
                deliveryBoyService.getAssignments({
                    page: pagination.page,
                    limit: pagination.limit,
                    status: filterStatus,
                    search: searchTerm
                }),
                isAdmin ? deliveryBoyService.getAssignmentStats() : Promise.resolve(null)
            ]);

            setAssignments(assignmentsData.data || []);
            setPagination(prev => ({ ...prev, total: assignmentsData.pagination?.total || 0 }));
            if (statsData) setStats(statsData.data);
        } catch (error) {
            toast.error('Failed to load assignments');
        } finally {
            setIsLoading(false);
        }
    }, [pagination.page, pagination.limit, filterStatus, searchTerm, isAdmin]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
                setIsStatusDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const timer = setTimeout(fetchData, 300);
        return () => clearTimeout(timer);
    }, [fetchData]);

    const handleUpdateStatus = async (assign, newStatus) => {
        // COD Confirmation Guard - Open Custom Modal instead of window.confirm
        if (newStatus === 'DELIVERED' && assign.orderId?.paymentMethod === 'COD') {
            setPendingAssignment(assign);
            setIsCODModalOpen(true);
            return;
        }

        performStatusUpdate(assign._id, newStatus);
    };

    const performStatusUpdate = async (id, newStatus) => {
        try {
            setIsLoading(true);
            await deliveryBoyService.updateAssignmentStatus(id, newStatus);
            toast.success(`Assignment updated to ${newStatus}`);
            fetchData();
        } catch (error) {
            toast.error(error.message || 'Update failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="category-page-container fade-in">
            <div className="category-content-pane">
                <header className="internal-page-header">
                    <div className="header-title">
                        <h1 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>Assignment Management</h1>
                        <p style={{ margin: 0, color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem' }}>
                            {isAdmin ? "Overseeing fleet operations and delivery lifecycle." : "Manage your daily delivery queue and updates."}
                        </p>
                    </div>
                    <div className="header-actions" style={{ display: 'flex', gap: '0.75rem' }}>
                        {!isAdmin && (
                            <button className="vg-map-btn" onClick={() => setShowMap(true)}>
                                <MapIcon size={16} /> Pickup Map
                            </button>
                        )}
                        <button className="secondary-button" onClick={fetchData} title="Refresh Data">
                            <RefreshCw size={16} className={isLoading ? 'spin' : ''} />
                            <span style={{ marginLeft: '6px' }}>Refresh</span>
                        </button>
                    </div>
                </header>

                {showMap && (
                    <DeliveryMapModal 
                        initialId={selectedMapId} 
                        onClose={() => {
                            setShowMap(false);
                            setSelectedMapId(null);
                        }} 
                    />
                )}

                {isAdmin && stats && (
                    <div className="premium-stats-grid">
                        <div className="premium-stat-card glass shadow-sm">
                            <div className="p-card-accent primary"></div>
                            <div className="p-card-body">
                                <div className="p-card-icon"><ShoppingBag size={24} /></div>
                                <div className="p-card-content">
                                    <h3>Total Orders</h3>
                                    <div className="p-card-val">{stats.totalOrders}</div>
                                </div>
                            </div>
                        </div>
                        <div className="premium-stat-card glass shadow-sm">
                            <div className="p-card-accent warning"></div>
                            <div className="p-card-body">
                                <div className="p-card-icon"><Truck size={24} /></div>
                                <div className="p-card-content">
                                    <h3>Out For Delivery</h3>
                                    <div className="p-card-val">{stats.outForDelivery}</div>
                                </div>
                            </div>
                        </div>
                        <div className="premium-stat-card glass shadow-sm">
                            <div className="p-card-accent success"></div>
                            <div className="p-card-body">
                                <div className="p-card-icon"><CheckCircle2 size={24} /></div>
                                <div className="p-card-content">
                                    <h3>Delivered</h3>
                                    <div className="p-card-val">{stats.deliveredCount}</div>
                                </div>
                            </div>
                        </div>
                        <div className="premium-stat-card glass shadow-sm">
                            <div className="p-card-accent info"></div>
                            <div className="p-card-body">
                                <div className="p-card-icon"><User size={24} /></div>
                                <div className="p-card-content">
                                    <h3>Active Boys</h3>
                                    <div className="p-card-val">{stats.totalBoys}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="category-glass-card" style={{ marginBottom: '1.5rem' }}>
                    <div className="category-filter-bar">
                        <div className="category-search-wrapper" style={{ flex: '1' }}>
                            <Search size={18} />
                            <input 
                                type="text" 
                                placeholder="Search order # or boy..." 
                                className="category-search-input"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="category-filter-group" style={{ minWidth: '200px' }} ref={statusDropdownRef}>
                            <div className="custom-theme-dropdown">
                                <button 
                                    className={`dropdown-trigger ${isStatusDropdownOpen ? 'active' : ''}`}
                                    onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                                >
                                    <div className="trigger-content">
                                        <Filter size={16} className="trigger-icon" />
                                        <span>{filterStatus || 'All Statuses'}</span>
                                    </div>
                                    <ChevronDown size={14} className={`chevron-icon ${isStatusDropdownOpen ? 'rotate' : ''}`} />
                                </button>
                                
                                {isStatusDropdownOpen && (
                                    <div className="dropdown-menu scale-in">
                                        {[
                                            { label: 'All Statuses', value: '' },
                                            { label: 'Assigned', value: 'ASSIGNED' },
                                            { label: 'Picked up', value: 'PICKED' },
                                            { label: 'Delivered', value: 'DELIVERED' }
                                        ].map((opt) => (
                                            <button 
                                                key={opt.value}
                                                className={`dropdown-item ${filterStatus === opt.value ? 'selected' : ''}`}
                                                onClick={() => {
                                                    setFilterStatus(opt.value);
                                                    setIsStatusDropdownOpen(false);
                                                }}
                                            >
                                                <span>{opt.label}</span>
                                                {filterStatus === opt.value && <Check size={14} />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="category-table-wrapper">
                    <table className="category-table">
                        <thead>
                             <tr style={{ background: 'hsl(var(--secondary) / 0.5)' }}>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', fontWeight: '700', width: '22%' }}>ORDER DETAILS</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', fontWeight: '700', width: '22%' }}>DESTINATION</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', fontWeight: '700', width: '12%' }}>AMOUNT</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', fontWeight: '700', width: '12%' }}>CONTACT</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', fontWeight: '700', width: '12%' }}>STATUS</th>
                                <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', fontWeight: '700', width: '20%' }}>{isAdmin ? 'DELIVERY BOY' : 'ACTIONS'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assignments.length > 0 ? assignments.map((assign) => (
                                <tr key={assign._id} className="order-row">
                                    <td>
                                        <div className="order-id-cell">
                                            <span className="order-id-text">#{assign.orderNumber}</span>
                                            <span style={{ fontSize: '0.8rem', display: 'block', fontWeight: '600' }}>{assign.customerName}</span>
                                            <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>Assigned: {new Date(assign.assignedAt).toLocaleDateString()}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="address-cell">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                                                <MapPin size={12} />
                                                <span className="address-text-limited" title={assign.deliveryAddress.fullAddress}>
                                                    {assign.deliveryAddress.fullAddress}
                                                </span>
                                            </div>
                                             {(assign.deliveryAddress.latitude && assign.deliveryAddress.longitude) && (
                                                <button 
                                                    className="map-link-btn"
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--primary))', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 0' }}
                                                    onClick={() => {
                                                        setSelectedMapId(assign._id);
                                                        setShowMap(true);
                                                    }}
                                                >
                                                    <ExternalLink size={10} /> Track on Map
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: '800', color: 'hsl(var(--primary))' }}>RS {assign.orderId?.finalAmount || assign.orderId?.totalAmount || '0'}</div>
                                        <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>{assign.orderId?.paymentMethod}</div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '600' }}>
                                            <Phone size={12} />
                                            {assign.orderId?.shippingAddress?.phone || 'N/A'}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${assign.status.toLowerCase()}`}>
                                            {assign.status}
                                        </span>
                                    </td>
                                     <td style={{ textAlign: 'right' }}>
                                        <div className="action-cell-right">
                                            {/* Action set for both Admins and Delivery Boys (if they use this panel) */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                                                {assign.status === 'ASSIGNED' && (
                                                    <button 
                                                        className="status-action-btn pickup"
                                                        onClick={() => handleUpdateStatus(assign, 'PICKED')}
                                                        style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                                                    >
                                                        Confirm Pickup
                                                    </button>
                                                )}
                                                {assign.status === 'PICKED' && (
                                                    <button 
                                                        className="status-action-btn deliver"
                                                        onClick={() => handleUpdateStatus(assign, 'DELIVERED')}
                                                        style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                                                    >
                                                        Mark Delivered
                                                    </button>
                                                )}
                                                {assign.status === 'DELIVERED' && (
                                                    <div className="completion-tag" style={{ fontSize: '0.75rem' }}>
                                                        <CheckCircle2 size={12} /> Journey Complete
                                                    </div>
                                                )}

                                                {isAdmin && (
                                                    <div className="agent-assignment-info" style={{ marginTop: '8px', borderTop: '1px solid hsl(var(--border)/0.2)', paddingTop: '4px', width: '100%', justifyContent: 'flex-end' }}>
                                                        <div className="agent-name-text" style={{ fontSize: '0.7rem' }}>{assign.deliveryBoyName}</div>
                                                        <div className="agent-avatar-small" style={{ width: '18px', height: '18px', fontSize: '0.65rem' }}>
                                                            {assign.deliveryBoyName.charAt(0)}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center', padding: '5rem' }}>
                                        <div style={{ opacity: 0.5 }}>
                                            <ShoppingBag size={48} style={{ marginBottom: '1rem', marginInline: 'auto' }} />
                                            <p>{isLoading ? "Syncing data..." : "No delivery assignments found."}</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {pagination.total > 0 && (
                    <div className="pagination-footer" style={{ borderTop: 'none' }}>
                        <div style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>
                            Showing {(pagination.page-1)*pagination.limit + 1} to {Math.min(pagination.page*pagination.limit, pagination.total)} of {pagination.total} assignments
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="secondary-button" disabled={pagination.page === 1} onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}>
                                <ChevronLeft size={16} />
                            </button>
                            <span style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', fontWeight: '700', fontSize: '0.9rem' }}>
                                {pagination.page} / {pagination.totalPages}
                            </span>
                            <button className="secondary-button" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}>
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* COD Confirmation Modal */}
            {isCODModalOpen && pendingAssignment && (
                <div className="fixed-overlay fade-in">
                    <div className="cod-confirmation-card glass shadow-xl scale-in">
                        <div className="cod-modal-header">
                            <div className="cod-icon-wrapper">
                                <Banknote size={32} color="hsl(var(--primary))" />
                            </div>
                            <button className="close-modal-btn" onClick={() => setIsCODModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="cod-modal-body">
                            <h2 className="cod-modal-title">Payment Collection</h2>
                            <p className="cod-modal-subtitle">
                                This is a <strong>Cash on Delivery</strong> order. Please confirm that you have collected the cash from the customer.
                            </p>
                            
                            <div className="amount-collection-box">
                                <span className="amount-label">COLLECT CASH</span>
                                <div className="amount-value">
                                    <span className="currency-symbol">RS</span>
                                    {pendingAssignment.orderId?.finalAmount || pendingAssignment.orderId?.totalAmount}
                                </div>
                                <div className="order-ref">Order #{pendingAssignment.orderNumber}</div>
                            </div>
                        </div>

                        <div className="cod-modal-footer">
                            <button 
                                className="cancel-modal-btn" 
                                onClick={() => setIsCODModalOpen(false)}
                            >
                                Not yet
                            </button>
                            <button 
                                className="confirm-collection-btn"
                                onClick={() => {
                                    setIsCODModalOpen(false);
                                    performStatusUpdate(pendingAssignment._id, 'DELIVERED');
                                }}
                            >
                                <CheckCircle2 size={18} />
                                Collected & Delivered
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isLoading && <Loader />}
        </div>
    );
};

export default DeliveryAssignmentList;
