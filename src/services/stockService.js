import axios from 'axios';
import { BASE_URL } from '../config/env';

const API_URL = `${BASE_URL}/private/stock`;

const getAuthHeaders = () => ({
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
});

const stockService = {
    addStockIn: async (data) => {
        const response = await axios.post(`${API_URL}/`, data, getAuthHeaders());
        return response.data;
    },

    getStockInRecords: async (params) => {
        const response = await axios.get(`${API_URL}/`, {
            ...getAuthHeaders(),
            params
        });
        return response.data;
    },

    getStockHistory: async (productId, variantId) => {
        const response = await axios.get(`${API_URL}/history`, {
            ...getAuthHeaders(),
            params: { productId, variantId }
        });
        return response.data;
    },

    updateStockIn: async (id, data) => {
        const response = await axios.put(`${API_URL}/${id}`, data, getAuthHeaders());
        return response.data;
    },

    getStockInById: async (id) => {
        const response = await axios.get(`${API_URL}/${id}`, getAuthHeaders());
        return response.data;
    }
};

export default stockService;
