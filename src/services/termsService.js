import apiClient from './apiClient';

const termsService = {
    getTerms: async () => {
        return await apiClient('/private/terms/get-terms');
    },
    getTermById: async (id) => {
        return await apiClient(`/private/terms/get-term/${id}`);
    },
    createTerm: async (data) => {
        return await apiClient('/private/terms/create-term', {
            method: 'POST',
            body: data
        });
    },
    updateTerm: async (id, data) => {
        return await apiClient(`/private/terms/update-term/${id}`, {
            method: 'PUT',
            body: data
        });
    },
    deleteTerm: async (id) => {
        return await apiClient(`/private/terms/delete-term/${id}`, {
            method: 'DELETE'
        });
    },
    changeTermStatus: async (id, isActive) => {
        return await apiClient(`/private/terms/update-term-status/${id}`, {
            method: 'PATCH',
            body: { isActive }
        });
    }
};

export default termsService;
