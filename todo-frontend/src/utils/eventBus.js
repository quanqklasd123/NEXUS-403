// src/utils/eventBus.js
// Event Bus để giao tiếp giữa các components trong App Builder

class EventBus {
    constructor() {
        this.listeners = {};
    }

    // Đăng ký lắng nghe event
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
        
        // Return unsubscribe function
        return () => {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        };
    }

    // Phát event
    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }

    // Xóa tất cả listeners của một event
    off(event) {
        delete this.listeners[event];
    }

    // Xóa tất cả listeners
    clear() {
        this.listeners = {};
    }
}

// Singleton instance
const eventBus = new EventBus();

// Event types
export const EVENTS = {
    // View events
    VIEW_CHANGE: 'view-change',
    
    // Filter events
    FILTER_CHANGE: 'filter-change',
    FILTER_CLEAR: 'filter-clear',
    
    // Search events
    SEARCH_CHANGE: 'search-change',
    SEARCH_CLEAR: 'search-clear',
    
    // Sort events
    SORT_CHANGE: 'sort-change',
    SORT_CLEAR: 'sort-clear',
    
    // Task events
    TASKS_UPDATED: 'tasks-updated',
    TASK_CREATED: 'task-created',
    TASK_UPDATED: 'task-updated',
    TASK_DELETED: 'task-deleted',
    
    // Title events
    TITLE_CHANGE: 'title-change',
};

export default eventBus;
