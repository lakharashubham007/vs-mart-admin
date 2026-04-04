import axios from 'axios';
import { BASE_URL as API_BASE_URL } from '../config/env';

const offerService = {
    createOffer: async (formData) => {
        const response = await axios.post(`${API_BASE_URL}/private/offers/create-offer`, formData, {
            headers: { 
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.data;
    },

    getOffers: async (params = {}) => {
        const response = await axios.get(`${API_BASE_URL}/private/offers/offer-list`, {
            params,
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        return response.data;
    },

    getActiveOffers: async () => {
        const response = await axios.get(`${API_BASE_URL}/public/offers/active`);
        return response.data;
    },

    getOfferById: async (id) => {
        const response = await axios.get(`${API_BASE_URL}/private/offers/get-by-id/${id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        return response.data;
    },

    updateOffer: async (id, formData) => {
        const response = await axios.patch(`${API_BASE_URL}/private/offers/offer-edit/${id}`, formData, {
            headers: { 
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.data;
    },

    updateOfferStatus: async (id, isActive) => {
        const response = await axios.patch(`${API_BASE_URL}/private/offers/update-offer-status/${id}`, { isActive }, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        return response.data;
    },

    deleteOffer: async (id) => {
        const response = await axios.delete(`${API_BASE_URL}/private/offers/offer-delete/${id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        return response.data;
    }
};

export default offerService;
