import apiClient from './apiClient';

const employeeService = {
    getEmployees: (params) => {
        const queryParams = new URLSearchParams(params).toString();
        return apiClient(`/private/admins/get-admins?${queryParams}`);
    },

    getEmployeeById: (id) => apiClient(`/private/admins/get-admin/${id}`),

    createEmployee: (employeeData) => apiClient('/private/admins/create-admin', {
        method: 'POST',
        body: employeeData
    }),

    updateEmployee: (id, employeeData) => apiClient(`/private/admins/update-admin/${id}`, {
        method: 'PUT',
        body: employeeData
    }),

    deleteEmployee: (id) => apiClient(`/private/admins/delete-admin/${id}`, {
        method: 'DELETE'
    })
};

export default employeeService;
