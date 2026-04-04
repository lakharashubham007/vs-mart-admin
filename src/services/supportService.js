import apiClient from './apiClient';

const supportService = {
    getAllSupport: async () => {
        return await apiClient('/private/support/get-supports');
    },

    getSupportById: async (id) => {
        return await apiClient(`/private/support/get-support/${id}`);
    },

    createSupport: async (data) => {
        return await apiClient('/private/support/create-support', {
            method: 'POST',
            body: data,
        });
    },

    updateSupport: async (id, data) => {
        return await apiClient(`/private/support/update-support/${id}`, {
            method: 'PUT',
            body: data,
        });
    },

    deleteSupport: async (id) => {
        return await apiClient(`/private/support/delete-support/${id}`, {
            method: 'DELETE',
        });
    },

    changeSupportStatus: async (id, isActive) => {
        return await apiClient(`/private/support/update-support-status/${id}`, {
            method: 'PATCH',
            body: { isActive },
        });
    },
};

export default supportService;
