// services/googleCalendarService.js
import axios from 'axios';

const API_URL = 'http://localhost:5205/api';

// Tạo apiClient với interceptor để tự động thêm token
const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor để tự động thêm token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

const googleCalendarService = {
    // GET /api/google-calendar/auth-url
    getAuthUrl: async () => {
        const response = await apiClient.get('/google-calendar/auth-url');
        return response.data;
    },

    // GET /api/google-calendar/status
    getConnectionStatus: async () => {
        const response = await apiClient.get('/google-calendar/status');
        return response.data;
    },

    // DELETE /api/google-calendar/disconnect
    disconnect: async () => {
        const response = await apiClient.delete('/google-calendar/disconnect');
        return response.data;
    }
};

export default googleCalendarService;

