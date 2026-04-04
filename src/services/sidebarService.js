import apiClient from './apiClient';

const sidebarService = {
    getAllMenus: () => apiClient('/private/sidebar/get-all-menus')
};

export default sidebarService;
