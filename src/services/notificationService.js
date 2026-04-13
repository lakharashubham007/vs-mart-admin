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

    /**
     * Send a push notification from the admin panel.
     * @param {object} payload - { title, message, userIds?, topic? }
     *   - userIds: string[] — send to specific users (omit for broadcast to all)
     *   - topic: string — send to FCM topic (e.g. "all_users", "offers")
     */
    sendPushNotification: async (payload) => {
        return await apiClient('/private/push-notifications/send', {
            method: 'POST',
            body: payload,
        });
    },

    /** Get push notification send history (admin-sent broadcasts) */
    getPushHistory: async () => {
        return await apiClient('/private/push-notifications/history');
    },

    /** Fetch specific recipients for a history record */
    getHistoryRecipients: async (historyId) => {
        return await apiClient(`/private/push-notifications/history/${historyId}/recipients`);
    },
};

export default notificationService;
