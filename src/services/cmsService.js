import apiClient from './apiClient';

const cmsService = {
    getAllCMS: async () => {
        return await apiClient('/private/cms');
    },
    getCMSByType: async (type) => {
        return await apiClient(`/private/cms/${type}`);
    },
    updateCMS: async (type, data) => {
        return await apiClient(`/private/cms/${type}`, {
            method: 'PUT',
            body: data
        });
    },
    deleteCMS: async (type) => {
        return await apiClient(`/private/cms/${type}`, {
            method: 'DELETE'
        });
    }
};

export default cmsService;
