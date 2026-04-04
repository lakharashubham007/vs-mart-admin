import apiClient from './apiClient';

const orderService = {
    getOrders: async (params) => {
        const queryParams = new URLSearchParams(params).toString();
        return await apiClient(`/private/orders/admin/get-all-orders?${queryParams}`);
    },

    updateOrderStatus: async (orderId, status) => {
        return await apiClient(`/private/orders/${orderId}/status`, {
            method: 'PATCH',
            body: { status }
        });
    },

    getOrderDetails: async (orderId) => {
        return await apiClient(`/private/orders/${orderId}`);
    }
};

export default orderService;
