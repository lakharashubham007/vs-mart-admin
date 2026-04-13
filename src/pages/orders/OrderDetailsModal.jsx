import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
    X,
    Printer,
    Clock,
    User,
    Phone,
    MapPin,
    Truck,
    Package,
    CheckCircle2,
    ShoppingBag,
    Calendar,
    CreditCard,
    ExternalLink,
    Banknote,
    ChevronRight,
    XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import orderService from '../../services/orderService';
import Loader from '../../components/Loader';
import DeliveryBoySelectionModal from '../../components/DeliveryBoySelectionModal';
import { BASE_IMAGE_URL } from '../../config/env';
import './OrderDetailsModal.css';

// Safe rupee symbol constant — avoids file encoding issues with ₹
const RS = 'RS';

// Linear order pipeline — status can only move one step at a time
const ORDER_PIPELINE = ['Placed', 'Confirmed', 'Processing', 'OutForDelivery', 'Delivered'];

const OrderDetailsModal = ({ orderId, onClose, onUpdate }) => {
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [showSelectionModal, setShowSelectionModal] = useState(false);
    const [showCODPrompt, setShowCODPrompt] = useState(false);
    const [pendingStatus, setPendingStatus] = useState(null);

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
        // Intercept OutForDelivery to show boy selection
        if (newStatus?.toLowerCase() === 'outfordelivery') {
            setShowSelectionModal(true);
            return;
        }

        // COD Confirmation Guard - Open custom modal instead of window.confirm
        if (newStatus?.toLowerCase() === 'delivered' && order.paymentMethod === 'COD') {
            setPendingStatus(newStatus);
            setShowCODPrompt(true);
            return;
        }

        performStatusUpdate(newStatus);
    };

    const performStatusUpdate = async (status) => {
        const previousStatus = order.orderStatus;
        setOrder(prev => ({ ...prev, orderStatus: status }));
        setUpdating(true);
        
        try {
            await orderService.updateOrderStatus(orderId, status);
            toast.success(`Order marked as ${status}`);
            
            const res = await orderService.getOrderDetails(orderId);
            setOrder(res.order || res);
            
            onUpdate();
        } catch (error) {
            setOrder(prev => ({ ...prev, orderStatus: previousStatus }));
            toast.error(error.message || 'Failed to update status');
        } finally {
            setUpdating(false);
        }
    };

    const onAssignmentComplete = async () => {
        onUpdate();
        const res = await orderService.getOrderDetails(orderId);
        setOrder(res.order || res);
    };

    if (loading) return <div className="modal-overlay"><Loader /></div>;
    if (!order) return null;

    const currentStatus = order.orderStatus;
    const currentIndex = ORDER_PIPELINE.indexOf(currentStatus);
    const isCancelled = currentStatus === 'Cancelled';
    const isDelivered = currentStatus === 'Delivered';

    const outForDeliveryIndex = ORDER_PIPELINE.indexOf('OutForDelivery');
    const nextStatus = !isCancelled && !isDelivered && currentIndex < outForDeliveryIndex
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
                    {updating && (
                        <div className="updating-overlay">
                            <div className="loader-container">
                                <div className="premium-spinner"></div>
                            </div>
                            <div className="loader-text">Processing Request...</div>
                            <div className="loader-subtext">Updating order status and notifying team</div>
                        </div>
                    )}
                    <div className="order-grid">
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

                        <div className="section-card">
                            <div className="section-head">
                                <MapPin size={18} />
                                Delivery Address
                            </div>
                            <div style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
                                <div style={{ fontWeight: '700' }}>{order.shippingAddress?.receiverName}</div>
                                {order.shippingAddress?.addressDetails ? (
                                    <div style={{ wordBreak: 'break-word', marginTop: '4px' }}>
                                        {order.shippingAddress.addressDetails}
                                    </div>
                                ) : (
                                    <>
                                        <div>{order.shippingAddress?.flatNo}{order.shippingAddress?.flatNo && ','} {order.shippingAddress?.area}</div>
                                        <div>{order.shippingAddress?.landmark ? `${order.shippingAddress.landmark}, ` : ''}{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.pincode ? `- ${order.shippingAddress.pincode}` : ''}</div>
                                    </>
                                )}
                                <div style={{ marginTop: '0.5rem', color: 'hsl(var(--primary))', fontWeight: '600' }}>
                                    Type: {order.shippingAddress?.addressType}
                                </div>
                                {order.shippingAddress?.coordinates?.latitude && order.shippingAddress?.coordinates?.longitude && (
                                    <div style={{ marginTop: '0.75rem' }}>
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${order.shippingAddress.coordinates.latitude},${order.shippingAddress.coordinates.longitude}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '6px 12px',
                                                fontSize: '0.8rem',
                                                textDecoration: 'none',
                                                color: 'hsl(var(--primary))',
                                                border: '1px solid hsl(var(--primary) / 0.3)',
                                                borderRadius: '6px',
                                                background: 'hsl(var(--primary) / 0.05)',
                                                fontWeight: '600'
                                            }}
                                        >
                                            <ExternalLink size={14} />
                                            Open in Google Maps
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="order-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
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
                                <span className="info-value" style={{ 
                                    color: (order.paymentStatus === 'Completed' || order.paymentStatus === 'PAID') ? '#166534' : '#B45309',
                                    fontWeight: '700'
                                }}>
                                    {order.paymentStatus}
                                </span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Order Date</span>
                                <span className="info-value">{new Date(order.createdAt).toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="section-card">
                            {order.deliveryBoyId ? (
                                <>
                                    <div className="section-head">
                                        <Truck size={18} />
                                        Delivery Personnel
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                                        <div style={{ 
                                            width: '44px', height: '44px', borderRadius: '12px', background: 'hsl(var(--primary) / 0.1)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--primary))',
                                            overflow: 'hidden', border: '1px solid hsl(var(--primary) / 0.2)'
                                        }}>
                                            {order.deliveryBoyId.profileImage ? (
                                                <img 
                                                    src={`${BASE_IMAGE_URL}/${order.deliveryBoyId.profileImage}`} 
                                                    alt="Boy" 
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <User size={24} />
                                            )}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: '800', fontSize: '0.95rem', color: 'hsl(var(--foreground))' }}>
                                                {typeof order.deliveryBoyId === 'object' 
                                                    ? `${order.deliveryBoyId.firstName} ${order.deliveryBoyId.lastName || ''}` 
                                                    : 'Assigned Courier'}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                {order.deliveryBoyId.mobile ? (
                                                    <a href={`tel:${order.deliveryBoyId.mobile}`} style={{ color: 'inherit', textDecoration: 'none', fontWeight: '600' }}>
                                                        {order.deliveryBoyId.mobile}
                                                    </a>
                                                ) : 'No Contact Info'}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="section-head">
                                        <Clock size={18} />
                                        Order Placement
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>
                                        This order was placed on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}.
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

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
                                                <div>
                                                    <div className="item-name">{item.name}</div>
                                                    <div className="item-meta">{item.unit}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                {item.mrp && item.mrp > (item.finalSellingPrice || item.price) && (
                                                    <span className="original-mrp">
                                                        {RS}{item.mrp.toFixed(2)}
                                                    </span>
                                                )}
                                                <span className="final-price">
                                                    {RS}{(item.finalSellingPrice || item.price)?.toFixed(2)}
                                                </span>
                                            </div>
                                        </td>
                                        <td>x{item.quantity}</td>
                                        <td style={{ textAlign: 'right', fontWeight: '700' }}>
                                            {RS}{((item.finalSellingPrice || item.price) * item.quantity).toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="price-summary">
                        <div className="summary-row">
                            <span className="info-label">Subtotal</span>
                            <span className="info-value">{RS}{order.totalAmount?.toFixed(2)}</span>
                        </div>
                        <div className="summary-row">
                            <span className="info-label">Delivery Fee</span>
                            <span className="info-value">{RS}{order.deliveryCharge?.toFixed(2)}</span>
                        </div>
                        <div className="summary-row total">
                            <span>Total Amount</span>
                            <span>{RS}{order.finalAmount?.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <footer className="modal-footer">
                    <div className="status-manager" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <label style={{ fontWeight: '600', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>Update Status:</label>
                        <span className={`status-badge ${currentStatus?.toLowerCase()}`} style={{ margin: '0 4px' }}>
                            {getStatusIcon(currentStatus)}
                            {currentStatus}
                        </span>
                        {nextStatus && (
                            <button
                                className="primary-button"
                                onClick={() => handleStatusChange(nextStatus)}
                                disabled={updating}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                                {nextStatus.replace(/([A-Z])/g, ' $1').trim()}
                                <ChevronRight size={15} />
                            </button>
                        )}
                        {canCancel && (
                            <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
                                <button
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        background: 'transparent',
                                        border: '1px solid #f59e0b', color: '#d97706',
                                        borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontWeight: '600'
                                    }}
                                    onClick={() => handleStatusChange('OutOfStock')}
                                    disabled={updating}
                                >
                                    Out Of Stock
                                </button>
                                <button
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        background: 'transparent',
                                        border: '1px solid hsl(var(--destructive) / 0.5)', color: '#dc2626',
                                        borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontWeight: '600'
                                    }}
                                    onClick={() => handleStatusChange('Cancelled')}
                                    disabled={updating}
                                >
                                    Cancel Order
                                </button>
                            </div>
                        )}
                    </div>
                    <div>
                        <button className="primary-button" onClick={onClose}>
                            Close Details
                        </button>
                    </div>
                </footer>
            </div>

            <DeliveryBoySelectionModal 
                isOpen={showSelectionModal}
                orderId={orderId}
                onClose={() => setShowSelectionModal(false)}
                onSelect={onAssignmentComplete}
            />

            {showCODPrompt && (
                <div className="fixed-overlay fade-in" style={{ zIndex: 100000 }}>
                    <div className="cod-confirmation-card glass shadow-xl scale-in" style={{ background: 'hsl(var(--card))' }}>
                        <div className="cod-modal-header">
                            <div className="cod-icon-wrapper">
                                <Banknote size={32} color="hsl(var(--primary))" />
                            </div>
                            <button className="close-modal-btn" onClick={() => setShowCODPrompt(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="cod-modal-body" style={{ textAlign: 'center' }}>
                            <h2 className="cod-modal-title">Payment Collection</h2>
                            <p className="cod-modal-subtitle">
                                This is a <strong>Cash on Delivery</strong> order. Please confirm that you have collected the cash from the customer.
                            </p>
                            
                            <div className="amount-collection-box" style={{ marginInline: 'auto' }}>
                                <span className="amount-label">COLLECT CASH</span>
                                <div className="amount-value">
                                    <span className="currency-symbol">RS</span>
                                    {order.finalAmount?.toFixed(2)}
                                </div>
                                <div className="order-ref">Order #{order.orderId}</div>
                            </div>
                        </div>

                        <div className="cod-modal-footer">
                            <button 
                                className="cancel-modal-btn" 
                                onClick={() => setShowCODPrompt(false)}
                            >
                                Not yet
                            </button>
                            <button 
                                className="confirm-collection-btn"
                                onClick={() => {
                                    setShowCODPrompt(false);
                                    performStatusUpdate(pendingStatus);
                                }}
                            >
                                <CheckCircle2 size={18} />
                                Collected & Delivered
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};

export default OrderDetailsModal;
