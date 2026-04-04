import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

/* A simple short beep generated via Web Audio API — no file needed */
const playBeep = () => {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
        console.warn('Audio beep failed:', e);
    }
};

export const SocketProvider = ({ children }) => {
    const { token } = useAuth();
    const socketRef = useRef(null);

    // Shared state that any component can subscribe to
    const [newOrderEvent, setNewOrderEvent] = useState(null);       // latest new_order payload
    const [newNotifEvent, setNewNotifEvent] = useState(null);       // latest new_notification payload
    const [adminUnreadCount, setAdminUnreadCount] = useState(0);    // live unread badge count

    const connect = useCallback(() => {
        if (socketRef.current?.connected) return; // already connected

        const socketUrl = `${window.location.protocol}//${window.location.hostname}:5000`;
        console.log('📡 [SocketContext] Connecting to', socketUrl);

        const socket = io(socketUrl, {
            transports: ['websocket'],
            upgrade: false,
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 2000,
        });

        socket.on('connect', () => {
            console.log('✅ [SocketContext] Connected, joining admin_room');
            socket.emit('join_admin');
        });

        socket.on('connect_error', (err) => {
            console.error('❌ [SocketContext] Connection error:', err.message);
        });

        socket.on('disconnect', (reason) => {
            console.warn('⚡ [SocketContext] Disconnected:', reason);
        });

        /* ── New order placed by a customer ── */
        socket.on('new_order', (order) => {
            console.log('🛒 [SocketContext] new_order', order);
            playBeep();
            toast.success(`New Order! #VS${(order._id || '').slice(-6).toUpperCase()}`, {
                duration: 6000,
                icon: '🛒',
            });
            setAdminUnreadCount(prev => prev + 1); // bump badge (no new_notification emitted for new orders)
            setNewOrderEvent(order);
        });

        /* ── Admin notification (order status changes / new order) ── */
        socket.on('new_notification', (notif) => {
            console.log('🔔 [SocketContext] new_notification', notif);
            setAdminUnreadCount(prev => prev + 1);
            setNewNotifEvent(notif);
        });

        socketRef.current = socket;
    }, []);

    const disconnect = useCallback(() => {
        socketRef.current?.disconnect();
        socketRef.current = null;
    }, []);

    useEffect(() => {
        if (token) {
            connect();
        } else {
            disconnect();
        }
        return () => {
            // Don't disconnect on re-render, only on unmount of whole provider
        };
    }, [token, connect]);

    // Expose helpers to clear events after consuming
    const clearNewOrderEvent = useCallback(() => setNewOrderEvent(null), []);
    const clearNewNotifEvent = useCallback(() => setNewNotifEvent(null), []);
    const resetUnreadCount = useCallback(() => setAdminUnreadCount(0), []);
    const incrementUnread = useCallback(() => setAdminUnreadCount(prev => prev + 1), []);

    return (
        <SocketContext.Provider value={{
            socket: socketRef,
            newOrderEvent,
            newNotifEvent,
            adminUnreadCount,
            clearNewOrderEvent,
            clearNewNotifEvent,
            resetUnreadCount,
            setAdminUnreadCount,
        }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const ctx = useContext(SocketContext);
    if (!ctx) throw new Error('useSocket must be used within SocketProvider');
    return ctx;
};
