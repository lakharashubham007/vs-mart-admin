import apiClient from './apiClient';

const permissionService = {
    getPermissions: () => apiClient('/private/permissions/get-permissions')
};

export default permissionService;
