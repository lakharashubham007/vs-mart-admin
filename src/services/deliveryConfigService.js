import apiClient from './apiClient';

const deliveryConfigService = {
    getDeliveryConfigs: (params = {}) => {
        const queryParams = new URLSearchParams(params).toString();
        return apiClient(`/private/delivery-configs?${queryParams}`);
    },

    getDeliveryConfigById: (id) => apiClient(`/private/delivery-configs/${id}`),

    createDeliveryConfig: (data) => apiClient("/private/delivery-configs", {
        method: 'POST',
        body: data
    }),

    updateDeliveryConfig: (id, data) => apiClient(`/private/delivery-configs/${id}`, {
        method: 'PUT',
        body: data
    }),

    deleteDeliveryConfig: (id) => apiClient(`/private/delivery-configs/${id}`, {
        method: 'DELETE'
    }),

    toggleStatus: (id) => apiClient(`/private/delivery-configs/${id}/status`, {
        method: 'PATCH'
    })
};

export default deliveryConfigService;
