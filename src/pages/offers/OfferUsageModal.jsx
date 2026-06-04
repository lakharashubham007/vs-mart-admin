import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { X, User, ShoppingBag, Calendar, Banknote, Loader2, Search } from 'lucide-react';
import offerService from '../../services/offerService';
import './OfferUsageModal.css';

const OfferUsageModal = ({ isOpen, onClose, offerId, offerTitle }) => {
    const [usageData, setUsageData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [totalResults, setTotalResults] = useState(0);
    
    const observer = useRef();
    const lastElementRef = useCallback(node => {
        if (isLoading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [isLoading, hasMore]);

    const fetchUsage = async (reset = false) => {
        if (!offerId) return;
        setIsLoading(true);
        try {
            const currentPage = reset ? 1 : page;
            const response = await offerService.getUsageAnalytics(offerId, { 
                page: currentPage, 
                limit: 10 
            });
            
            if (response.success) {
                const results = response.data.results;
                setUsageData(prev => reset ? results : [...prev, ...results]);
                setHasMore(results.length === 10);
                setTotalResults(response.data.totalResults);
            }
        } catch (error) {
            console.error('Error fetching usage details:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && offerId) {
            setPage(1);
            setUsageData([]);
            setHasMore(true);
            fetchUsage(true);
        }
    }, [isOpen, offerId]);

    useEffect(() => {
        if (page > 1) {
            fetchUsage();
        }
    }, [page]);

    if (!isOpen) return null;

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return ReactDOM.createPortal(
        <div className="usage-modal-overlay" onClick={onClose}>
            <div className="usage-modal-content" onClick={e => e.stopPropagation()}>
                <header className="usage-modal-header">
                    <div className="header-info">
                        <h2>Offer Redemptions</h2>
                        <p>{offerTitle} • {totalResults} total uses</p>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </header>

                <div className="usage-cards-container">
                    {usageData.map((usage, index) => {
                        const isLast = index === usageData.length - 1;
                        return (
                            <div 
                                key={usage._id} 
                                className="usage-card"
                                ref={isLast ? lastElementRef : null}
                            >
                                <div className="user-profile-section">
                                    <div className="user-avatar">
                                        {usage.userId?.profileImage ? (
                                            <img src={usage.userId.profileImage} alt={usage.userId.name} />
                                        ) : (
                                            <User size={20} />
                                        )}
                                    </div>
                                    <div className="user-details">
                                        <h3>{usage.userId?.name || 'Unknown User'}</h3>
                                        <p>{usage.userId?.email || 'No Email'}</p>
                                        <p>{usage.userId?.phone || 'No Phone'}</p>
                                    </div>
                                </div>
                                
                                <div className="order-details-section">
                                    <div className="detail-item">
                                        <ShoppingBag size={14} className="icon" />
                                        <span>Order #{usage.orderId?.orderId || 'N/A'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <Banknote size={14} className="icon" />
                                        <span className="discount-amount">₹{usage.discountAmount} Saved</span>
                                    </div>
                                    <div className="detail-item">
                                        <Calendar size={14} className="icon" />
                                        <span>{formatDate(usage.usedAt)}</span>
                                    </div>
                                </div>
                                
                                <div className="status-badge" data-status={usage.orderId?.orderStatus}>
                                    {usage.orderId?.orderStatus || 'Processing'}
                                </div>
                            </div>
                        );
                    })}

                    {isLoading && (
                        <div className="usage-loader">
                            <Loader2 size={24} className="animate-spin" />
                            <span>Loading more redemptions...</span>
                        </div>
                    )}

                    {!isLoading && usageData.length === 0 && (
                        <div className="empty-usage">
                            <Search size={48} strokeWidth={1} />
                            <p>No redemptions found for this offer yet.</p>
                        </div>
                    )}
                    
                    {!hasMore && usageData.length > 0 && (
                        <div className="no-more-data">
                            End of redemption history
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default OfferUsageModal;
