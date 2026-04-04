import axios from 'axios';
import { BASE_URL as API_BASE_URL } from '../config/env';

const bannerService = {
    /**
     * Get all banners for admin list
     */
    getBanners: async (params = {}) => {
        const response = await axios.get(`${API_BASE_URL}/private/banners/banner-list`, {
            params,
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        return response.data;
    },

    /**
     * Create a new banner with image upload
     */
    createBanner: async (formData) => {
        const response = await axios.post(`${API_BASE_URL}/private/banners/create-banner`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.data;
    },

    /**
     * Get banner by id
     */
    getBannerById: async (id) => {
        const response = await axios.get(`${API_BASE_URL}/private/banners/get-by-id/${id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        return response.data;
    },

    /**
     * Update an existing banner
     */
    updateBanner: async (id, formData) => {
        const response = await axios.patch(`${API_BASE_URL}/private/banners/banner-edit/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.data;
    },

    /**
     * Update banner active status
     */
    updateBannerStatus: async (id, isActive) => {
        const response = await axios.patch(`${API_BASE_URL}/private/banners/update-banner-status/${id}`, { isActive }, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        return response.data;
    },

    /**
     * Delete a banner
     */
    deleteBanner: async (id) => {
        const response = await axios.delete(`${API_BASE_URL}/private/banners/banner-delete/${id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        return response.data;
    },

    /**
     * Get active banners for mobile app sync
     */
    getActiveBanners: async () => {
        const response = await axios.get(`${API_BASE_URL}/public/banners/active`);
        return response.data;
    }
};

export default bannerService;
