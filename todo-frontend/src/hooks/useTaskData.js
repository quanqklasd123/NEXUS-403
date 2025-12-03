// src/hooks/useTaskData.js
// Custom hook để quản lý task data và lắng nghe events

import { useState, useEffect, useCallback, useMemo } from 'react';
import apiService from '../services/apiService';
import eventBus, { EVENTS } from '../utils/eventBus';

export default function useTaskData({ todoListId = null, isPreview = false }) {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Filter & Search & Sort state
    const [filters, setFilters] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [sort, setSort] = useState({ field: 'title', order: 'asc' });

    // Mock data cho preview mode
    const mockTasks = useMemo(() => [
        { id: 1, title: 'Design system components', status: 'Todo', priority: 'High', dueDate: '2025-12-10' },
        { id: 2, title: 'User authentication', status: 'Todo', priority: 'Medium', dueDate: '2025-12-12' },
        { id: 3, title: 'API integration', status: 'InProgress', priority: 'High', dueDate: '2025-12-15' },
        { id: 4, title: 'Database schema', status: 'InProgress', priority: 'Low', dueDate: '2025-12-08' },
        { id: 5, title: 'Project setup', status: 'Done', priority: 'Medium', dueDate: '2025-12-01' },
        { id: 6, title: 'Requirements doc', status: 'Done', priority: 'Low', dueDate: '2025-11-28' },
    ], []);

    // Fetch tasks
    const fetchTasks = useCallback(async () => {
        if (isPreview) {
            setTasks(mockTasks);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const data = await apiService.getAllMyItems();
            const items = Array.isArray(data) ? data : [];
            const filtered = todoListId ? items.filter(t => t.todoListId === todoListId) : items;
            setTasks(filtered);
        } catch (err) {
            console.error('Failed to fetch tasks:', err);
            setError(err.message);
            setTasks([]);
        } finally {
            setLoading(false);
        }
    }, [todoListId, isPreview, mockTasks]);

    // Initial fetch
    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    // Listen for events
    useEffect(() => {
        const unsubscribes = [
            // Tasks updated
            eventBus.on(EVENTS.TASKS_UPDATED, fetchTasks),
            
            // Filter change
            eventBus.on(EVENTS.FILTER_CHANGE, (data) => {
                setFilters(data.filters || {});
            }),
            
            // Filter clear
            eventBus.on(EVENTS.FILTER_CLEAR, () => {
                setFilters({});
            }),
            
            // Search change
            eventBus.on(EVENTS.SEARCH_CHANGE, (data) => {
                setSearchQuery(data.query || '');
            }),
            
            // Search clear
            eventBus.on(EVENTS.SEARCH_CLEAR, () => {
                setSearchQuery('');
            }),
            
            // Sort change
            eventBus.on(EVENTS.SORT_CHANGE, (data) => {
                if (data.sort) {
                    setSort(data.sort);
                }
            }),
            
            // Sort clear
            eventBus.on(EVENTS.SORT_CLEAR, () => {
                setSort({ field: 'title', order: 'asc' });
            }),
        ];

        // Also listen to window events for backward compatibility
        const handleTasksUpdated = () => fetchTasks();
        const handleFilterChange = (e) => setFilters(e.detail?.filters || {});
        const handleSearchChange = (e) => setSearchQuery(e.detail?.query || '');
        const handleSortChange = (e) => {
            if (e.detail?.sort) {
                setSort(e.detail.sort);
            }
        };
        
        window.addEventListener('tasks-updated', handleTasksUpdated);
        window.addEventListener('filter-change', handleFilterChange);
        window.addEventListener('search-change', handleSearchChange);
        window.addEventListener('sort-change', handleSortChange);

        return () => {
            unsubscribes.forEach(unsub => unsub());
            window.removeEventListener('tasks-updated', handleTasksUpdated);
            window.removeEventListener('filter-change', handleFilterChange);
            window.removeEventListener('search-change', handleSearchChange);
            window.removeEventListener('sort-change', handleSortChange);
        };
    }, [fetchTasks]);

    // Filtered tasks based on filters and search
    const filteredTasks = useMemo(() => {
        let result = [...tasks];

        // Apply filters
        if (filters.status) {
            result = result.filter(t => t.status === filters.status);
        }
        if (filters.priority) {
            result = result.filter(t => t.priority === filters.priority);
        }
        if (filters.dueDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            result = result.filter(t => {
                if (!t.dueDate) return false;
                const taskDate = new Date(t.dueDate);
                taskDate.setHours(0, 0, 0, 0);
                
                switch (filters.dueDate) {
                    case 'Today':
                        return taskDate.getTime() === today.getTime();
                    case 'This Week': {
                        const weekEnd = new Date(today);
                        weekEnd.setDate(weekEnd.getDate() + 7);
                        return taskDate >= today && taskDate <= weekEnd;
                    }
                    case 'This Month': {
                        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                        return taskDate >= today && taskDate <= monthEnd;
                    }
                    case 'Overdue':
                        return taskDate < today && t.status !== 'Done';
                    default:
                        return true;
                }
            });
        }

        // Apply search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(t => 
                t.title?.toLowerCase().includes(query) ||
                t.status?.toLowerCase().includes(query) ||
                t.priority?.toLowerCase().includes(query)
            );
        }

        // Apply sort
        if (sort.field) {
            result.sort((a, b) => {
                let aValue = a[sort.field];
                let bValue = b[sort.field];
                
                // Handle null/undefined
                if (aValue == null) aValue = '';
                if (bValue == null) bValue = '';
                
                // Handle dates
                if (sort.field === 'dueDate') {
                    aValue = aValue ? new Date(aValue).getTime() : 0;
                    bValue = bValue ? new Date(bValue).getTime() : 0;
                }
                
                // Handle strings
                if (typeof aValue === 'string') {
                    aValue = aValue.toLowerCase();
                }
                if (typeof bValue === 'string') {
                    bValue = bValue.toLowerCase();
                }
                
                // Compare
                if (aValue < bValue) return sort.order === 'asc' ? -1 : 1;
                if (aValue > bValue) return sort.order === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [tasks, filters, searchQuery, sort]);

    // Task actions
    const createTask = useCallback(async (taskData) => {
        if (isPreview) return;
        try {
            await apiService.createTodoItem({
                ...taskData,
                todoListId: todoListId || taskData.todoListId || 1,
            });
            eventBus.emit(EVENTS.TASK_CREATED, taskData);
            eventBus.emit(EVENTS.TASKS_UPDATED);
        } catch (err) {
            console.error('Failed to create task:', err);
            throw err;
        }
    }, [todoListId, isPreview]);

    const updateTask = useCallback(async (taskId, updates) => {
        if (isPreview) return;
        try {
            await apiService.updateTodoItem(taskId, updates);
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
            eventBus.emit(EVENTS.TASK_UPDATED, { taskId, updates });
            eventBus.emit(EVENTS.TASKS_UPDATED);
        } catch (err) {
            console.error('Failed to update task:', err);
            throw err;
        }
    }, [isPreview]);

    const updateTaskStatus = useCallback(async (taskId, status) => {
        if (isPreview) return;
        try {
            await apiService.updateItemStatus(taskId, status);
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
            eventBus.emit(EVENTS.TASK_UPDATED, { taskId, updates: { status } });
            eventBus.emit(EVENTS.TASKS_UPDATED);
        } catch (err) {
            console.error('Failed to update task status:', err);
            throw err;
        }
    }, [isPreview]);

    const deleteTask = useCallback(async (taskId) => {
        if (isPreview) return;
        try {
            await apiService.deleteTodoItem(taskId);
            setTasks(prev => prev.filter(t => t.id !== taskId));
            eventBus.emit(EVENTS.TASK_DELETED, { taskId });
            eventBus.emit(EVENTS.TASKS_UPDATED);
        } catch (err) {
            console.error('Failed to delete task:', err);
            throw err;
        }
    }, [isPreview]);

    return {
        // Data
        tasks: filteredTasks,
        allTasks: tasks,
        loading,
        error,
        
        // Filter/Search/Sort state
        filters,
        searchQuery,
        sort,
        
        // Actions
        fetchTasks,
        createTask,
        updateTask,
        updateTaskStatus,
        deleteTask,
        
        // Direct setters (for optimistic updates)
        setTasks,
        setFilters,
        setSearchQuery,
        setSort,
    };
}
