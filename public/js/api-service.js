class APIService {
    constructor() {
        this.baseURL = CONFIG.API_URL;
    }

    async request(endpoint, options = {}) {
        const token = localStorage.getItem('authToken');
        const defaultOptions = {
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            mode: 'cors'
        };

        try {
            const response = await fetch(
                `${this.baseURL}${endpoint}`,
                { ...defaultOptions, ...options }
            );

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            // Add better error handling
            if (error.message === 'Failed to fetch') {
                throw new Error('Network error: Please check your connection and try again');
            }
            throw error;
        }
    }
}