import { getToken } from '../js/reg.js';

/**
 * Universal API Client with automatic token injection and 401 interception.
 */
class ApiClient {
    /**
     * Base request wrapper
     * @param {string} url 
     * @param {RequestInit} [options={}] 
     * @returns {Promise<any>}
     */
    async request(url, options = {}) {
        const token = getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers
        };

        try {
            const response = await fetch(url, config);

            // Global 401 Unauthorized interceptor
            if (response.status === 401) {
                localStorage.removeItem('token');
                if (!window.location.pathname.endsWith('register_form.html')) {
                    window.location.href = 'register_form.html';
                }
                return null;
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                const error = new Error(errorData?.message || `HTTP Error ${response.status}`);
                error.status = response.status;
                error.data = errorData;
                throw error;
            }

            return await response.json();
        } catch (error) {
            console.error(`[ApiClient Error] ${options.method || 'GET'} ${url}:`, error.message);
            throw error;
        }
    }

    get(url, options = {}) {
        return this.request(url, { ...options, method: 'GET' });
    }

    post(url, data, options = {}) {
        return this.request(url, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    patch(url, data, options = {}) {
        return this.request(url, {
            ...options,
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    delete(url, options = {}) {
        return this.request(url, { ...options, method: 'DELETE' });
    }
}

export const api = new ApiClient();
