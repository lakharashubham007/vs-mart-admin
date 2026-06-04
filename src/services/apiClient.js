import { BASE_URL } from '../config/env';

const apiClient = async (endpoint, options = {}) => {
    const { method = 'GET', body, headers = {}, params, ...customConfig } = options;
    const token = localStorage.getItem('token');

    // Handle query parameters
    let url = `${BASE_URL}${endpoint}`;
    if (params) {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                queryParams.append(key, value);
            }
        });
        const queryString = queryParams.toString();
        if (queryString) {
            url += (url.includes('?') ? '&' : '?') + queryString;
        }
    }

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
        const response = await fetch(url, config);

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

// Attach helper methods to support apiClient.get(), apiClient.post(), etc.
apiClient.get = (endpoint, options = {}) => apiClient(endpoint, { ...options, method: 'GET' });
apiClient.post = (endpoint, body, options = {}) => apiClient(endpoint, { ...options, method: 'POST', body });
apiClient.put = (endpoint, body, options = {}) => apiClient(endpoint, { ...options, method: 'PUT', body });
apiClient.patch = (endpoint, body, options = {}) => apiClient(endpoint, { ...options, method: 'PATCH', body });
apiClient.delete = (endpoint, options = {}) => apiClient(endpoint, { ...options, method: 'DELETE' });

export default apiClient;
