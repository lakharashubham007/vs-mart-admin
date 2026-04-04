import apiClient from './apiClient';

const privacyService = {
    getPrivacies: async () => {
        return await apiClient('/private/privacy/get-privacies');
    },

    getPrivacyById: async (id) => {
        return await apiClient(`/private/privacy/get-privacy/${id}`);
    },

    createPrivacy: async (privacyData) => {
        return await apiClient('/private/privacy/create-privacy', {
            method: 'POST',
            body: privacyData,
        });
    },

    updatePrivacy: async (id, privacyData) => {
        return await apiClient(`/private/privacy/update-privacy/${id}`, {
            method: 'PUT',
            body: privacyData,
        });
    },

    deletePrivacy: async (id) => {
        return await apiClient(`/private/privacy/delete-privacy/${id}`, {
            method: 'DELETE',
        });
    },

    getActivePrivacy: async () => {
        return await apiClient('/private/privacy/get-active-privacy');
    },

    changePrivacyStatus: async (id, isActive) => {
        return await apiClient(`/private/privacy/update-privacy-status/${id}`, {
            method: 'PATCH',
            body: { isActive },
        });
    }
};

export default privacyService;
