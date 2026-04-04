import apiClient from './apiClient';

export const login = async (email, password) => {
    return apiClient('/public/login', {
        method: 'POST',
        body: { email, password }
    });
};

export const getMe = async () => {
    return apiClient('/private/me');
};

export const updateProfile = async (formData) => {
    return apiClient('/private/update-profile', {
        method: 'PUT',
        body: formData
    });
};

export const deleteProfileImage = async () => {
    return apiClient('/private/delete-profile-image', {
        method: 'DELETE'
    });
};

