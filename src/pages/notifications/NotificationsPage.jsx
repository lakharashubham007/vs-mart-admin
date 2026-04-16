import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bell, CheckCheck, BellOff, Package, ShoppingBag,
    Truck, CheckCircle2, XCircle, Clock, Zap, Info,
    Calendar, RefreshCw, Send, Users, Globe, History,
    ChevronDown, X, AlertCircle, CheckCircle
} from 'lucide-react';
import notificationService from '../../services/notificationService';
import customerService from '../../services/customerService';
import Loader from '../../components/Loader';
import CustomSelect from '../../components/CustomSelect';
import { useSocket } from '../../context/SocketContext';
import './NotificationsPage.css';
import './SendPushPage.css';

/* ─────────── Helpers ─────────── */
const formatTime = (dateStr) =>
    new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });

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
    const type = notif.type;

    if (type === 'NEW_ASSIGNMENT' || msg.includes('assigned') || t.includes('assigned')) return { icon: <Truck size={17} />, cls: 'out' };
    if (type === 'PROMOTIONAL') return { icon: <Zap size={17} />, cls: 'promo' };
    if (type === 'SYSTEM') return { icon: <Info size={17} />, cls: 'system' };
    
    if (msg.includes('delivered') || t.includes('delivered')) return { icon: <CheckCircle2 size={17} />, cls: 'delivered' };
    if (msg.includes('cancelled') || t.includes('cancelled')) return { icon: <XCircle size={17} />, cls: 'cancelled' };
    if (msg.includes('out for delivery') || t.includes('out for delivery')) return { icon: <Truck size={17} />, cls: 'out' };
    if (msg.includes('processing') || t.includes('processing')) return { icon: <Package size={17} />, cls: 'processing' };
    if (msg.includes('confirmed') || t.includes('confirmed')) return { icon: <CheckCircle2 size={17} />, cls: 'confirmed' };
    return { icon: <ShoppingBag size={17} />, cls: 'placed' };
};

/* ─────────── Screen Options ─────────── */
const SCREEN_OPTIONS = [
    { value: 'Notification', label: '🔔 Notification Center', paramKey: null,        paramLabel: null },
    { value: 'OrderDetails', label: '📦 Order Details',       paramKey: 'orderId',   paramLabel: 'Order ID' },
    { value: 'MyOrders',     label: '🛒 My Orders',           paramKey: null,        paramLabel: null },
    { value: 'OfferDetails', label: '🏷️ Offers & Coupons',   paramKey: 'offerId',   paramLabel: 'Offer ID' },
    { value: 'ProductDetails',label: '🛍️ Product Details',   paramKey: 'productId', paramLabel: 'Product ID' },
    { value: 'Chat',         label: '💬 Chat',                paramKey: 'userId',    paramLabel: 'User ID' },
    { value: 'Tabs',         label: '🏠 Home Screen',         paramKey: null,        paramLabel: null },
];

const TOPIC_OPTIONS = [
    { value: '',       label: '👥 All Users', desc: 'Send to every registered user' },
    { value: 'offers', label: '🏷️ Offers',   desc: 'Users subscribed to offers & deals' },
    { value: 'orders', label: '📦 Orders',   desc: 'Users with active/recent orders' },
    { value: 'general',label: '📢 General',  desc: 'General announcements topic' },
];

/* ─────────── Toast Component ─────────── */
const InlineToast = ({ type, message, onClose }) => (
    <div className={`inline-toast inline-toast--${type}`}>
        {type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
        <span>{message}</span>
        <button onClick={onClose} className="inline-toast-close"><X size={14} /></button>
    </div>
);

/* ─────────── Send Push Panel ─────────── */
const SendPushPanel = () => {
    const [title, setTitle]             = useState('');
    const [message, setMessage]         = useState('');
    const [targetMode, setTargetMode]   = useState('all'); // 'all' | 'selected' | 'topic'
    const [topic, setTopic]             = useState('');
    const [screen, setScreen]           = useState('Notification');
    const [extraParam, setExtraParam]   = useState('');
    const [customers, setCustomers]     = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [userSearch, setUserSearch]   = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [sending, setSending]         = useState(false);
    const [toast, setToast]             = useState(null);
    const [history, setHistory]         = useState([]);
    const [historyLoading, setHistoryLoading] = useState(true);

    const triggerRef        = useRef(null);
    const dropdownRef       = useRef(null);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

    // Recipients Modal State
    const [recipientModal, setRecipientModal] = useState({ show: false, id: null, title: '' });
    const [recipients, setRecipients]         = useState([]);
    const [recipientsLoading, setRecipientsLoading] = useState(false);

    const selectedScreen = SCREEN_OPTIONS.find(s => s.value === screen);
    const needsParam     = !!selectedScreen?.paramKey;

    // ── Open user-select dropdown (position:fixed — viewport coords, no scrollY needed)
    const openDropdown = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setDropdownPos({ top: rect.bottom + 6, left: rect.left, width: rect.width });
        }
        setShowDropdown(true);
    };

    useEffect(() => {
        if (!showDropdown) return;
        const handler = (e) => {
            if (
                dropdownRef.current && !dropdownRef.current.contains(e.target) &&
                triggerRef.current  && !triggerRef.current.contains(e.target)
            ) setShowDropdown(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showDropdown]);

    // ── Fetch customers
    useEffect(() => {
        customerService.getCustomers({ limit: 500, page: 1 })
            .then(res => {
                const raw = res?.data?.users ?? res?.data?.customers ?? res?.data?.data ?? res?.data ?? res ?? [];
                setCustomers(Array.isArray(raw) ? raw : []);
            })
            .catch(() => setCustomers([]));
    }, []);

    // ── Fetch history
    const fetchHistory = useCallback(async () => {
        setHistoryLoading(true);
        try {
            const res = await notificationService.getPushHistory();
            setHistory(res.data || []);
        } catch { /* silent */ }
        finally { setHistoryLoading(false); }
    }, []);

    useEffect(() => { fetchHistory(); }, [fetchHistory]);

    const showToast = (type, msg) => {
        setToast({ type, message: msg });
        setTimeout(() => setToast(null), 5000);
    };

    const filteredCustomers = customers.filter(c =>
        (c.name || c.phone || '').toLowerCase().includes(userSearch.toLowerCase()) ||
        (c.phone || '').includes(userSearch)
    );

    const toggleUser = (id) =>
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    // ── Fetch Recipients for Modal ──
    const handleViewRecipients = async (id, title) => {
        setRecipientModal({ show: true, id, title });
        setRecipientsLoading(true);
        try {
            const res = await notificationService.getHistoryRecipients(id);
            setRecipients(res.recipients || []);
        } catch { /* silent */ }
        finally { setRecipientsLoading(false); }
    };

    // ── Validation + Send
    const handleSend = async () => {
        if (!title.trim())   return showToast('error', 'Notification title is required');
        if (!message.trim()) return showToast('error', 'Notification message is required');
        if (targetMode === 'selected' && selectedIds.length === 0)
            return showToast('error', 'Please select at least one user');
        if (needsParam && !extraParam.trim())
            return showToast('error', `${selectedScreen.paramLabel} is required for "${selectedScreen.label}" screen`);

        setSending(true);
        try {
            const payload = {
                title:   title.trim(),
                message: message.trim(),
                screen,
                // dynamic param (orderId / offerId / productId / userId)
                ...(needsParam && extraParam ? { [selectedScreen.paramKey]: extraParam.trim() } : {}),
            };
            if (targetMode === 'topic')    payload.topic   = topic || 'all_users';
            if (targetMode === 'selected') payload.userIds = selectedIds;

            const res = await notificationService.sendPushNotification(payload);
            showToast('success', res.message || 'Notification sent successfully!');

            // Reset
            setTitle(''); setMessage(''); setScreen('Notification');
            setExtraParam(''); setSelectedIds([]); setUserSearch('');
            fetchHistory();
        } catch (err) {
            showToast('error', err.message || 'Failed to send notification');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="spn-wrapper">
            {/* ── Form Card ── */}
            <div className="spn-card">
                <div className="spn-card-header">
                    <div className="spn-header-icon"><Send size={18} /></div>
                    <div>
                        <h3>Send Push Notification</h3>
                        <p>Broadcast a message to users' devices instantly</p>
                    </div>
                </div>

                {toast && <InlineToast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

                <div className="spn-form">

                    {/* ── Title ── */}
                    <div className="spn-field">
                        <label>Notification Title <span className="required">*</span></label>
                        <input
                            type="text" className="spn-input"
                            placeholder="e.g. ⚡ Flash Sale is Live!"
                            value={title} onChange={e => setTitle(e.target.value)} maxLength={100}
                        />
                        <span className="spn-char-count">{title.length}/100</span>
                    </div>

                    {/* ── Message ── */}
                    <div className="spn-field">
                        <label>Message <span className="required">*</span></label>
                        <textarea
                            className="spn-textarea"
                            placeholder="e.g. Get up to 50% off on all products. Shop now!"
                            value={message} onChange={e => setMessage(e.target.value)}
                            rows={3} maxLength={300}
                        />
                        <span className="spn-char-count">{message.length}/300</span>
                    </div>

                    {/* ── Navigate To Screen ── */}
                    <div className="spn-field">
                        <label className="spn-label-row">
                            <span>📱 Navigate To Screen</span>
                            <span className="spn-label-hint">Where app opens when tapped</span>
                        </label>
                        {/* ── CustomSelect Component ── */}
                        <CustomSelect
                            options={SCREEN_OPTIONS.map(s => ({
                                value: s.value,
                                label: s.label
                            }))}
                            value={screen}
                            onChange={(val) => {
                                setScreen(val);
                                setExtraParam('');
                            }}
                            placeholder="Select Destination Screen"
                        />

                        {/* Dynamic param field */}
                        {needsParam && (
                            <div className="spn-param-field">
                                <input
                                    type="text" className="spn-input"
                                    placeholder={`Enter ${selectedScreen.paramLabel} *`}
                                    value={extraParam}
                                    onChange={e => setExtraParam(e.target.value)}
                                />
                                <span className="spn-char-count spn-required-hint">
                                    Required — app navigates to this specific {selectedScreen.label}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* ── Send To ── */}
                    <div className="spn-field">
                        <label>Send To</label>
                        <div className="spn-target-tabs">
                            <button
                                className={`spn-target-tab ${targetMode === 'all' ? 'active' : ''}`}
                                onClick={() => setTargetMode('all')}
                            >
                                <Globe size={14} /> All Users
                            </button>
                            <button
                                className={`spn-target-tab ${targetMode === 'selected' ? 'active' : ''}`}
                                onClick={() => setTargetMode('selected')}
                            >
                                <Users size={14} /> Select Users
                            </button>
                            <button
                                className={`spn-target-tab ${targetMode === 'topic' ? 'active' : ''}`}
                                onClick={() => setTargetMode('topic')}
                            >
                                <Zap size={14} /> Topic
                            </button>
                        </div>
                    </div>

                    {/* ── Topic Selector ── */}
                    {targetMode === 'topic' && (
                        <div className="spn-field">
                            <label>Select Topic</label>
                            <div className="spn-topic-grid">
                                {TOPIC_OPTIONS.map(t => (
                                    <div
                                        key={t.value}
                                        className={`spn-topic-card ${topic === t.value ? 'active' : ''}`}
                                        onClick={() => setTopic(t.value)}
                                    >
                                        <span className="spn-topic-label">{t.label}</span>
                                        <span className="spn-topic-desc">{t.desc}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── User Multi-Select ── */}
                    {targetMode === 'selected' && (
                        <div className="spn-field">
                            <label>
                                Select Users <span className="spn-badge">{selectedIds.length} selected</span>
                            </label>

                            {selectedIds.length > 0 && (
                                <div className="spn-pills">
                                    {selectedIds.map(id => {
                                        const u = customers.find(c => c._id === id);
                                        return (
                                            <span key={id} className="spn-pill">
                                                {u?.name || u?.phone || id}
                                                <button onClick={() => toggleUser(id)}><X size={11} /></button>
                                            </span>
                                        );
                                    })}
                                    <button className="spn-clear-all" onClick={() => setSelectedIds([])}>Clear all</button>
                                </div>
                            )}

                            <div className="spn-dropdown-wrapper">
                                <div
                                    ref={triggerRef}
                                    className="spn-dropdown-trigger"
                                    onClick={() => showDropdown ? setShowDropdown(false) : openDropdown()}
                                >
                                    <span>Search &amp; select users…</span>
                                    <ChevronDown size={14} className={showDropdown ? 'rotate-180' : ''} />
                                </div>
                                {showDropdown && (
                                    <div
                                        ref={dropdownRef}
                                        className="spn-dropdown"
                                        style={{ position: 'fixed', top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}
                                    >
                                        <input
                                            type="text" className="spn-dropdown-search"
                                            placeholder="Search by name or phone…"
                                            value={userSearch} onChange={e => setUserSearch(e.target.value)}
                                            autoFocus
                                        />
                                        <div className="spn-dropdown-list">
                                            {filteredCustomers.length === 0
                                                ? <div className="spn-dropdown-empty">No users found</div>
                                                : filteredCustomers.slice(0, 100).map(c => (
                                                    <div
                                                        key={c._id}
                                                        className={`spn-dropdown-item ${selectedIds.includes(c._id) ? 'selected' : ''}`}
                                                        onMouseDown={e => { e.preventDefault(); toggleUser(c._id); }}
                                                    >
                                                        <div className="spn-user-avatar">{(c.name || c.phone || '?')[0].toUpperCase()}</div>
                                                        <div>
                                                            <div className="spn-user-name">{c.name || 'No Name'}</div>
                                                            <div className="spn-user-phone">{c.phone}</div>
                                                        </div>
                                                        {selectedIds.includes(c._id) && <CheckCircle2 size={16} className="spn-check-icon" />}
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── Send Button ── */}
                    <button className="spn-send-btn" onClick={handleSend} disabled={sending}>
                        {sending
                            ? <><div className="spn-spinner" /> Sending…</>
                            : <><Send size={16} /> Send Notification</>
                        }
                    </button>
                </div>
            </div>

            {/* ── History Card ── */}
            <div className="spn-card spn-history-card">
                <div className="spn-card-header">
                    <div className="spn-header-icon spn-header-icon--history"><History size={18} /></div>
                    <div>
                        <h3>Send History</h3>
                        <p>Recent push notifications sent from admin</p>
                    </div>
                    <button className="spn-refresh-btn" onClick={fetchHistory} title="Refresh">
                        <RefreshCw size={14} />
                    </button>
                </div>

                <div className="spn-history-list">
                    {historyLoading ? (
                        <div className="spn-history-loader"><Loader /></div>
                    ) : history.length === 0 ? (
                        <div className="spn-history-empty">
                            <History size={32} opacity={0.3} />
                            <p>No notifications sent yet</p>
                        </div>
                    ) : history.map(h => (
                        <div key={h._id} className="spn-history-item">
                            <div className={`spn-history-icon ${h.targetType}`}>
                                {h.targetType === 'topic' ? <Zap size={14} /> :
                                    h.targetType === 'selected' ? <Users size={14} /> :
                                        <Globe size={14} />}
                            </div>
                            <div className="spn-history-body">
                                <div className="spn-history-title">{h.title}</div>
                                <div className="spn-history-msg">{h.message}</div>
                                <div className="spn-history-meta">
                                    <span 
                                        className={`spn-target-badge spn-target-badge--${h.targetType} ${h.targetType !== 'topic' ? 'clickable' : ''}`}
                                        onClick={() => h.targetType !== 'topic' && handleViewRecipients(h._id, h.title)}
                                    >
                                        {h.targetType === 'all' ? 'All Users' :
                                            h.targetType === 'topic' ? `Topic: ${h.topic}` :
                                                `${h.targetUsers?.length || 0} users`}
                                    </span>
                                    <span className="spn-history-date">
                                        <Clock size={10} /> {formatDate(h.createdAt)} {formatTime(h.createdAt)}
                                    </span>
                                </div>
                                {/* Navigation Target Display */}
                                <div className="spn-history-target-info">
                                    <span className="spn-label">🎯 Target:</span>
                                    <span className="spn-value">
                                        {h.screen || 'Notification'} 
                                        {h.orderId && ` (Order: #${h.orderId.slice(-6)})`}
                                        {h.offerId && ` (Offer: ${h.offerId})`}
                                        {h.productId && ` (Product: ${h.productId})`}
                                    </span>
                                </div>
                            </div>
                            <div className="spn-history-stats">
                                <span className="spn-stat spn-stat--success">✓ {h.successCount}</span>
                                {h.failureCount > 0 && (
                                    <span className="spn-stat spn-stat--fail">✗ {h.failureCount}</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Recipients Modal ── */}
            {recipientModal.show && (
                <RecipientsModal 
                    title={recipientModal.title}
                    loading={recipientsLoading}
                    users={recipients}
                    onClose={() => {
                        setRecipientModal({ show: false, id: null, title: '' });
                        setRecipients([]);
                    }}
                />
            )}
        </div>
    );
};

/* ─────────── Recipients Modal Component ─────────── */
const RecipientsModal = ({ title, loading, users, onClose }) => {
    const [search, setSearch] = useState('');
    const filtered = users.filter(u => 
        (u.name || '').toLowerCase().includes(search.toLowerCase()) || 
        (u.phone || '').includes(search)
    );

    return (
        <div className="spn-modal-overlay" onClick={onClose}>
            <div className="spn-modal" onClick={e => e.stopPropagation()}>
                <div className="spn-modal-header">
                    <h3>Recipients — {title}</h3>
                    <button onClick={onClose}><X size={18} /></button>
                </div>
                <div 
                    className="spn-modal-search"
                    style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        background: 'hsl(var(--secondary) / 0.3)', 
                        border: '1px solid hsl(var(--border) / 0.5)',
                        borderRadius: '10px',
                        paddingLeft: '10px',
                        margin: '1rem',
                        transition: 'all 0.3s ease'
                    }}
                >
                    <Search 
                        size={16} 
                        style={{ 
                            color: 'hsl(var(--muted-foreground))', 
                            flexShrink: 0,
                            marginRight: '8px'
                        }} 
                    />
                    <input 
                        type="text" 
                        placeholder="Search recipients..." 
                        value={search} 
                        onChange={e => setSearch(e.target.value)}
                        autoFocus
                        style={{
                            flex: 1,
                            padding: '0.6rem 0',
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            color: 'hsl(var(--foreground))',
                            fontSize: '0.9rem'
                        }}
                    />
                </div>
                <div className="spn-modal-body">
                    {loading ? <div className="spn-modal-loader"><Loader /></div> : 
                     filtered.length === 0 ? <div className="spn-modal-empty">No users found</div> :
                     filtered.map(u => (
                        <div key={u._id} className="spn-recipient-row">
                            <div className="spn-recipient-avatar">{u.name?.charAt(0) || '?'}</div>
                            <div className="spn-recipient-info">
                                <div className="spn-recipient-name">{u.name || 'Unknown User'}</div>
                                <div className="spn-recipient-phone">{u.phone || 'No phone'}</div>
                            </div>
                        </div>
                     ))}
                </div>
                <div className="spn-modal-footer">
                    Total: {users.length} recipients
                </div>
            </div>
        </div>
    );
};

/* ─────────── Main NotificationsPage ─────────── */
const NotificationsPage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('inbox'); // 'inbox' | 'send'
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [marking, setMarking] = useState(false);

    const { newNotifEvent, clearNewNotifEvent, newOrderEvent, resetUnreadCount } = useSocket();

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

    useEffect(() => {
        fetchAll();
        resetUnreadCount();
    }, []);

    useEffect(() => {
        if (!newNotifEvent) return;
        setNotifications(prev => {
            if (prev.some(n => n._id === newNotifEvent._id)) return prev;
            return [newNotifEvent, ...prev];
        });
        clearNewNotifEvent();
    }, [newNotifEvent, clearNewNotifEvent]);

    useEffect(() => {
        if (!newOrderEvent) return;
        fetchAll(false);
    }, [newOrderEvent]);

    const handleMarkAll = async () => {
        setMarking(true);
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (e) { console.error(e); }
        finally { setMarking(false); }
    };

    const handleMarkOne = async (notif) => {
        if (!notif.isRead) {
            try {
                await notificationService.markAsRead(notif._id);
                setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
            } catch (e) { /* silent */ }
        }

        // Navigate if order-related
        if (notif.orderId || notif.type === 'ORDER' || (notif.title || '').toLowerCase().includes('order')) {
            navigate('/orders');
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;
    const dayGroups = groupByDay(notifications);

    return (
        <div className="notifications-page">

            {/* ── Tab Bar ── */}
            <div className="notif-tabs">
                <button
                    className={`notif-tab-btn ${activeTab === 'inbox' ? 'active' : ''}`}
                    onClick={() => setActiveTab('inbox')}
                >
                    <Bell size={15} />
                    Order Notifications
                    {unreadCount > 0 && <span className="notif-tab-badge">{unreadCount}</span>}
                </button>
                {localStorage.getItem('role') === 'Super Admin' && (
                    <button
                        className={`notif-tab-btn ${activeTab === 'send' ? 'active' : ''}`}
                        onClick={() => setActiveTab('send')}
                    >
                        <Send size={15} />
                        Send Push
                    </button>
                )}
            </div>

            {/* ── Inbox Tab ── */}
            {activeTab === 'inbox' && (
                <div className="notif-card-container">
                    <div className="notif-card-header">
                        <div className="notif-card-header-left">
                            <div className="notif-header-icon"><Bell size={20} /></div>
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
                                                    {notif.senderName && (
                                                        <div className="notif-item-sender">
                                                            <Users size={12} />
                                                            <span>By {notif.senderName}</span>
                                                        </div>
                                                    )}
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
            )}

            {/* ── Send Push Tab ── */}
            {activeTab === 'send' && localStorage.getItem('role') === 'Super Admin' && <SendPushPanel />}
        </div>
    );
};

export default NotificationsPage;
