import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { BASE_IMAGE_URL } from '../../config/env';
import {
    X,
    User,
    MapPin,
    Phone,
    CreditCard,
    ShoppingBag,
    Truck,
    Calendar,
    ChevronRight,
    ChevronLeft,
    Package,
    CheckCircle2,
    XCircle,
    Clock,
    Copy,
    ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import orderService from '../../services/orderService';
import Loader from '../../components/Loader';
import './OrderDetailsModal.css';

// Safe rupee symbol constant — avoids file encoding issues with ₹
const RS = 'RS';

// Linear order pipeline â€” status can only move one step at a time
const ORDER_PIPELINE = ['Placed', 'Confirmed', 'Processing', 'OutForDelivery', 'Delivered'];

const OrderDetailsModal = ({ orderId, onClose, onUpdate }) => {
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await orderService.getOrderDetails(orderId);
                setOrder(res.order || res); // Handle different response shapes
            } catch (error) {
                toast.error('Failed to load order details');
                onClose();
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [orderId, onClose]);

    const handleStatusChange = async (newStatus) => {
        setUpdating(true);
        try {
            await orderService.updateOrderStatus(orderId, newStatus);
            toast.success(`Order marked as ${newStatus}`);
            onUpdate();
            // Refetch details to show latest status in modal
            const res = await orderService.getOrderDetails(orderId);
            setOrder(res.order || res);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return <div className="modal-overlay"><Loader /></div>;
    if (!order) return null;

    const currentStatus = order.orderStatus;
    const currentIndex = ORDER_PIPELINE.indexOf(currentStatus);
    const isCancelled = currentStatus === 'Cancelled';
    const isDelivered = currentStatus === 'Delivered';

    // Orders only move FORWARD — no going back
    const nextStatus = !isCancelled && !isDelivered && currentIndex < ORDER_PIPELINE.length - 1
        ? ORDER_PIPELINE[currentIndex + 1]
        : null;
    const canCancel = !isCancelled && !isDelivered;

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Placed': return <Clock size={16} />;
            case 'Confirmed': return <CheckCircle2 size={16} />;
            case 'Processing': return <Package size={16} />;
            case 'OutForDelivery': return <Truck size={16} />;
            case 'Delivered': return <CheckCircle2 size={16} />;
            case 'Cancelled': return <XCircle size={16} />;
            default: return <Clock size={16} />;
        }
    };

    const modalContent = (
        <div className="modal-overlay" onClick={onClose}>
            <div className="order-details-modal fade-in-up" onClick={e => e.stopPropagation()}>
                <header className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <h2>Order #{order.orderId}</h2>
                        <span className={`status-badge ${order.orderStatus?.toLowerCase()}`}>
                            {getStatusIcon(order.orderStatus)}
                            {order.orderStatus}
                        </span>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </header>

                <div className="modal-content">
                    <div className="order-grid">
                        {/* Customer Info */}
                        <div className="section-card">
                            <div className="section-head">
                                <User size={18} />
                                Customer Details
                            </div>
                            <div className="info-row">
                                <span className="info-label">Name</span>
                                <span className="info-value">{order.userId?.name || order.shippingAddress?.receiverName}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Phone</span>
                                <span className="info-value">{order.userId?.phone || order.shippingAddress?.phone}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Email</span>
                                <span className="info-value">{order.userId?.email || 'N/A'}</span>
                            </div>
                        </div>

                        {/* Shipping Address */}
                        <div className="section-card">
                            <div className="section-head">
                                <MapPin size={18} />
                                Delivery Address
                            </div>
                            <div style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
                                <div style={{ fontWeight: '700' }}>{order.shippingAddress?.receiverName}</div>
                                <div>{order.shippingAddress?.flatNo}, {order.shippingAddress?.area}</div>
                                <div>{order.shippingAddress?.landmark ? `${order.shippingAddress.landmark}, ` : ''}{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}</div>
                                <div style={{ marginTop: '0.5rem', color: 'hsl(var(--primary))', fontWeight: '600' }}>
                                    Type: {order.shippingAddress?.addressType}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="order-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                        {/* Payment Info */}
                        <div className="section-card">
                            <div className="section-head">
                                <CreditCard size={18} />
                                Payment Information
                            </div>
                            <div className="info-row">
                                <span className="info-label">Method</span>
                                <span className="info-value">{order.paymentMethod}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Status</span>
                                <span className="info-value" style={{ color: order.paymentStatus === 'Completed' ? '#166534' : '#B45309' }}>
                                    {order.paymentStatus}
                                </span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Order Date</span>
                                <span className="info-value">{new Date(order.createdAt).toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Order Timeline */}
                        <div className="section-card">
                            <div className="section-head">
                                <Clock size={18} />
                                Order Placement
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>
                                This order was placed on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}.
                                It is currently in the <strong>{order.orderStatus}</strong> stage.
                            </div>
                        </div>
                    </div>

                    {/* Order Items */}
                    <div className="items-section">
                        <div className="section-head" style={{ marginBottom: '1.5rem' }}>
                            <ShoppingBag size={18} />
                            Order Items ({order.items?.length})
                        </div>
                        <table className="order-items-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Price</th>
                                    <th>Qty</th>
                                    <th style={{ textAlign: 'right' }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.items?.map((item, idx) => (
                                    <tr key={idx}>
                                        <td>
                                            <div className="item-info">
                                                {item.image || item.productId?.images?.thumbnail ? (
                                                    <img
                                                        src={item.image
                                                            ? (item.image.startsWith('http') ? item.image : `http://localhost:5000/${item.image}`)
                                                            : (item.productId?.images?.thumbnail?.startsWith('http') ? item.productId.images.thumbnail : `http://localhost:5000/${item.productId.images.thumbnail}`)
                                                        }
                                                        alt={item.name}
                                                        className="item-img"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.style.display = 'none';
                                                            const placeholder = e.target.parentElement.querySelector('.item-img-placeholder');
                                                            if (placeholder) placeholder.style.display = 'flex';
                                                        }}
                                                    />
                                                ) : null}
                                                <div
                                                    className="item-img-placeholder"
                                                    style={{
                                                        display: item.image ? 'none' : 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        background: 'hsl(var(--secondary) / 0.3)',
                                                        borderRadius: '8px',
                                                        width: '48px',
                                                        height: '48px',
                                                        color: 'hsl(var(--muted-foreground))'
                                                    }}
                                                >
                                                    <Package size={20} />
                                                </div>
                                                <div>
                                                    <div className="item-name">{item.name}</div>
                                                    <div className="item-meta">{item.unit}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{RS}{item.price?.toFixed(2)}</td>
                                        <td>x{item.quantity}</td>
                                        <td style={{ textAlign: 'right', fontWeight: '700' }}>
                                            {RS}{(item.price * item.quantity).toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Price Summary */}
                    <div className="price-summary">
                        <div className="summary-row">
                            <span className="info-label">Subtotal</span>
                            <span className="info-value">{RS}{order.totalAmount?.toFixed(2)}</span>
                        </div>
                        <div className="summary-row">
                            <span className="info-label">Delivery Fee</span>
                            <span className="info-value">{RS}{order.deliveryCharge?.toFixed(2)}</span>
                        </div>
                        {order.tax > 0 && (
                            <div className="summary-row">
                                <span className="info-label">Tax</span>
                                <span className="info-value">{RS}{order.tax?.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="summary-row total">
                            <span>Total Amount</span>
                            <span>{RS}{order.finalAmount?.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <footer className="modal-footer">
                    <div className="status-manager" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <label style={{ fontWeight: '600', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>Update Status:</label>


                        {/* Current status chip */}
                        <span className={`status-badge ${currentStatus?.toLowerCase()}`} style={{ margin: '0 4px' }}>
                            {getStatusIcon(currentStatus)}
                            {currentStatus}
                        </span>

                        {/* Step-forward button â€” only if next step exists */}
                        {nextStatus && (
                            <button
                                className="primary-button"
                                onClick={() => handleStatusChange(nextStatus)}
                                disabled={updating}
                                title={`Advance to ${nextStatus}`}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                                {nextStatus}
                                <ChevronRight size={15} />
                            </button>
                        )}

                        {/* Cancel â€” shown unless already cancelled or delivered */}
                        {canCancel && (
                            <button
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    marginLeft: 'auto', background: 'transparent',
                                    border: '1px solid hsl(var(--destructive) / 0.5)', color: '#dc2626',
                                    borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontWeight: '600'
                                }}
                                onClick={() => handleStatusChange('Cancelled')}
                                disabled={updating}
                            >
                                <XCircle size={15} />
                                Cancel Order
                            </button>
                        )}

                        {/* Terminal states */}
                        {isCancelled && <span style={{ color: '#dc2626', fontWeight: '700', fontSize: '0.85rem' }}>This order has been cancelled.</span>}
                        {isDelivered && <span style={{ color: '#166534', fontWeight: '700', fontSize: '0.85rem' }}>Order successfully delivered.</span>}
                    </div>
                    <div>
                        <button className="primary-button" onClick={onClose}>
                            Close Details
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};

export default OrderDetailsModal;
