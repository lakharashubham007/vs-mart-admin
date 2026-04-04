import React, { useEffect, useState } from 'react';
import {
    Bell, CheckCheck, BellOff, Package, ShoppingBag,
    Truck, CheckCircle2, XCircle, Clock, Zap, Info, Calendar, RefreshCw
} from 'lucide-react';
import notificationService from '../../services/notificationService';
import Loader from '../../components/Loader';
import { useSocket } from '../../context/SocketContext';
import './NotificationsPage.css';

/* ── Helpers ─────────────────────────────────── */
const formatTime = (dateStr) =>
    new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const getDayLabel = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const sameDay = (a, b) =>
        a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    if (sameDay(d, today)) return 'Today';
    if (sameDay(d, yesterday)) return 'Yesterday';
    return d.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short' });
};

const getDayKey = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

const groupByDay = (notifications) => {
    const map = new Map();
    notifications.forEach(n => {
        const key = getDayKey(n.createdAt);
        if (!map.has(key)) map.set(key, { label: getDayLabel(n.createdAt), items: [] });
        map.get(key).items.push(n);
    });
    return Array.from(map.values());
};

const getIconInfo = (notif) => {
    const msg = (notif.message || '').toLowerCase();
    const t = (notif.title || '').toLowerCase();
    if (notif.type === 'PROMOTIONAL') return { icon: <Zap size={17} />, cls: 'promo' };
    if (notif.type === 'SYSTEM') return { icon: <Info size={17} />, cls: 'system' };
    if (msg.includes('delivered') || t.includes('delivered')) return { icon: <CheckCircle2 size={17} />, cls: 'delivered' };
    if (msg.includes('cancelled') || t.includes('cancelled')) return { icon: <XCircle size={17} />, cls: 'cancelled' };
    if (msg.includes('out for delivery') || t.includes('out for delivery')) return { icon: <Truck size={17} />, cls: 'out' };
    if (msg.includes('processing') || t.includes('processing')) return { icon: <Package size={17} />, cls: 'processing' };
    if (msg.includes('confirmed') || t.includes('confirmed')) return { icon: <CheckCircle2 size={17} />, cls: 'confirmed' };
    return { icon: <ShoppingBag size={17} />, cls: 'placed' };
};

/* ── Component ───────────────────────────────── */
const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [marking, setMarking] = useState(false);

    const { newNotifEvent, clearNewNotifEvent, resetUnreadCount } = useSocket();

    const fetchAll = async (showLoader = true) => {
        if (showLoader) setLoading(true); else setRefreshing(true);
        try {
            const res = await notificationService.getNotifications();
            setNotifications(res.data || []);
        } catch (e) {
            console.error('Fetch notifications error', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Initial load + reset badge
    useEffect(() => {
        fetchAll();
        resetUnreadCount();
    }, []);

    // Live socket: prepend incoming admin notifications
    useEffect(() => {
        if (!newNotifEvent) return;
        setNotifications(prev => {
            if (prev.some(n => n._id === newNotifEvent._id)) return prev;
            return [newNotifEvent, ...prev];
        });
        clearNewNotifEvent();
    }, [newNotifEvent, clearNewNotifEvent]);

    const handleMarkAll = async () => {
        setMarking(true);
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (e) { console.error(e); }
        finally { setMarking(false); }
    };

    const handleMarkOne = async (notif) => {
        if (notif.isRead) return;
        try {
            await notificationService.markAsRead(notif._id);
            setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
        } catch (e) { /* silent */ }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;
    const dayGroups = groupByDay(notifications);

    return (
        <div className="notifications-page">
            <div className="notif-card-container">

                {/* Card Header */}
                <div className="notif-card-header">
                    <div className="notif-card-header-left">
                        <div className="notif-header-icon">
                            <Bell size={20} />
                        </div>
                        <div className="notif-header-texts">
                            <h2>
                                Notifications
                                {unreadCount > 0 && (
                                    <span className="notif-unread-pill">{unreadCount} new</span>
                                )}
                            </h2>
                            <p>Last 7 days · {notifications.length} total notification{notifications.length !== 1 ? 's' : ''}</p>
                        </div>
                    </div>

                    <div className="notif-header-actions">
                        {/* Refresh button */}
                        <button
                            className="notif-refresh-btn"
                            onClick={() => fetchAll(false)}
                            disabled={refreshing}
                            title="Refresh notifications"
                        >
                            <RefreshCw size={14} className={refreshing ? 'spinning' : ''} />
                            {refreshing ? 'Refreshing…' : 'Refresh'}
                        </button>

                        {unreadCount > 0 && (
                            <button
                                className="notif-mark-all-btn"
                                onClick={handleMarkAll}
                                disabled={marking}
                            >
                                <CheckCheck size={14} />
                                Mark all read
                            </button>
                        )}
                    </div>
                </div>

                {/* Card Body */}
                <div className="notif-card-body">
                    {loading ? (
                        <div className="notif-loader"><Loader /></div>
                    ) : notifications.length === 0 ? (
                        <div className="notif-empty">
                            <div className="notif-empty-icon">
                                <BellOff size={32} color="hsl(var(--muted-foreground))" />
                            </div>
                            <h3>No Notifications</h3>
                            <p>No order notifications in the last 7 days. They will appear here when customers place or update orders.</p>
                        </div>
                    ) : (
                        dayGroups.map(group => (
                            <div key={group.label} className="notif-day-group">
                                <div className="notif-day-header">
                                    <div className={`notif-day-badge ${group.label === 'Today' ? 'today-badge' : ''}`}>
                                        <Calendar size={11} />
                                        {group.label}
                                    </div>
                                    <div className="notif-day-line" />
                                    <span className="notif-day-count">
                                        {group.items.length} item{group.items.length !== 1 ? 's' : ''}
                                    </span>
                                </div>

                                {group.items.map(notif => {
                                    const { icon, cls } = getIconInfo(notif);
                                    return (
                                        <div
                                            key={notif._id}
                                            className={`notif-item ${!notif.isRead ? 'unread' : ''}`}
                                            onClick={() => handleMarkOne(notif)}
                                        >
                                            <div className={`notif-item-icon ${cls}`}>{icon}</div>
                                            <div className="notif-item-body">
                                                <div className="notif-item-top">
                                                    <span className="notif-item-title">{notif.title}</span>
                                                    <div className="notif-item-time">
                                                        <Clock size={10} />
                                                        {formatTime(notif.createdAt)}
                                                    </div>
                                                </div>
                                                <div className="notif-item-msg">{notif.message}</div>
                                            </div>
                                            {!notif.isRead && <div className="notif-dot" />}
                                        </div>
                                    );
                                })}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationsPage;
