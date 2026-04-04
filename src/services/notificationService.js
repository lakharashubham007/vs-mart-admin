import apiClient from './apiClient';

const notificationService = {
    /** Get all notifications for logged-in admin (sorted newest first) */
    getNotifications: async () => {
        return await apiClient('/private/notifications');
    },

    /** Get only today's notifications */
    getTodayNotifications: async () => {
        return await apiClient('/private/notifications?filter=today');
    },

    /** Mark a specific notification as read */
    markAsRead: async (id) => {
        return await apiClient(`/private/notifications/${id}/read`, { method: 'PATCH' });
    },

    /** Mark all notifications as read */
    markAllAsRead: async () => {
        return await apiClient('/private/notifications/read-all', { method: 'PATCH' });
    },
};

export default notificationService;
