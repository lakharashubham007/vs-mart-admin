import apiClient from './apiClient';

const offerService = {
    getOffers: async (params) => {
        const response = await apiClient.get('/private/offers', { params });
        return response;
    },

    getOfferById: async (id) => {
        const response = await apiClient.get(`/private/offers/${id}`);
        return response;
    },

    createOffer: async (offerData) => {
        const response = await apiClient.post('/private/offers', offerData);
        return response;
    },

    updateOffer: async (id, offerData) => {
        const response = await apiClient.put(`/private/offers/${id}`, offerData);
        return response;
    },

    deleteOffer: async (id) => {
        const response = await apiClient.delete(`/private/offers/${id}`);
        return response;
    },

    toggleStatus: async (id) => {
        const response = await apiClient.patch(`/private/offers/${id}/toggle-status`);
        return response;
    },
    
    getUsageAnalytics: async (id, params) => {
        const response = await apiClient.get(`/private/offers/${id}/usage`, { params });
        return response;
    }
};

export default offerService;
