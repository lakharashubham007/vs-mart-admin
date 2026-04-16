import React, { useState, useEffect, useCallback } from 'react';
import {
    Search,
    Filter,
    Eye,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Clock,
    CheckCircle2,
    Package,
    Truck,
    XCircle,
    User,
    Calendar,
    ShoppingBag
} from 'lucide-react';
import toast from 'react-hot-toast';
import orderService from '../../services/orderService';
import CustomSelect from '../../components/CustomSelect';
import OrderDetailsModal from './OrderDetailsModal';
import Loader from '../../components/Loader';
import { useSocket } from '../../context/SocketContext';
import '../category/Category.css';
import './ListOrders.css';

const ListOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalOrders, setTotalOrders] = useState(0);
    const [activeTab, setActiveTab] = useState('All'); // All, Pending, InProgress, Completed, Cancelled
    const [isRowsDropdownOpen, setIsRowsDropdownOpen] = useState(false);

    // Modal state
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Shared socket from context
    const { newOrderEvent, clearNewOrderEvent, newNotifEvent } = useSocket();

    const statusTabs = [
        { id: 'All', label: 'All Orders', icon: <ShoppingBag size={16} /> },
        { id: 'Pending', label: 'Pending', icon: <Clock size={16} /> },
        { id: 'InProgress', label: 'In Progress', icon: <Package size={16} /> },
        { id: 'Delivered', label: 'Completed', icon: <CheckCircle2 size={16} /> },
        { id: 'Cancelled', label: 'Cancelled', icon: <XCircle size={16} /> }
    ];

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            let statusFilter = activeTab;
            // Map 'InProgress' to multiple backend statuses if needed, 
            // but for now the backend handles single status or 'All'
            const res = await orderService.getOrders({
                page: currentPage,
                limit: limit,
                status: statusFilter === 'All' ? '' : statusFilter,
                search: searchTerm
            });
            setOrders(res.orders || []);
            setTotalOrders(res.total || 0);
        } catch (error) {
            console.error('Fetch orders failed:', error);
            toast.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    }, [currentPage, limit, activeTab, searchTerm]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchOrders();
        }, 500); // 500ms debounce
        return () => clearTimeout(timer);
    }, [searchTerm, currentPage, limit, activeTab]);

    // React to new orders broadcast from the shared socket
    useEffect(() => {
        if (!newOrderEvent) return;
        // Add to list if on page 1 and relevant tab
        if (currentPage === 1 && (activeTab === 'All' || activeTab === 'Pending')) {
            setOrders(prev => {
                if (prev.some(o => o._id === newOrderEvent._id)) return prev;
                return [newOrderEvent, ...prev];
            });
            setTotalOrders(prev => prev + 1);
        }
        clearNewOrderEvent();
    }, [newOrderEvent, currentPage, activeTab, clearNewOrderEvent]);

    // React to order status updates (via newNotifEvent)
    useEffect(() => {
        if (!newNotifEvent) return;
        // Re-fetch to get updated statuses if an order status changed
        fetchOrders();
    }, [newNotifEvent, fetchOrders]);

    const handleViewDetails = (id) => {
        setSelectedOrderId(id);
        setIsModalOpen(true);
    };

    const totalPages = Math.ceil(totalOrders / limit);

    return (
        <div className="category-page-container fade-in">
            <div className="category-content-pane">
                <header className="internal-page-header" style={{ padding: '0 0 1.5rem 0' }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>Order Management</h1>
                        <p style={{ margin: 0, color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem' }}>Track and manage all customer orders across your platform.</p>
                    </div>
                    <div className="header-actions">
                        <button className="secondary-button" onClick={fetchOrders} style={{ padding: '0.5rem 1rem' }}>
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            <span style={{ marginLeft: '6px' }}>Refresh</span>
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
                                flex: 1,
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <Search 
                                size={18} 
                                style={{ 
                                    color: 'hsl(var(--muted-foreground))', 
                                    flexShrink: 0,
                                    position: 'static', // Override any absolute positioning from CSS
                                    marginRight: '10px' // Shift the text more to the right
                                }} 
                            />
                            <input
                                type="text"
                                placeholder="Search by Order ID or Customer..."
                                className="category-search-input"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem 0', // Remove internal padding as wrapper/icon handle it
                                    background: 'transparent',
                                    border: 'none',
                                    outline: 'none',
                                    color: 'hsl(var(--foreground))',
                                    fontSize: '0.95rem'
                                }}
                            />
                        </div>

                        <div className="category-filter-group" style={{ minWidth: '180px' }}>
                            <CustomSelect
                                options={[
                                    { value: 'All', label: 'All Status' },
                                    { value: 'Pending', label: 'Pending' },
                                    { value: 'InProgress', label: 'In Progress' },
                                    { value: 'Delivered', label: 'Delivered' },
                                    { value: 'Cancelled', label: 'Cancelled' }
                                ]}
                                value={activeTab}
                                onChange={(val) => { setActiveTab(val); setCurrentPage(1); }}
                                placeholder="Filter Status"
                            />
                        </div>
                    </div>
                </div>

                <div className="category-table-wrapper">
                    <table className="category-table">
                        <thead>
                            <tr style={{ background: 'hsl(var(--secondary) / 0.5)' }}>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', fontWeight: '700' }}>ORDER ID</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', fontWeight: '700' }}>CUSTOMER</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', fontWeight: '700' }}>DATE</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', fontWeight: '700' }}>AMOUNT</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', fontWeight: '700' }}>STATUS</th>
                                <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', fontWeight: '700' }}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!loading && orders.length > 0 ? orders.map((order) => (
                                <tr key={order._id} className="order-row">
                                    <td>
                                        <div className="order-id-cell">
                                            <span className="order-id-text">#{order.orderId}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="customer-cell">
                                            <div className="customer-avatar">
                                                {order.userId?.name?.charAt(0) || <User size={16} />}
                                            </div>
                                            <div>
                                                <div className="customer-name">{order.userId?.name || 'Guest User'}</div>
                                                <div className="customer-phone">{order.userId?.phone || order.shippingAddress?.phone}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="order-time-text">
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <div className="amount-text">RS{order.finalAmount?.toFixed(2)}</div>
                                            <span className={`payment-badge ${(order.paymentStatus === 'PAID' || order.paymentStatus === 'Completed') ? 'paid' : 'pending'}`}>
                                                {order.paymentMethod === 'Online' ? 'PAID' : order.paymentMethod}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${order.orderStatus?.toLowerCase()}`}>
                                            {order.orderStatus}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="order-actions" style={{ justifyContent: 'flex-end' }}>
                                            <button
                                                className="action-btn view"
                                                title="Quick View"
                                                onClick={() => handleViewDetails(order._id)}
                                            >
                                                <Eye size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : !loading && (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '5rem' }}>
                                        <div style={{ opacity: 0.5 }}>
                                            <ShoppingBag size={48} style={{ marginBottom: '1rem', marginInline: 'auto' }} />
                                            <p>No orders found in this category.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalOrders > 0 && (
                    <div className="pagination-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderTop: '1px solid hsl(var(--border) / 0.3)' }}>
                        <div style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>
                            Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, totalOrders)} of {totalOrders} orders
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                className="secondary-button"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', fontWeight: '700', fontSize: '0.9rem' }}>
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                className="secondary-button"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <OrderDetailsModal
                    orderId={selectedOrderId}
                    onClose={() => setIsModalOpen(false)}
                    onUpdate={fetchOrders}
                />
            )}

            {loading && <Loader />}
        </div>
    );
};

export default ListOrders;
