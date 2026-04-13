import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { BASE_IMAGE_URL } from '../config/env';

const SocketContext = createContext(null);

/* Play notification sound */
const playBeep = () => {
    try {
        const audio = new Audio('/notification.mp3');
        audio.play().catch(e => console.warn('Audio play failed:', e));
    } catch (e) {
        console.warn('Audio beep failed:', e);
    }
};

export const SocketProvider = ({ children }) => {
    const { token, user } = useAuth();
    const socketRef = useRef(null);

    // Shared state
    const [newOrderEvent, setNewOrderEvent] = useState(null);
    const [newNotifEvent, setNewNotifEvent] = useState(null);
    const [adminUnreadCount, setAdminUnreadCount] = useState(0);

    const connect = useCallback(() => {
        if (socketRef.current) return;

        const socketUrl = BASE_IMAGE_URL;
        console.log('📡 [SocketContext] Connecting to', socketUrl);

        const socket = io(socketUrl, {
            transports: ['websocket'],
            upgrade: false,
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 2000,
        });

        socket.on('connect', () => {
            const adminId = user?._id || user?.id || localStorage.getItem('adminId');
            const role = localStorage.getItem('role');
            
            if (adminId) {
                console.log('🔑 [SocketContext] Emitting rooms for ID:', adminId);
                // Only management roles should join admin_room
                if (role === 'Super Admin' || role === 'Admin') {
                    socket.emit('join_admin', adminId);
                }
                // Everyone joins their personal user room for targeted notifications
                socket.emit('join_user', adminId);
            }
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
            setAdminUnreadCount(prev => prev + 1);
            setNewOrderEvent(order);
        });

        /* ── Admin notification (order status changes) ── */
        socket.on('new_notification', (notif) => {
            console.log('🔔 [SocketContext] new_notification', notif);
            setAdminUnreadCount(prev => prev + 1);
            setNewNotifEvent(notif);
        });
        
        /* ── Targeted assignment for delivery boys ── */
        socket.on('new_assignment', (data) => {
            console.log('🚚 [SocketContext] new_assignmentReceived:', data);
            playBeep();
            const orderNum = data.assignment?.orderNumber || (data.assignment?.orderId || '').slice(-6).toUpperCase();
            toast.success(`New Assignment! Order #VS${orderNum} has been assigned to you.`, {
                duration: 8000,
                icon: '🚚',
            });
            setAdminUnreadCount(prev => prev + 1);
        });

        socketRef.current = socket;
    }, [user]); // Depend on user so connect can see it

    const disconnect = useCallback(() => {
        socketRef.current?.disconnect();
        socketRef.current = null;
    }, []);

    // Effect to join rooms when user becomes available if not already joined
    useEffect(() => {
        if (socketRef.current?.connected && user) {
            const adminId = user._id || user.id;
            const role = localStorage.getItem('role');
            console.log('🔄 [SocketContext] Profile sync for ID:', adminId);
            
            if (role === 'Super Admin' || role === 'Admin') {
                socketRef.current.emit('join_admin', adminId);
            }
            socketRef.current.emit('join_user', adminId);
        }
    }, [user]);

    useEffect(() => {
        if (token) {
            connect();
        } else {
            disconnect();
        }
        return () => {
            disconnect();
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
