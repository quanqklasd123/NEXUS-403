// src/utils/eventHandler.js
import axios from 'axios';

// Tạo apiClient để gọi API (tương tự như trong apiService)
const API_URL = 'http://localhost:5205/api';
const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Thêm interceptor để gắn token
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

/**
 * EventHandler - Xử lý các sự kiện của component trong Preview mode
 * @param {Object} eventConfig - Cấu hình event { type: 'navigate'|'notification'|'api'|'modal'|'variable', config: {...} }
 * @param {Function} navigate - Function navigate từ react-router-dom
 * @param {Function} setModalState - Function để set modal state (optional)
 * @param {Function} updateVariable - Function để update global variable (optional)
 */
export const handleEvent = async (eventConfig, navigate, setModalState = null, updateVariable = null) => {
    if (!eventConfig || !eventConfig.type) {
        console.warn('Event config không hợp lệ');
        return;
    }

    const { type, config } = eventConfig;

    try {
        switch (type) {
            case 'navigate':
                // Navigate to Page
                if (config && config.route) {
                    navigate(config.route);
                } else {
                    console.warn('Navigate action cần có route trong config');
                }
                break;

            case 'notification':
                // Show Notification
                if (config && config.message) {
                    // Sử dụng alert tạm thời, có thể thay bằng toast notification sau
                    alert(config.message);
                } else {
                    alert('Notification');
                }
                break;

            case 'api':
                // Call API
                if (config && config.endpoint) {
                    const method = config.method || 'GET';
                    const params = config.params || {};
                    
                    let response;
                    switch (method.toUpperCase()) {
                        case 'GET':
                            response = await apiClient.get(config.endpoint);
                            break;
                        case 'POST':
                            response = await apiClient.post(config.endpoint, params);
                            break;
                        case 'PUT':
                            response = await apiClient.put(config.endpoint, params);
                            break;
                        case 'DELETE':
                            response = await apiClient.delete(config.endpoint);
                            break;
                        default:
                            console.warn(`Method ${method} không được hỗ trợ`);
                            return;
                    }
                    
                    // Hiển thị kết quả nếu có
                    if (config.showResult && response) {
                        alert(`API Response: ${JSON.stringify(response.data)}`);
                    }
                } else {
                    console.warn('API action cần có endpoint trong config');
                }
                break;

            case 'modal':
                // Open Modal
                if (setModalState) {
                    setModalState({
                        isOpen: true,
                        content: config?.content || 'Modal content',
                        title: config?.title || 'Modal'
                    });
                } else {
                    console.warn('Modal action cần setModalState function');
                }
                break;

            case 'variable':
                // Update Variable
                if (updateVariable && config && config.variableName) {
                    updateVariable(config.variableName, config.value);
                } else {
                    console.warn('Variable action cần updateVariable function và variableName trong config');
                }
                break;

            default:
                console.warn(`Action type "${type}" không được hỗ trợ`);
        }
    } catch (error) {
        console.error('Lỗi khi xử lý event:', error);
        alert(`Lỗi: ${error.message || 'Có lỗi xảy ra khi thực thi action'}`);
    }
};

