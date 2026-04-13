import apiClient from './apiClient';

const customerService = {
    getCustomers: async (params) => {
        const query = new URLSearchParams(params).toString();
        return await apiClient(`/private/users?${query}`);
    },

    registerCustomer: async (customerData) => {
        return await apiClient('/private/users/register-by-admin', {
            method: 'POST',
            body: customerData
        });
    },

    updateCustomerStatus: async (userId, status) => {
        return await apiClient(`/private/users/status/${userId}`, {
            method: 'PATCH',
            body: { status }
        });
    }
};

export default customerService;
