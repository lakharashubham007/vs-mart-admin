import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
    ShoppingCart, Banknote, Users, Package, RefreshCw, Star, Box, PackagePlus, Truck, 
    ChevronDown, CheckCircle2, AlertTriangle, AlertCircle, BarChart3, TrendingUp, 
    ArrowUpRight, Clock, CheckCircle, XCircle, PackageCheck 
} from 'lucide-react';
import analyticsService from '../services/analyticsService';
import { BASE_IMAGE_URL } from '../config/env';
import './Dashboard.css';

const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${BASE_IMAGE_URL}${cleanPath}`;
};

const fmtRupee = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

const fmtNum = (n) => {
    if (!n && n !== 0) return '0';
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`.replace('.0', '');
    return new Intl.NumberFormat('en-US').format(n);
};

const Sk = ({ h = 16, w = '100%', r = 8 }) => (
    <div className="sk" style={{ height: h, width: w, borderRadius: r }} />
);

export default function Dashboard() {
    const [summary, setSummary] = useState(null);
    const [trend, setTrend] = useState([]);
    const [recentOrders, setRecentOrders] = useState([]);
    const [bestSellers, setBestSellers] = useState([]);
    const [stockDyn, setStockDyn] = useState(null);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [chartSpan, setChartSpan] = useState('Week');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [hoverBar, setHoverBar] = useState(null);
    const menuRef = useRef();

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setIsMenuOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const [stockError, setStockError] = useState(null);

    const fetchStock = useCallback(async () => {
        try {
            setStockError(null);
            const res = await analyticsService.getStockDynamics();
            const data = res?.data || res;
            if (data && typeof data.totalProducts === 'number') {
                setStockDyn({
                    totalProducts: data.totalProducts,
                    inStock: data.inStock || 0,
                    lowStock: data.lowStock || 0,
                    outOfStock: data.outOfStock || 0,
                });
            }
        } catch (err) { setStockError(err.message); }
    }, []);

    const fetchAll = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true);
        try {
            let trendPromise;
            if (chartSpan === 'Week') trendPromise = analyticsService.getWeeklySales();
            else if (chartSpan === 'Month') trendPromise = analyticsService.getMonthlySales();
            else trendPromise = analyticsService.getYearlySales();

            const results = await Promise.allSettled([
                analyticsService.getSummary(),
                trendPromise,
                analyticsService.getRecentOrders(6),
                analyticsService.getBestSellers(5),
            ]);

            const get = (r) => (r.status === 'fulfilled' ? r.value : null);
            const [s, t, ro, bs] = results.map(get);

            if (s) setSummary(s.data);
            if (t) setTrend(t || []);
            if (ro) setRecentOrders(ro.data || []);
            if (bs) setBestSellers(bs.data || []);
        } catch (e) { console.error('Dashboard failed:', e); }
        finally { setLoading(false); setRefreshing(false); }
    }, [chartSpan]);

    useEffect(() => { fetchAll(); }, [fetchAll]);
    useEffect(() => { fetchStock(); }, [fetchStock]);

    const handleSelectSpan = (span) => { setChartSpan(span); setIsMenuOpen(false); };

    const totalOrders = summary?.orders?.total || 0;
    const totalSales = summary?.revenue?.total || 0;
    const totalUsers = summary?.users?.total || 0;
    const totalProducts = stockDyn?.totalProducts || 0;

    const processing = summary?.orders?.processing || 0;
    const inTransit = summary?.orders?.outForDelivery || 0;
    const delivered = summary?.orders?.delivered || 0;
    const cancelled = summary?.orders?.cancelled || 0;

    const chartMax = Math.max(...trend.map(d => d.total), 1);
    const topSellerQty = Math.max(...bestSellers.map(p => p.totalQty), 1);

    return (
        <div className="vg-dashboard">
            <div className="vg-header">
                <div>
                    <h1 className="vg-title">Administrative Dashboard</h1>
                    <p className="vg-subtitle">Real-time performance monitoring and analytics</p>
                </div>
                <button className={`vg-refresh ${refreshing ? 'spin' : ''}`} onClick={() => fetchAll(true)} disabled={refreshing}>
                    <RefreshCw size={14} /> Refresh Data
                </button>
            </div>

            {/* Row 1: Top Metrics */}
            <div className="vg-top-metrics">
                {[
                    { label: 'TOTAL ORDERS', val: fmtNum(totalOrders), icon: <ShoppingCart size={18} />, color: 'bg-mint' },
                    { label: 'TOTAL SALES', val: fmtRupee(totalSales), icon: <Banknote size={18} />, color: 'bg-mint' },
                    { label: 'TOTAL USERS', val: fmtNum(totalUsers), icon: <Users size={18} />, color: 'bg-mint' },
                    { label: 'TOTAL PRODUCTS', val: fmtNum(totalProducts), icon: <Package size={18} />, color: 'bg-dark', text: 'white' }
                ].map((m, i) => (
                    <div key={i} className="vg-metric-card">
                        <div className="vg-m-top">
                            <div>
                                <p className="vg-m-label">{m.label}</p>
                                <h2 className="vg-m-value">{m.val}</h2>
                            </div>
                            <div className={`vg-icon-box ${m.color}`} style={{ color: m.text === 'white' ? '#fff' : '#0D2C22' }}>
                                {m.icon}
                            </div>
                        </div>
                        <div className="vg-m-bottom">
                            <span className="vg-badge positive">Live</span> <span className="vg-b-text">Updated just now</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Row 2: Status Pipeline */}
            <div className="vg-pipeline">
                <div className="vg-pipe-card">
                    <div className="vg-pipe-icon"><PackagePlus size={16} /></div>
                    <div className="vg-pipe-info"><p>PROCESSING</p><h3>{processing}</h3></div>
                </div>
                <div className="vg-pipe-card">
                    <div className="vg-pipe-icon"><Truck size={16} /></div>
                    <div className="vg-pipe-info"><p>IN TRANSIT</p><h3>{inTransit}</h3></div>
                </div>
                <div className="vg-pipe-card">
                    <div className="vg-pipe-icon dark"><Star size={16} /></div>
                    <div className="vg-pipe-info"><p>DELIVERED</p><h3>{delivered}</h3></div>
                </div>
                <div className="vg-pipe-card alert">
                    <div className="vg-pipe-icon red"><Box size={16} /></div>
                    <div className="vg-pipe-info"><p>CANCELLED</p><h3 className="red-text">{cancelled}</h3></div>
                </div>
            </div>

            {/* Row 3: Chart & Stock */}
            <div className="vg-middle-row">
                <div className="vg-card vg-chart-area">
                    <div className="vg-card-header">
                        <div><h3>Sales Trajectory</h3><p>Revenue fluctuations across timeframes</p></div>
                        <div className="vg-dropdown" ref={menuRef}>
                            <div className="vg-drop-trigger" onClick={() => setIsMenuOpen(!isMenuOpen)}>{chartSpan} <ChevronDown size={14} /></div>
                            {isMenuOpen && (
                                <div className="vg-drop-menu">
                                    {['Week', 'Month', 'Year'].map(s => <div key={s} onClick={() => handleSelectSpan(s)}>{s}</div>)}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="vg-chart">
                        {hoverBar && (
                            <div className="bar-hover-tip" style={{ left: hoverBar.x }}>
                                <strong>{hoverBar.label}</strong><span>{fmtRupee(hoverBar.total)}</span>
                            </div>
                        )}
                        {loading ? <Sk h={200} /> : (
                            <div className="vg-chart-scroll">
                                <div className="bars-container">
                                    {trend.map((d, i) => {
                                        const h = chartMax > 0 ? (d.total / chartMax) * 100 : 0;
                                        return (
                                            <div key={i} className={`bar-col ${d.total === chartMax ? 'active' : ''}`}
                                                onMouseEnter={(e) => {
                                                    const r = e.currentTarget.getBoundingClientRect();
                                                    const pr = e.currentTarget.closest('.vg-chart').getBoundingClientRect();
                                                    setHoverBar({ index: i, label: d.label, total: d.total, x: r.left - pr.left + r.width / 2 });
                                                }}
                                                onMouseLeave={() => setHoverBar(null)}>
                                                <div className="bar-fill" style={{ height: `${Math.max(h, 4)}%` }} />
                                                <span className="bar-lbl">{d.label}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="vg-card vg-stock-area">
                    <div className="vg-card-header">
                        <div><h3>Inventory Health</h3><p>Live distribution analysis</p></div>
                        <Package size={18} color="#00884A" />
                    </div>
                    {!stockDyn ? <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}><Sk h={50} /><Sk h={50} /><Sk h={50} /><Sk h={50} /></div> : (
                        <div className="dyn-stock-grid">
                            {[
                                { label: 'In Stock', val: stockDyn.inStock, c: 'in-stock', icon: <CheckCircle2 size={16} /> },
                                { label: 'Low Stock', val: stockDyn.lowStock, c: 'low-stock', icon: <AlertTriangle size={16} />, sub: '(≤20 units)' },
                                { label: 'Out of Stock', val: stockDyn.outOfStock, c: 'out-stock', icon: <AlertCircle size={16} /> }
                            ].map((s, i) => (
                                <div key={i} className={`dyn-stock-card ${s.c}`}>
                                    <div className="ds-icon">{s.icon}</div>
                                    <div className="ds-info">
                                        <p>{s.label} {s.sub && <span style={{ fontSize: '0.55rem', opacity: 0.6 }}>{s.sub}</span>}</p>
                                        <h3>{fmtNum(s.val)}</h3>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Row 4: Recent Orders & Best Sellers */}
            <div className="vg-bottom-grid">
                <div className="vg-card vg-orders-area">
                    <div className="vg-card-header">
                        <div><h3>Recent Orders</h3><p>Latest lifestyle acquisitions</p></div>
                        <ArrowUpRight size={18} className="vg-link-icon" />
                    </div>
                    <div className="vg-table-container">
                        <table className="vg-orders-table">
                            <thead><tr><th>Product Details</th><th>Customer</th><th>Amount</th><th>Status</th></tr></thead>
                            <tbody>
                                {loading ? [1, 2, 3, 4].map(k => <tr key={k}><td colSpan="4"><Sk h={40} /></td></tr>) : (
                                    recentOrders.map((o, i) => {
                                        const pName = o.items?.[0]?.name || 'Luxury Product';
                                        const pImg = getImageUrl(o.items?.[0]?.image) || `https://i.pravatar.cc/100?img=${i + 40}`;
                                        return (
                                            <tr key={o._id || i}>
                                                <td>
                                                    <div className="table-product">
                                                        <img src={pImg} alt="product" className="p-thumb shadow-sm" />
                                                        <div><div className="p-name">{pName}</div><div className="p-id">ORDER #{o.orderId || o._id?.substring(0, 8)}</div></div>
                                                    </div>
                                                </td>
                                                <td className="t-cell-large">{o.userId?.name || 'Guest Patron'}</td>
                                                <td><span className="t-amt">{fmtRupee(o.finalAmount)}</span></td>
                                                <td>
                                                    <span className={`vg-status ${o.orderStatus?.toLowerCase()}`}>
                                                        {o.orderStatus === 'Pending' && <Clock size={12} className="status-sub-icon" />}
                                                        {o.orderStatus === 'Processing' && <PackageCheck size={12} className="status-sub-icon" />}
                                                        {o.orderStatus === 'Shipped' && <Truck size={12} className="status-sub-icon" />}
                                                        {o.orderStatus === 'Delivered' && <CheckCircle size={12} className="status-sub-icon" />}
                                                        {o.orderStatus === 'Cancelled' && <XCircle size={12} className="status-sub-icon" />}
                                                        {o.orderStatus}
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="vg-card vg-best-sellers">
                    <div className="vg-card-header">
                        <div><h3>Best Performance</h3><p>Elite selling inventory</p></div>
                        <TrendingUp size={18} color="#00884A" />
                    </div>
                    <div className="bs-list">
                        {loading ? [1, 2, 3, 4, 5].map(k => <Sk key={k} h={64} r={12} />) : (
                            bestSellers.map((p, i) => (
                                <div key={p._id || i} className="bs-item-card">
                                    <div className="bs-img-box">
                                        <img src={getImageUrl(p.image)} alt={p.name} className="bs-thumb" />
                                        <div className="bs-rank-badge">{i + 1}</div>
                                    </div>
                                    <div className="bs-content">
                                        <div className="bs-header"><h4>{p.name}</h4><span className="bs-qty">{fmtNum(p.totalQty)} sold</span></div>
                                        <div className="bs-progress-bg">
                                            <div className="bs-progress-fill" style={{ width: `${(p.totalQty / topSellerQty) * 100}%` }} />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
