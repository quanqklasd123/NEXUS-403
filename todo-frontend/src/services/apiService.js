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

// 3. Response Interceptor - Xử lý lỗi 401 (Unauthorized) toàn cục
// Khi nhận được lỗi 401, tự động xóa token và redirect về trang login
apiClient.interceptors.response.use(
    (response) => {
        // Nếu response thành công, trả về bình thường
        return response;
    },
    (error) => {
        // Xử lý lỗi response
        if (error.response) {
            const status = error.response.status;
            
            // Nếu là lỗi 401 (Unauthorized) - Token không hợp lệ hoặc đã hết hạn
            if (status === 401) {
                // Xóa token khỏi localStorage
                localStorage.removeItem('authToken');
                
                // Chỉ redirect nếu không phải đang ở trang login hoặc register
                // Tránh redirect loop
                const currentPath = window.location.pathname;
                if (currentPath !== '/login' && currentPath !== '/register') {
                    // Redirect về trang login
                    window.location.href = '/login';
                }
            }
        }
        
        // Trả về error để component có thể xử lý nếu cần
        return Promise.reject(error);
    }
);

// 4. Tạo các hàm gọi API tiện lợi
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

    getCurrentUser: () => {
        return apiClient.get('/auth/me');
    },

    googleLogin: (idToken) => {
        return apiClient.post('/auth/google-login', { idToken });
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

    // --- THÊM HÀM MỚI CHO KANBAN ---
    updateItemStatus: (id, newStatus) => {
        return apiClient.patch(`/todoitems/${id}/status`, { Status: newStatus });
    },

    getAllMyItems: () => {
        return apiClient.get('/todoitems/my-all');
    },

    getMarketplaceApps: (category) => {
        const url = category && category !== 'All' 
            ? `/marketplace/apps?category=${encodeURIComponent(category)}`
            : '/marketplace/apps';
        return apiClient.get(url);
    },

    getMarketplaceAppDetail: (id) => {
        return apiClient.get(`/marketplace/apps/${id}`);
    },

    installApp: (id) => {
        return apiClient.post(`/marketplace/install/${id}`);
    },

    // HÀM MỚI: Lấy các component đã cài để dùng trong Builder
    getMyInstalledComponents: () => {
        return apiClient.get('/marketplace/my-components');
    },

    // Category APIs
    getCategories: () => {
        return apiClient.get('/marketplace/categories');
    },

    createCategory: (data) => {
        return apiClient.post('/marketplace/categories', data);
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

    // --- USER APPS (My Apps) ---
    getUserApps: (filter = 'all') => {
        return apiClient.get(`/userapps?filter=${filter}`);
    },

    getUserApp: (id) => {
        return apiClient.get(`/userapps/${id}`);
    },

    createUserApp: (data) => {
        return apiClient.post('/userapps', data);
    },

    saveAppFromBuilder: (data) => {
        return apiClient.post('/userapps/save-from-builder', data);
    },

    updateUserApp: (id, data) => {
        return apiClient.put(`/userapps/${id}`, data);
    },

    deleteUserApp: (id) => {
        return apiClient.delete(`/userapps/${id}`);
    },

    downloadMarketplaceApp: (marketplaceAppId) => {
        return apiClient.post(`/userapps/download/${marketplaceAppId}`);
    },

    // Generic methods for userAppService
    get: (url) => apiClient.get(url),
    post: (url, data) => apiClient.post(url, data),
    put: (url, data) => apiClient.put(url, data),
    delete: (url) => apiClient.delete(url),

    // --- ADMIN APIs ---
    // Users management
    getAdminUsers: () => {
        return apiClient.get('/admin/users');
    },
    
    lockUser: (userId) => {
        return apiClient.put(`/admin/users/${userId}/lock`);
    },
    
    unlockUser: (userId) => {
        return apiClient.put(`/admin/users/${userId}/unlock`);
    },
    
    deleteUser: (userId) => {
        return apiClient.delete(`/admin/users/${userId}`);
    },
    
    // Marketplace apps management
    getAdminMarketplaceApps: () => {
        return apiClient.get('/admin/marketplace-apps');
    },
    
    deleteMarketplaceApp: (appId) => {
        return apiClient.delete(`/admin/marketplace-apps/${appId}`);
    },

};

// Xuất "apiService" để các component khác có thể dùng
export default apiService;