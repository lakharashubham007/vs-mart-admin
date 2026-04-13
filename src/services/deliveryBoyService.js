import apiClient from './apiClient';

const BASE_MODULE = '/admin/delivery-boy';

const deliveryBoyService = {
    getAll: async (params) => {
        const query = new URLSearchParams(params).toString();
        return await apiClient(`${BASE_MODULE}/list?${query}`);
    },

    getById: async (id) => {
        return await apiClient(`${BASE_MODULE}/${id}`);
    },

    create: async (formData) => {
        return await apiClient(`${BASE_MODULE}/create`, {
            method: 'POST',
            body: formData
        });
    },

    update: async (id, formData) => {
        return await apiClient(`${BASE_MODULE}/update/${id}`, {
            method: 'PUT',
            body: formData
        });
    },

    delete: async (id) => {
        return await apiClient(`${BASE_MODULE}/delete/${id}`, {
            method: 'DELETE'
        });
    },

    toggleStatus: async (id, status) => {
        return await apiClient(`${BASE_MODULE}/toggle-status/${id}`, {
            method: 'PATCH',
            body: { status }
        });
    },

    assignOrder: async (orderId, deliveryBoyId) => {
        return await apiClient(`${BASE_MODULE}/assign-delivery`, {
            method: 'POST',
            body: { orderId, deliveryBoyId }
        });
    },

    getAssignments: async (params) => {
        const query = new URLSearchParams(params).toString();
        return await apiClient(`${BASE_MODULE}/assignments?${query}`);
    },

    updateAssignmentStatus: async (id, status) => {
        return await apiClient(`${BASE_MODULE}/assignments/${id}/status`, {
            method: 'PATCH',
            body: { status }
        });
    },

    getAssignmentStats: async () => {
        return await apiClient(`${BASE_MODULE}/assignments/stats`);
    }
};

export default deliveryBoyService;
