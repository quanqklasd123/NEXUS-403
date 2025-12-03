// src/apiService.js
import axios from 'axios';

// URL Backend của bạn
const API_URL = 'http://localhost:5205/api';

// 1. Tạo một "instance" axios
const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// 2. (MA THUẬT NẰM Ở ĐÂY) Cấu hình "Interceptor"
// Interceptor là một "người gác cổng".
// Nó sẽ "chặn" MỌI request đi ra, và "tiêm" Token vào header.
apiClient.interceptors.request.use(
    (config) => {
        // Lấy token từ localStorage
        const token = localStorage.getItem('authToken');
        
        if (token) {
            // Nếu có token, gắn nó vào header
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config; // Gửi request đi tiếp
    },
    (error) => {
        // Xử lý lỗi
        return Promise.reject(error);
    }
);

// 3. Tạo các hàm gọi API tiện lợi
// Chúng ta sẽ dùng "apiClient" thay vì "axios"
const apiService = {
    // --- Auth ---
    login: (email, password) => {
        return apiClient.post('/auth/login', { email, password });
    },
    
    register: (username, email, password) => {
        // BE API của chúng ta cần 3 thông tin này
        return apiClient.post('/auth/register', { username, email, password });
    },

    googleLogin: (googleToken) => {
        // BE của chúng ta cần { "idToken": "..." }
        return apiClient.post('/auth/google-login', { idToken: googleToken });
    },

    // --- TodoLists ---
    getTodoLists: () => {
        return apiClient.get('/todolists');
    },

    // Lấy chi tiết MỘT list (sẽ chứa cả các items)
    getTodoListById: (id) => {
        return apiClient.get(`/todolists/${id}`);
    },

    createTodoList: (name) => {
        return apiClient.post('/todolists', { Name: name });
    },

    updateTodoList: (id, name) => {
        return apiClient.put(`/todolists/${id}`, { Name: name });
    },

    deleteTodoList: (id) => {
        return apiClient.delete(`/todolists/${id}`);
    },

    createTodoItem: (itemData) => {
        return apiClient.post('/todoitems', itemData);
    },

    // --- THÊM HÀM UPDATE ---
    // Cập nhật một item. BE của chúng ta cần *toàn bộ* DTO
    // ngay cả khi chỉ thay đổi 1 trường (do chúng ta dùng PUT)
    updateTodoItem: (id, itemData) => {
        // itemData sẽ là { title, isDone, priority, dueDate, todoListId }
        return apiClient.put(`/todoitems/${id}`, itemData);
    },

    // --- THÊM HÀM DELETE ---
    deleteTodoItem: (id) => {
        return apiClient.delete(`/todoitems/${id}`);
    },

    // --- AI ---
    suggestPriority: (title) => {
        // BE của chúng ta cần { "title": "..." }
        return apiClient.post('/ai/suggest-priority', { title });
    },

    // --- Dashboard ---
    getDashboardStats: () => {
        return apiClient.get('/dashboard/stats');
    },

    // --- Dashboard ---
    getDashboardStats: () => {
        return apiClient.get('/dashboard/stats');
    },

    // --- THÊM HÀM MỚI CHO KANBAN ---
    updateItemStatus: (id, newStatus) => {
        return apiClient.patch(`/todoitems/${id}/status`, { Status: newStatus });
    },

    getAllMyItems: () => {
        return apiClient.get('/todoitems/my-all');
    },

    getMarketplaceApps: () => {
        return apiClient.get('/marketplace/apps');
    },

    installApp: (id) => {
        return apiClient.post(`/marketplace/install/${id}`);
    },

    // HÀM MỚI: Lấy các component đã cài để dùng trong Builder
    getMyInstalledComponents: () => {
        return apiClient.get('/marketplace/my-components');
    },


    

    // --- PROJECTS (APP BUILDER) ---
    getProjects: () => {
        return apiClient.get('/projects');
    },

    getProject: (id) => {
        return apiClient.get(`/projects/${id}`);
    },

    createProject: (data) => {
        // data: { name, description, jsonData }
        return apiClient.post('/projects', data);
    },

    updateProject: (id, data) => {
        return apiClient.put(`/projects/${id}`, data);
    },

    deleteProject: (id) => {
        return apiClient.delete(`/projects/${id}`);
    },

    // Gọi API: POST /api/projects/{id}/publish
    publishProject: (projectId, appData) => {
        // appData chứa: { name, description, category, price }
        return apiClient.post(`/projects/${projectId}/publish`, appData);
    },

};

// Xuất "apiService" để các component khác có thể dùng
export default apiService;