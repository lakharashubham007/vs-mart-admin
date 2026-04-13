import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Package, Clock, CheckCircle2, MapPin, Navigation, 
    Zap, Activity, TrendingUp, LogOut, ChevronRight,
    Truck, AlertCircle, Fuel
} from 'lucide-react';
import deliveryBoyService from '../services/deliveryBoyService';
import { useAuth } from '../context/AuthContext';
import './DeliveryDashboard.css';

const StatCard = ({ label, value, trend, color }) => (
    <div className="db-stat-card" style={{ borderLeft: `4px solid ${color}` }}>
        <p className="db-stat-label">{label}</p>
        <div className="db-stat-lower">
            <h2 className="db-stat-value">{value}</h2>
            {trend && <span className="db-stat-trend">{trend}</span>}
        </div>
    </div>
);

export default function DeliveryDashboard() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [stats, setStats] = useState(null);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const [statsRes, assignmentsRes] = await Promise.all([
                deliveryBoyService.getAssignmentStats(),
                deliveryBoyService.getAssignments({ limit: 5 })
            ]);
            setStats(statsRes.data || statsRes);
            setAssignments(assignmentsRes.data || []);
        } catch (err) {
            console.error('Failed to fetch delivery dashboard data:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const activeTask = assignments.find(a => a.status === 'PICKED' || a.status === 'ASSIGNED');
    const successRate = stats ? Math.round(((stats.deliveredCount || 0) / (stats.totalOrders || 1)) * 100) : 98.4;

    if (loading) {
        return (
            <div className="db-loader">
                <Activity className="spin" size={32} color="#1A6B3A" />
                <p>Synchronizing Fleet Data...</p>
            </div>
        );
    }

    return (
        <div className="db-container">
            <div className="db-header">
                <div>
                    <h5 className="db-context">DELIVERY FLEET</h5>
                    <h1 className="db-welcome">Welcome back, {user?.name || 'Partner'}</h1>
                </div>
                <button className="db-logout" onClick={logout}>
                    <LogOut size={16} /> Logout
                </button>
            </div>

            <div className="db-grid">
                {/* Stats Section */}
                <div className="db-stats-row">
                    <StatCard label="ORDERS TODAY" value={stats?.totalOrders || 24} trend="+12% 📈" color="#3B82F6" />
                    <StatCard label="COMPLETED" value={stats?.deliveredCount || 18} trend="Target: 25" color="#3B82F6" />
                    <StatCard label="PENDING" value={stats?.outForDelivery || 6} trend="High Priority" color="#F59E0B" />
                    <StatCard label="SUCCESS RATE" value={`${successRate}%`} trend="Target: 95%" color="#10B981" />
                </div>

                {/* Main Content Area */}
                <div className="db-main-layout">
                    <div className="db-left-col">
                        <div className="db-section-header">
                            <div className="db-title-wrap">
                                <div className="db-indicator active" />
                                <h3>Active Delivery</h3>
                            </div>
                        </div>

                        {activeTask ? (
                            <div className="db-active-card">
                                <div className="db-active-header">
                                    <span className="db-order-id">ORDER #{activeTask.orderId?.orderId || 'AD-9821'}</span>
                                    <span className="db-pickup-time">Pickup: {new Date(activeTask.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <h2 className="db-active-store">{activeTask.orderId?.items?.[0]?.name || 'Express Delivery'}</h2>
                                <div className="db-active-meta">
                                    <MapPin size={16} />
                                    <span>{activeTask.deliveryAddress?.fullAddress || 'Assigning Address...'}</span>
                                </div>
                                <div className="db-active-actions">
                                    <button className="db-btn-primary">View Map</button>
                                    <button className="db-btn-outline">Complete</button>
                                </div>
                            </div>
                        ) : (
                            <div className="db-empty-active">
                                <Clock size={32} opacity={0.3} />
                                <p>No Active Deliveries</p>
                            </div>
                        )}

                        <div className="db-section-header" style={{ marginTop: '2rem' }}>
                            <div className="db-title-wrap">
                                <div className="db-indicator" />
                                <h3>Assigned Orders</h3>
                            </div>
                            <button className="db-view-all" onClick={() => navigate('/delivery-boy/assignments')}>View All</button>
                        </div>

                        <div className="db-order-list">
                            {assignments.map((item, idx) => (
                                <div key={item._id} className="db-order-item">
                                    <div className="db-order-icon"><Package size={20} /></div>
                                    <div className="db-order-info">
                                        <h4>{item.orderId?.items?.[0]?.name || 'Standard Order'}</h4>
                                        <p>1.2 km • 15 mins</p>
                                    </div>
                                    <span className="db-order-status">{item.status}</span>
                                    <ChevronRight size={18} opacity={0.3} />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="db-right-col">
                        <h3 className="db-col-title">Route Intelligence</h3>
                        <div className="db-map-preview">
                            <Navigation size={48} opacity={0.1} />
                            <div className="db-map-overlay">
                                <div className="db-priority-tag">
                                    <Zap size={14} color="#10B981" fill="#10B981" />
                                    <span>ETA 15:02</span>
                                </div>
                            </div>
                        </div>

                        <div className="db-fleet-card">
                            <h5 className="db-fleet-header">DUTY & PERFORMANCE</h5>
                            
                            <div className="db-fleet-metrics">
                                <div className="db-metric-box">
                                    <p>SHIFT TIME</p>
                                    <strong>08:00 - 17:00</strong>
                                </div>
                                <div className="db-metric-box">
                                    <p>ATTENDANCE</p>
                                    <strong>22/26 Days</strong>
                                </div>
                            </div>

                            <button className="db-report-btn">
                                <Activity size={16} /> View Performance History
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
