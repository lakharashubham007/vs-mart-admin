import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { X, Navigation, MapPin, Store, Package, Phone, CreditCard } from 'lucide-react';
import deliveryBoyService from '../services/deliveryBoyService';
import { GOOGLE_MAPS_API_KEY } from '../config/env';

/**
 * PRODUCTION-READY DELIVERY MAP MODAL
 * Engineered for VS Mart Delivery Fleet
 */

// --- Constants & Configuration ---
const SHOP_LOCATION = { lat: 23.723167, lng: 73.695313 };
const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' };
const DEFAULT_ZOOM = 15;

// High-quality Icons
const ICONS = {
    SHOP: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
    PICKED: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
    PENDING: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
};

// Safe coordinate parser
const parseCoordinate = (val, label) => {
    const num = Number(val);
    if (isNaN(num) || num === 0) {
        console.warn(`[MapDebug] Invalid ${label} detected:`, val);
        return null;
    }
    return num;
};

export default function DeliveryMapModal({ onClose, initialId }) {
    // 1. Google Maps Engine Initializer
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY
    });

    // 2. Component State
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mapInstance, setMapInstance] = useState(null);
    const [activePopup, setActivePopup] = useState(null); // { type: 'shop' | 'order', data: assignment }
    const [isAdjusted, setIsAdjusted] = useState(false);

    // 3. Data Fetching (Assignment Queue)
    useEffect(() => {
        const fetchAssignments = async () => {
            try {
                const res = await deliveryBoyService.getAssignments({ status: 'PICKED' });
                const data = res.data || [];
                console.log("[MapDebug] Assignments Loaded:", data);
                setAssignments(data);

                // Auto-select initialId if provided
                if (initialId) {
                    const found = data.find(a => a._id === initialId || a.orderId?._id === initialId);
                    if (found) setActivePopup({ type: 'order', data: found });
                } else {
                    setActivePopup({ type: 'shop', data: null });
                }
            } catch (err) {
                console.error('[MapError] Data fetch failed:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAssignments();
    }, [initialId]);

    // 4. Intelligent Bounds Engine
    const adjustView = useCallback(() => {
        if (!mapInstance || !window.google) return;

        console.log("[MapDebug] Adjusting Bounds...");
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(SHOP_LOCATION);

        let validPins = 0;
        assignments.forEach(asgn => {
            const lat = parseCoordinate(asgn.deliveryAddress?.latitude, 'lat');
            const lng = parseCoordinate(asgn.deliveryAddress?.longitude, 'lng');
            if (lat !== null && lng !== null) {
                console.log(`[MapDebug] Adding Pin at: ${lat}, ${lng}`);
                bounds.extend({ lat, lng });
                validPins++;
            }
        });

        if (initialId && activePopup?.type === 'order') {
            const target = activePopup.data.deliveryAddress;
            mapInstance.setZoom(17);
            mapInstance.panTo({ lat: Number(target.latitude), lng: Number(target.longitude) });
        } else if (validPins === 0) {
            mapInstance.setZoom(DEFAULT_ZOOM);
            mapInstance.panTo(SHOP_LOCATION);
        } else {
            mapInstance.fitBounds(bounds);
        }
    }, [mapInstance, assignments, initialId, activePopup]);

    // Process bounds only once map and data are ready
    useEffect(() => {
        if (isLoaded && mapInstance && !isAdjusted && assignments.length >= 0) {
            adjustView();
            setIsAdjusted(true);
        }
    }, [isLoaded, mapInstance, isAdjusted, assignments, adjustView]);

    // 5. InfoWindow Render Helper
    const renderInfoWindows = () => {
        if (!activePopup) return null;

        if (activePopup.type === 'shop') {
            return (
                <InfoWindow position={SHOP_LOCATION} onCloseClick={() => setActivePopup(null)}>
                    <div className="vg-map-info-window pro-hub">
                        <div className="inf-header hub">
                            <Store size={14} /> <span>PICKUP HUB</span>
                        </div>
                        <h4 className="inf-name">VS Mart Headquarters</h4>
                        <p className="inf-addr">Operational Center - Pickup Point</p>
                    </div>
                </InfoWindow>
            );
        }

        const order = activePopup.data;
        const oLat = Number(order.deliveryAddress?.latitude);
        const oLng = Number(order.deliveryAddress?.longitude);

        if (isNaN(oLat) || isNaN(oLng)) return null;

        return (
            <InfoWindow 
                position={{ lat: oLat, lng: oLng }} 
                onCloseClick={() => setActivePopup(null)}
            >
                <div className="vg-map-info-window pro-order">
                    <div className="inf-header">
                        <span className="inf-badge">ORDER #{order.orderNumber}</span>
                        <span className={`inf-status-dot ${order.status?.toLowerCase()}`} />
                    </div>
                    <h4 className="inf-name">{order.customerName}</h4>
                    <p className="inf-addr">{order.deliveryAddress?.fullAddress}</p>
                    <div className="inf-meta-grid">
                        <div className="m-item"><Phone size={12} /> {order.customerPhone || 'N/A'}</div>
                        <div className="m-item text-primary" style={{ fontWeight: 800 }}>Total: RS {order.totalAmount?.toFixed(2)}</div>
                    </div>
                    <div className="inf-footer">
                        <a 
                            href={`https://www.google.com/maps/dir/?api=1&destination=${oLat},${oLng}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="inf-nav-btn luxury"
                        >
                            <Navigation size={14} /> Start Navigation
                        </a>
                    </div>
                </div>
            </InfoWindow>
        );
    };

    if (loadError) return <div className="vg-map-state error">Map Engine Configuration Error</div>;

    const modalContent = (
        <div className="vg-modal-overlay" onClick={onClose}>
            <div className="vg-map-modal luxury-theme" onClick={e => e.stopPropagation()}>
                <header className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div className="live-ripple"><div /><div /></div>
                        <h2>Real-time Delivery Tracking</h2>
                        <span className="status-badge picked" style={{ fontSize: '0.75rem' }}>
                            {assignments.length} ACTIVE PINS
                        </span>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </header>
                
                <div className="vg-map-content">
                    {loading ? (
                        <div className="vg-map-state loading">
                            <div className="pro-spinner" />
                            <p>Initializing Fleet Data...</p>
                        </div>
                    ) : isLoaded ? (
                        <GoogleMap
                            mapContainerStyle={MAP_CONTAINER_STYLE}
                            center={SHOP_LOCATION}
                            zoom={DEFAULT_ZOOM}
                            onLoad={setMapInstance}
                            mapTypeId="roadmap"
                            options={{
                                disableDefaultUI: false,
                                zoomControl: true,
                                clickableIcons: false,
                                tilt: 0
                            }}
                        >
                            {/* --- DEBUG TEST PIN (Red Hearts indicate system works) --- */}
                            <Marker
                                position={{ lat: 23.723167, lng: 73.695313 }}
                                zIndex={99999}
                                optimized={false}
                                title="STATIC DEBUG PIN"
                            />

                            {/* 1. Shop Hub Pin */}
                            <Marker
                                position={SHOP_LOCATION}
                                title="VS Mart Shop"
                                onClick={() => setActivePopup({ type: 'shop', data: null })}
                                zIndex={1000}
                                icon={{
                                    url: ICONS.SHOP,
                                    scaledSize: new window.google.maps.Size(50, 50)
                                }}
                                label={{
                                    text: 'SHOP',
                                    color: '#fff',
                                    fontSize: '12px',
                                    fontWeight: 'bold'
                                }}
                            />

                            {/* 2. Order Delivery Pins */}
                            {assignments.map(asgn => {
                                const lat = parseCoordinate(asgn.deliveryAddress?.latitude, 'lat');
                                const lng = parseCoordinate(asgn.deliveryAddress?.longitude, 'lng');
                                
                                if (lat === null || lng === null) {
                                    console.warn("[MapDebug] Skipping invalid item:", asgn);
                                    return null;
                                }

                                const isPicked = asgn.status === 'PICKED';

                                return (
                                    <Marker
                                        key={asgn._id}
                                        position={{ lat, lng }}
                                        optimized={false}
                                        zIndex={500}
                                        onClick={() => setActivePopup({ type: 'order', data: asgn })}
                                        icon={{
                                            url: isPicked ? ICONS.PICKED : ICONS.PENDING,
                                            scaledSize: new window.google.maps.Size(40, 40)
                                        }}
                                        label={{
                                            text: `#${asgn.orderNumber || asgn._id?.slice(-4)}`,
                                            color: '#fff',
                                            fontSize: '10px',
                                            fontWeight: 'bold'
                                        }}
                                    />
                                );
                            })}

                            {renderInfoWindows()}
                        </GoogleMap>
                    ) : (
                        <div className="vg-map-state">Map Engine Pending...</div>
                    )}
                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
}
