import apiClient from './apiClient';

const roleService = {
    getRoles: () => apiClient('/private/roles/get-roles'),

    getRoleById: (id) => apiClient(`/private/roles/get-role/${id}`),

    createRole: (roleData) => apiClient('/private/roles/create-role', {
        method: 'POST',
        body: roleData
    }),

    updateRole: (id, roleData) => apiClient(`/private/roles/update-role/${id}`, {
        method: 'PUT',
        body: roleData
    }),

    deleteRole: (id) => apiClient(`/private/roles/delete-role/${id}`, {
        method: 'DELETE'
    })
};

export default roleService;
