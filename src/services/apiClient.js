import { BASE_URL } from '../config/env';

const apiClient = async (endpoint, options = {}) => {
    const { method = 'GET', body, headers = {}, ...customConfig } = options;
    const token = localStorage.getItem('token');

    const isFormData = body instanceof FormData;
    const defaultHeaders = {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...headers,
    };

    const config = {
        method,
        headers: defaultHeaders,
        ...customConfig,
    };

    if (body) {
        config.body = isFormData ? body : JSON.stringify(body);
    }

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, config);

        // Handle 401 Unauthorized globally if needed (e.g., auto-logout)
        if (response.status === 401) {
            // Optional: localStorage.removeItem('token'); window.location.href = '/login';
        }

        const contentType = response.headers.get('content-type');
        let data = {};

        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        }

        if (response.ok) {
            return data;
        }

        // Throw standardized error from backend message
        const errorMessage = data.message || data.error || 'Something went wrong';
        const error = new Error(errorMessage);
        error.status = response.status;
        error.data = data;
        throw error;
    } catch (err) {
        // Handle network errors or JSON parsing errors
        if (!err.status) {
            console.error('API Client Error:', err);
            err.message = 'Network error: Please check your connection';
        }
        throw err;
    }
};

export default apiClient;
